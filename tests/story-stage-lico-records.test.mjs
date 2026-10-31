import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { storyStageCue } from "../lib/story-stage.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageWrist } from "../lib/story-stage-wrists.ts";
import { stageItemTarget, stageItemVisible } from "../lib/story-stage-props.ts";

const previous = {
  aria: "0a09d63eda2ae6d0aaa6926f58ba76251e154a71f308856e23ea8cc401df7e56",
  leon: "e7d9ac5d783803217923998a742960ba3a4b9c1d5842a41d275989794d781035",
  mira: "7848a103f3f0a42740d824fb909ee3a618645851e3e739433c767bd4527043a1",
  finn: "b922cb1ccd22069a24ea86b537fec210f214be8c8c4159b49646ab233a199fec",
  lico: "ffc572ebd77bf9e174bc1286a9e7e391bef9755e660056dfc835851b4af57296",
  keeper: "008b4d52e7a1ffbdfcb8703538bd8757b30b5ae6aeec6eae9675ca96f9e54f3a",
  merchant: "4ac5b7d74515cef9e27f43342bce723353428bacf45730ef5dd14a5371ab4dc5",
};
test("records poses preserve old pixels and seated stature, heads, soles and gutters", async () => {
  for (const [id, hash] of Object.entries(previous)) {
    const file = `public/story-stage/${id}-poses.webp`,
      npc = ["keeper", "merchant"].includes(id);
    const height = npc ? 512 : 2432;
    const old = await sharp(file)
      .extract({ left: 0, top: 0, width: 512, height })
      .ensureAlpha()
      .raw()
      .toBuffer();
    assert.equal(createHash("sha256").update(old).digest("hex"), hash, id);
    if (!npc && id !== "lico") continue;
    const base = await readFrame(file, { left: 0, top: 0, width: 128, height: 128 });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    for (let i = 0; i < 4; i++) {
      const f = await readFrame(file, { left: i * 128, top: height, width: 128, height: 128 });
      const h = await headBounds(await sharp(f.cell).extract(f.box).png().toBuffer(), 0.25);
      assert.ok(Math.abs(h.width - head.width) <= 2, `${id}/${i} head`);
      assert.equal(f.box.height, npc ? 88 : 80, `${id}/${i} seated height`);
      assert.equal(f.box.top + f.box.height, 120);
      assert.ok(f.box.left >= 2 && f.box.left + f.box.width <= 126);
    }
  }
});

test("native paper counting replaces only the same paper and keeps original return hands together", () => {
  const c = storyStageCue("lico-records-departure", 31);
  const approach = c.sequence.find((s) => s.after === 2800),
    give = c.sequence.find((s) => s.after === 4100);
  const finn = approach.actors.find((a) => a.id === "finn"),
    merchant = give.extras.find((e) => e.id === "merchant");
  const pose = actorPose(finn, false, 0, false);
  const positions = new Map([
    ["finn", { ...finn, wrist: stageWrist("finn", pose.atlas, pose.frame) }],
    ["extra:merchant", { ...merchant, wrist: stageExtraWrist(merchant, false, 0) }],
  ]);
  const a = stageItemTarget(
    approach.items.find((p) => p.id === "orders"),
    c,
    positions,
  );
  const b = stageItemTarget(
    give.items.find((p) => p.id === "orders"),
    c,
    positions,
  );
  assert.ok(Math.hypot(a.x - b.x, a.bottom - b.bottom) < 0.2, JSON.stringify({ a, b }));
  const counting = c.sequence.find((s) => s.after === 4900),
    prop = counting.items.find((p) => p.id === "orders");
  for (const frame of [17, 18, 19])
    assert.equal(
      stageItemVisible(prop, new Map([["extra:merchant", { atlas: "conversation", frame }]])),
      false,
    );
  assert.equal(
    stageItemVisible(
      prop,
      new Map([["extra:merchant", { atlas: "conversation", frame: 16, wrist: { x: 91, y: 80 } }]]),
    ),
    true,
  );
  const writer = c.extras.find((e) => e.id === "keeper");
  assert.notEqual(stageExtraFrame(writer, false, 0), stageExtraFrame(writer, false, 450));
});

test("two books remain supported on the lap while physical handoffs complete before advancing", () => {
  for (const [id, lines] of [
    ["lico-records-departure", [6, 19, 31, 36, 40, 42]],
    ["lico-records-return", [0, 4, 8, 13, 26, 27]],
  ])
    for (const line of lines)
      assert.equal(storyStageCue(id, line).finishBeforeAdvance, true, `${id}/${line}`);
  for (const line of [9, 11, 14, 20, 21]) {
    const c = storyStageCue("lico-records-return", line);
    const props = c.sequence?.at(-1)?.items ?? c.items;
    const books = props.filter((p) => p.art === "ledger");
    assert.equal(books.length, 2);
    assert.ok(books.every((p) => p.actor === "lico" && p.support === "lap-board"));
    assert.ok(Math.abs(books[0].x - books[1].x) >= books[0].width);
    const lico = c.actors.find((a) => a.id === "lico");
    assert.equal(actorPose(lico, false, 0, false).onChair, true);
  }
  const opening = storyStageCue("lico-records-departure", 42);
  assert.equal(opening.items.find((p) => p.id === "reflector").glow, undefined);
  const uncovered = opening.sequence.find((s) => s.after === 2500);
  assert.equal(uncovered.items.find((p) => p.id === "reflector").glow, "bright");
  assert.equal(uncovered.items.find((p) => p.id === "reflector-cover").actor, "lico");
  assert.equal(
    opening.sequence.find((s) => s.after === 3200).items.find((p) => p.id === "reflector-cover")
      .actor,
    undefined,
  );
  assert.equal(
    storyStageCue("lico-records-return", 0).items.find((p) => p.id === "reflector").glow,
    undefined,
  );
});
