import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { storyStageCue } from "../lib/story-stage.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { stageExtraRows } from "../lib/story-stage-figure.ts";

test("both legacy trade and shared NPC renderers use the delivered merchant atlas dimensions", async () => {
  const metadata = await sharp("public/story-stage/merchant-poses.webp").metadata();
  const css = readFileSync("app/story-stage.css", "utf8");
  const legacy = css.match(/\.story-stage-merchant-sprite\s*\{([^}]+)\}/)[1];
  const size = legacy.match(/\/\s*(\d+)%\s+(\d+)%/);
  assert.deepEqual(size.slice(1).map(Number), [
    (metadata.width / 128) * 100,
    (metadata.height / 128) * 100,
  ]);
  assert.equal(stageExtraRows({ id: "merchant" }), metadata.height / 128);
});

test("service poses retain the existing merchant pixels, head size and padded ground contact", async () => {
  const path = "public/story-stage/merchant-poses.webp";
  const old = await sharp(path)
    .extract({ left: 0, top: 0, width: 512, height: 384 })
    .ensureAlpha()
    .raw()
    .toBuffer();
  assert.equal(
    createHash("sha256").update(old).digest("hex"),
    "a1662bbc7692fa2156bb6eb23bf03bcd02552213d42ec8a6df47c11ef7793039",
  );
  const base = await readFrame(path, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
  for (let i = 0; i < 4; i++) {
    const pose = await readFrame(path, { left: i * 128, top: 384, width: 128, height: 128 });
    const actual = await headBounds(
      await sharp(pose.cell).extract(pose.box).png().toBuffer(),
      0.25,
    );
    assert.ok(Math.abs(actual.width - head.width) <= 1);
    assert.equal(pose.box.height, i === 1 ? 92 : 96);
    assert.equal(pose.box.top + pose.box.height, 120);
    assert.ok(pose.box.left >= 2 && pose.box.left + pose.box.width <= 126);
  }
});

test("the same empty plate is picked up at the table edge before being raised above the palm", () => {
  const cue = storyStageCue("linde-requests-departure", 19);
  const pickup = cue.sequence.find((s) => s.items.some((i) => i.id === "cleared-plate" && i.extra));
  const plate = pickup.items.find((i) => i.id === "cleared-plate");
  const owner = pickup.extras[0];
  const positions = new Map([
    ["extra:merchant", { ...owner, wrist: stageExtraWrist(owner, false, 0) }],
  ]);
  const target = stageItemTarget(plate, { ...cue, ...pickup }, positions);
  const start = cue.items.find((i) => i.id === plate.id);
  assert.equal(start.width, plate.width);
  assert.ok(Math.hypot(target.x - start.x, ((target.bottom - start.bottom) * 2) / 3) < 1);
  const raised = cue.sequence.find((s) => s.extras[0].service === "raise");
  assert.ok(raised.after >= pickup.after + 650);
  const hand = stageExtraWrist(raised.extras[0], false, 0);
  const above = stageItemTarget(
    plate,
    cue,
    new Map([["extra:merchant", { ...owner, wrist: hand }]]),
  );
  assert.ok(above.bottom > target.bottom + 5);
  for (const moment of [cue, ...cue.sequence])
    assert.equal(moment.items.filter((i) => i.id === plate.id).length, 1);
});

test("the doctor's envelope stays in the visiting bag until the narration, and three distinct papers remain at the end", () => {
  for (let line = 0; line < 26; line++) {
    const cue = storyStageCue("linde-requests-departure", line);
    for (const moment of [cue, ...(cue.sequence ?? [])]) {
      const envelope = moment.items.find((i) => i.id === "mira-request");
      assert.ok(envelope.stored);
      assert.equal(envelope.carrier, "visiting-bag");
    }
  }
  const reveal = storyStageCue("linde-requests-departure", 26);
  assert.ok(
    reveal.sequence.some((s) =>
      s.items.some((i) => i.id === "mira-request" && i.actor === "mira" && !i.stored),
    ),
  );
  const final = storyStageCue("linde-requests-return", 16);
  const letters = final.items.filter((i) => i.id.endsWith("-request"));
  assert.equal(letters.length, 3);
  assert.equal(new Set(letters.map((i) => i.x)).size, 3);
  assert.ok(letters.every((i) => !i.actor && i.support === "table" && i.width < 8));
  assert.ok(!final.items.some((i) => i.art === "ledger"));
});
