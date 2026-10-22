import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { storyStageCue as cue, sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget, stageItemVisible } from "../lib/story-stage-props.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";

test("low perched poses preserve walking head width, padding and foot contact", async () => {
  for (const id of ["aria", "leon", "mira", "finn"]) {
    const reference = await readFrame(`public/home-pixel/${id}.webp`, {
      left: 0,
      top: 0,
      width: 128,
      height: 128,
    });
    const head = await headBounds(
      await sharp(reference.cell).extract(reference.box).png().toBuffer(),
      0.25,
    );
    for (let i = 36; i < 44; i++) {
      const f = await readFrame(`public/story-stage/${id}-poses.webp`, {
        left: (i % 4) * 128,
        top: Math.floor(i / 4) * 128,
        width: 128,
        height: 128,
      });
      const actual = await headBounds(await sharp(f.cell).extract(f.box).png().toBuffer(), 0.25);
      assert.ok(
        Math.abs(head.width - actual.width) <= 2,
        `${id}/${i} head ${actual.width} vs ${head.width}`,
      );
      assert.equal(f.box.height, 80);
      assert.equal(f.box.top + f.box.height, 120);
      assert.ok(f.box.left >= 2 && f.box.left + f.box.width <= 126);
    }
  }
});

test("rocks and low stools remain separate from actors and walking overrides the seated pose", () => {
  for (const [id, line, who] of [
    ["tower-moss-removal-return", 2, "aria"],
    ["tower-moss-removal-return", 2, "leon"],
    ["mountain-entrance-return", 5, "mira"],
    ["berne-road-return", 1, "finn"],
    ["brekka-moss-beds-return", 49, "mira"],
  ]) {
    const stage = cue(id, line),
      a = stage.actors.find((a) => a.id === who);
    const seat = stage.items.find((p) => p.id === `seat-${who}`);
    assert.ok(a.seated && a.perch && seat, `${id}/${who}`);
    const seated = sampleStageActor(a, a, 5000, false);
    assert.ok(seated.frame >= 36 && seated.frame < 44);
    assert.equal(seated.onChair, false, "separate support must stay visible");
    assert.ok(stageItemVisible(seat, new Map([[who, seated]])));
    assert.equal(sampleStageActor(a, { ...a, x: a.x - 10 }, 100).atlas, "home");
    assert.equal(sampleStageActor({ ...a, seated: false }, a, 5000).frame < 6, true);
  }
  const lico = cue("brekka-moss-beds-return", 49).actors.find((a) => a.id === "lico");
  assert.equal(sampleStageActor({ ...lico, seated: false }, lico, 5000).onChair, false);
});

test("Lico reaches the label, receives support before walking and sits on the waiting stool", () => {
  const close = cue("brekka-moss-beds-return", 42).actors.find((a) => a.id === "lico");
  assert.ok(close.inspect && close.x < 25 && close.bottom >= 38);
  const rest = cue("brekka-moss-beds-return", 45);
  const start = rest.actors.find((a) => a.id === "lico");
  assert.ok(start.inspect);
  const supported = rest.sequence[0];
  assert.ok(!supported.actors.find((a) => a.id === "lico").inspect);
  const helper = supported.actors.find((a) => a.id === "mira");
  assert.ok(Math.abs(helper.x - start.x) <= 8);
  const destination = rest.sequence.at(-1).actors.find((a) => a.id === "lico");
  assert.ok(destination.stool && destination.seated);
  const stool = rest.items.find((p) => p.id === "lico-stool");
  assert.ok(stageItemVisible(stool, new Map([["lico", sampleStageActor(start, start, 0)]])));
  assert.equal(
    stageItemVisible(stool, new Map([["lico", sampleStageActor(destination, destination, 5000)]])),
    false,
  );
  assert.equal(rest.items.find((p) => p.id === "ledger").art, "closed-ledger");
});

test("Aria reaches each seated owner before taking their things, then sets them down", () => {
  const stage = cue("brekka-moss-beds-return", 50);
  for (const [itemId, ownerId, moveIndex, takeIndex] of [
    ["ledger", "lico", -1, 0],
    ["medicine", "mira", 1, 2],
  ]) {
    const move =
      moveIndex < 0
        ? { actors: stage.actors, items: stage.items, after: 0 }
        : stage.sequence[moveIndex];
    const take = stage.sequence[takeIndex];
    const origin =
      moveIndex < 0
        ? cue("brekka-moss-beds-return", 49).actors
        : stage.sequence[moveIndex - 1].actors;
    const aria = move.actors.find((a) => a.id === "aria");
    assert.ok(
      take.after - move.after >=
        journeyDuration(
          aria,
          origin.find((a) => a.id === "aria"),
        ),
    );
    const before = move.items.find((p) => p.id === itemId),
      after = take.items.find((p) => p.id === itemId);
    assert.equal(before.actor, ownerId);
    assert.equal(after.actor, "aria");
    const positions = new Map(move.actors.map((a) => [a.id, sampleStageActor(a, a, 5000)]));
    const from = stageItemTarget(before, stage, positions),
      to = stageItemTarget(after, stage, positions);
    assert.ok(
      Math.abs(from.x - to.x) < 1 && Math.abs(from.bottom - to.bottom) < 1,
      `${itemId} hands meet`,
    );
  }
  const settled = stage.sequence.at(-1);
  assert.ok(
    settled.items.filter((p) => ["ledger", "medicine"].includes(p.id)).every((p) => !p.actor),
  );
  assert.equal(settled.items.find((p) => p.id === "medicine").art, "delivery-bag");
  const leon = settled.actors.find((a) => a.id === "leon");
  for (const item of settled.items.filter((p) => ["ledger", "medicine"].includes(p.id)))
    assert.ok(
      item.bottom + (item.width * 1.5) / 1.3 < (leon.bottom ?? 14),
      "placed objects clear Leon's feet",
    );
});

test("the folded note is shown near Leon only after he approaches Finn", () => {
  const stage = cue("berne-road-return", 10),
    leon = stage.actors.find((a) => a.id === "leon");
  const before = cue("berne-road-return", 9).actors.find((a) => a.id === "leon");
  assert.ok(stage.sequence[0].after >= journeyDuration(leon, before));
  assert.equal(stage.items.find((p) => p.actor === "finn").art, "receipt-front");
  assert.ok(Math.abs(leon.x - stage.actors.find((a) => a.id === "finn").x) <= 11);
});
