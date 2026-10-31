import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { sampleJourney, journeyDuration } from "../lib/story-stage-travel.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";
import { sampleExtraTravel, extraTravelDuration } from "../lib/story-stage-extra-travel.ts";
import { readFrame } from "../scripts/home-pixel-frames.mjs";

const id = "tower-restoration-departure";
const person = (cue) => cue.extras.find((extra) => extra.id === "merchant");
const rope = (cue) => cue.items.find((item) => item.id === "last-rope");
const grip = (cue) => {
  const p = person(cue);
  const positions = new Map([
    ["extra:merchant", { ...p, wrist: stageExtraWrist(p, false, 0) }],
    ["item:repair-tool-cart", { x: 46, bottom: 34 }],
  ]);
  return stageItemTarget(rope(cue), cue, positions);
};

test("the same last rope leaves the cart only after a hand reaches it, then meets the floor before release", () => {
  const previous = studyCue(id, 0, true),
    cue = studyCue(id, 1, true);
  assert.equal(cue.finishBeforeAdvance, true);
  assert.deepEqual(rope(cue), rope(previous));
  assert.equal(stageExtraFrame(person(cue)), 20);
  const beats = cue.sequence.map((beat) => ({ ...cue, ...beat }));
  assert.deepEqual(grip(cue), grip(beats[0]), "palm and cart contact agree before taking the rope");
  assert.equal(rope(beats[0]).extra, "merchant");
  assert.equal(rope(beats[0]).carrier, undefined);
  const low = beats.find((beat) => beat.after === 3900);
  const released = beats.find((beat) => beat.after === 4350);
  assert.deepEqual(grip(low), grip(released), "rope does not jump when the low hand releases it");
  assert.equal(rope(released).extra, undefined);
  for (const beat of [cue, ...beats]) {
    assert.equal(rope(beat).width, 5);
    assert.ok(beat.items.some((item) => item.id === "repair-tool-cart"));
    assert.deepEqual(
      beat.extras.map((extra) => extra.id),
      cue.extras.map((extra) => extra.id),
    );
  }
});

test("carrying and empty return walk around the shaft tip and finish before the next working pose", () => {
  const cue = studyCue(id, 1, true),
    beats = cue.sequence.map((b) => ({ ...cue, ...b }));
  const outbound = beats.find((b) => b.after === 2050),
    returning = beats.find((b) => b.after === 5350);
  for (const [moving, origin, limit] of [
    [person(outbound), person(cue), 1150],
    [person(returning), { ...person(cue), x: 65.5, bottom: 30 }, 1150],
  ]) {
    assert.ok(extraTravelDuration(moving, origin) < limit);
    for (let elapsed = 0; elapsed <= limit; elapsed += 25) {
      const at = sampleExtraTravel(moving, origin, elapsed, false);
      assert.ok(at.x >= 58 && at.x <= 65.5);
      assert.ok(
        at.x >= 65 || at.bottom >= 43,
        "pass behind or outside the shafts, never through them",
      );
      for (const obstacle of [...cue.actors, ...cue.extras.filter((e) => e.id !== "merchant")]) {
        const gap = Math.hypot(at.x - obstacle.x, ((at.bottom - (obstacle.bottom ?? 14)) * 2) / 3);
        assert.ok(gap > 8, `clear ${obstacle.id} at ${elapsed}ms: ${gap}`);
      }
    }
  }
  assert.equal(person(outbound).carry, true);
  assert.ok(!person(returning).carry);
  const next = studyCue(id, 2, true);
  assert.deepEqual(person(next), person(beats.at(-1)));
  assert.deepEqual(rope(next), rope(beats.at(-1)));
});

test("unloaded props persist at the tower until the authored cut, and Leon approaches around the basket", () => {
  for (let line = 2; line < 9; line++) {
    const cue = studyCue(id, line, true);
    for (const beat of [cue, ...(cue.sequence ?? [])]) {
      assert.equal(rope(beat).x, 59.875);
      assert.equal(rope(beat).bottom, 32.65625);
      assert.ok(beat.extras.some((extra) => extra.id === "merchant"));
    }
  }
  const before = studyCue(id, 5, true),
    handoff = studyCue(id, 6, true);
  const leon = (cue) => cue.actors.find((a) => a.id === "leon");
  assert.ok(
    journeyDuration(leon(handoff), leon(before)) < 2250,
    "reach the handoff before extending his hand",
  );
  for (let elapsed = 0; elapsed <= 700; elapsed += 25) {
    const at = sampleJourney(leon(handoff), leon(before), elapsed, false);
    assert.ok(
      at.x <= 58 || at.bottom <= 8,
      "go in front of the grounded basket before turning toward it",
    );
  }
  const cut = studyCue(id, 9, true);
  assert.equal(cut.cut, true);
  assert.ok(!cut.items.some((item) => item.id === "repair-tool-cart" || item.id === "last-rope"));
  assert.ok(!cut.extras.some((e) => e.id === "merchant"));
  assert.equal(sampleStageActor(leon(handoff), leon(before), 0, false).visible, true);
});

test("the reuse strip preserves approved pose pixels, lower bends and a common foot baseline", async () => {
  const sources = [
    ["merchant-turn-carry-v2", 0],
    ["merchant-placement-v2", 1],
    ["merchant-turn-carry-v2", 2],
    ["merchant-turn-carry-v2", 3],
    ["merchant-placement-v2", 2],
    ["merchant-placement-v2", 3],
    ["merchant-placement-v2", 0],
    ["merchant-placement-v2", 0],
  ];
  for (const [index, [name, frame]] of sources.entries()) {
    const rect = {
      left: (index % 4) * 128,
      top: Math.floor(index / 4) * 128,
      width: 128,
      height: 128,
    };
    const actual = await sharp("public/storybook-study/merchant-repair-unload-v1.webp")
      .extract(rect)
      .ensureAlpha()
      .raw()
      .toBuffer();
    const expected = await sharp(`public/storybook-study/${name}.webp`)
      .extract({ ...rect, left: frame * 128, top: 0 })
      .ensureAlpha()
      .raw()
      .toBuffer();
    for (let pixel = 0; pixel < actual.length; pixel += 4) {
      assert.equal(actual[pixel + 3], expected[pixel + 3]);
      if (actual[pixel + 3])
        assert.deepEqual(actual.subarray(pixel, pixel + 3), expected.subarray(pixel, pixel + 3));
    }
    const pose = await readFrame("public/storybook-study/merchant-repair-unload-v1.webp", rect);
    assert.equal(pose.box.top + pose.box.height, 120);
    assert.equal(pose.box.height, index === 4 || index === 5 ? 78 : 94);
  }
  assert.deepEqual(
    await readFile("public/storybook-study/repair-rope-coil-v1.webp"),
    await readFile("public/story-stage/prop-rope-coil.webp"),
  );
});

test("the empty cart has real transparent margins and a registered wheel contact", async () => {
  const { data, info } = await sharp("public/storybook-study/waterway-empty-tool-cart-v1.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 420);
  assert.equal(info.height, 280);
  for (const [x, y] of [
    [0, 0],
    [419, 0],
    [0, 279],
    [419, 279],
  ])
    assert.equal(data[(y * 420 + x) * 4 + 3], 0);
  const frame = await readFrame("public/storybook-study/waterway-empty-tool-cart-v1.webp", {
    left: 0,
    top: 0,
    width: 420,
    height: 280,
  });
  assert.equal(frame.box.top + frame.box.height, 258);
  assert.ok(frame.box.left > 0 && frame.box.left + frame.box.width < 420);
});
