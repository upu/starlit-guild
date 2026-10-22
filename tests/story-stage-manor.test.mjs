import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { storyStageCue as cue } from "../lib/story-stage.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { extraTravelDuration } from "../lib/story-stage-extra-travel.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";
import { stageItemTarget, stageItemDepth } from "../lib/story-stage-props.ts";
import { readFrame, headBounds, spriteBounds } from "../scripts/home-pixel-frames.mjs";

const before = "riverside-manor-departure",
  after = "riverside-manor-return";
const moments = (value) => [value, ...(value.sequence ?? []).map((s) => ({ ...value, ...s }))];
const item = (value, id) => value.items.find((i) => i.id === id);
const actor = (value, id) => value.actors.find((a) => a.id === id);
const extra = (value, id) => value.extras.find((a) => a.id === id);

test("Finn reaches the service door before knocking, and the cook reaches him before grasping his shoulders", () => {
  const knock = moments(cue(before, 0));
  assert.equal(knock[0].background, "manor-kitchen");
  const finn = actor(knock[0], "finn");
  assert.ok(knock[1].after > journeyDuration(finn, { x: 70, bottom: 28 }));
  assert.deepEqual(
    [0, 180, 360].map((t) => actorPose(actor(knock[1], "finn"), false, t, false).frame),
    [44, 45, 44],
  );
  assert.equal(actorPose(actor(knock[1], "finn"), false, 180, true).frame, 44);
  assert.equal(actor(knock[2], "finn").knock, false);
  const meeting = moments(cue(before, 3));
  assert.equal(meeting[0].background, "manor-kitchen-open");
  assert.equal(meeting[0].cut, false);
  const walk = extra(meeting[1], "cook");
  assert.ok(
    meeting[2].after - meeting[1].after > extraTravelDuration(walk, extra(meeting[0], "cook")),
  );
  assert.equal(extra(meeting[2], "cook").grip, "reach");
  assert.equal(extra(meeting[3], "cook").grip, "hold");
  for (let line = 4; line <= 7; line++) {
    const value = cue(before, line);
    assert.equal(extra(value, "cook").grip, "hold");
    assert.equal(actor(value, "finn").pose, "idle");
  }
});

test("the stone stays one size while its three grooves are revealed and remains under the closed case", () => {
  const opening = moments(cue(after, 0));
  assert.equal(item(opening[0], "tower-stone").stored, true);
  assert.equal(item(opening[1], "tower-stone").stored, false);
  assert.equal(item(opening[2], "case").art, "display-open");
  assert.equal(item(opening[3], "tower-stone").extra, "worker");
  assert.equal(extra(opening[3], "worker").carry, true);
  assert.equal(item(opening[4], "tower-stone").art, "tower-stone-bottom");
  assert.equal(item(cue(after, 1), "tower-stone").art, "tower-stone-bottom");
  for (let line = 0; line < 22; line++) {
    for (const value of moments(cue(after, line))) {
      assert.equal(item(value, "tower-stone").width, 6.2);
      if (line >= 7) {
        assert.equal(item(value, "case").art, "display-closed");
        assert.equal(item(value, "tower-stone").stored, false);
      }
    }
  }
  const closing = moments(cue(after, 6));
  assert.equal(item(closing[1], "case").art, "display-closed");
  assert.equal(item(closing[1], "case-key").x, -7);
  assert.equal(item(closing[2], "case-key").x, 2);
  assert.ok(extra(closing[3], "worker").x > 100);
  const origin = new Map([["extra:worker", extra(closing[2], "worker")]]);
  assert.deepEqual(
    stageItemTarget(item(closing[2], "case-key"), closing[2], origin),
    stageItemTarget(item(closing[3], "case-key"), closing[3], origin),
    "the waist key must not jump when the departure target changes height",
  );
});

test("Aria tests light near and away from the closed case while Leon records its dimensions", () => {
  const sequence = moments(cue(after, 21));
  const target = (value, id) =>
    stageItemTarget(item(value, id), value, new Map(value.actors.map((a) => [a.id, a])));
  const distance = (value) =>
    Math.abs(target(value, "light-sample").x - item(value, "tower-stone").x);
  assert.ok(actor(sequence[1], "leon").writing);
  assert.equal(item(sequence[1], "shipping-copy"), undefined);
  assert.ok(distance(sequence[2]) > distance(sequence[1]) + 5);
  assert.equal(distance(sequence[3]), distance(sequence[1]));
  assert.equal(item(sequence[1], "light-sample").glow, "dim");
  assert.equal(item(sequence[2], "light-sample").glow, undefined);
  for (const value of sequence.slice(1)) {
    assert.equal(item(value, "light-sample").width, 3.5);
    assert.equal(item(value, "case").art, "display-closed");
    assert.ok(
      stageItemDepth(item(value, "light-sample"), value, new Map()) >
        stageItemDepth(item(value, "case"), value, new Map()),
      "the sample cloth stays visible in front of the glass",
    );
  }
});

test("new motion retains previous atlas pixels and matches the standing heads and padded foot line", async () => {
  const originals = [
    ["finn", 1408, "a1700e2f8cfc2b59e49130b39310b8f2734c15bab403b56af93a0ac9850e7301", [44, 45]],
    [
      "cook",
      128,
      "e4796687190ff4798cac309b26434519097136573e0b47f244db473ff55b4e50",
      [4, 5, 6, 7, 8, 9, 10, 11],
    ],
    [
      "merchant",
      256,
      "5c966dc90d6adcc34017e386fd5aa350c5e17d9e4ed6a747f29a1691799fe200",
      [8, 9, 10, 11],
    ],
  ];
  for (const [id, height, expected, added] of originals) {
    const atlas = `public/story-stage/${id}-poses.webp`;
    const bytes = await sharp(atlas)
      .extract({ left: 0, top: 0, width: 512, height })
      .ensureAlpha()
      .raw()
      .toBuffer();
    // Lossless WebP may choose arbitrary RGB behind fully transparent pixels.
    for (let i = 0; i < bytes.length; i += 4) if (!bytes[i + 3]) bytes.fill(0, i, i + 3);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected, id);
    const ref = await readFrame(atlas, { left: 0, top: 0, width: 128, height: 128 });
    const head = await headBounds(await sharp(ref.cell).extract(ref.box).png().toBuffer(), 0.25);
    for (const index of added) {
      const frame = await readFrame(atlas, {
        left: (index % 4) * 128,
        top: Math.floor(index / 4) * 128,
        width: 128,
        height: 128,
      });
      const current = await headBounds(
        await sharp(frame.cell).extract(frame.box).png().toBuffer(),
        0.25,
      );
      assert.ok(Math.abs(current.width - head.width) <= 2, `${id} ${index} head`);
      assert.equal(frame.box.top + frame.box.height, 120, `${id} ${index} foot`);
      assert.ok(
        frame.box.left >= 2 && frame.box.left + frame.box.width <= 126 && frame.box.top >= 2,
      );
    }
  }
  assert.deepEqual(
    [0, 180, 360, 540].map((t) => stageExtraFrame({ id: "cook" }, true, t)),
    [4, 5, 6, 7],
  );
  assert.deepEqual(
    [0, 180, 360, 540].map((t) => stageExtraFrame({ id: "merchant" }, true, t)),
    [8, 9, 10, 11],
  );
});

test("the loose stone cuts contain no glass-case fragments above their silhouettes", async () => {
  for (const name of ["tower-stone", "tower-stone-bottom"]) {
    const path = `public/story-stage/prop-${name}.webp`;
    const bounds = await spriteBounds(path);
    assert.ok(bounds.top > 100, `${name}: the short stone occupies the bottom of its shared cell`);
    assert.ok(bounds.width > 245, `${name}: unrelated upper-row pixels must not shrink the stone`);
    assert.equal(bounds.top + bounds.height, 320);
  }
});
