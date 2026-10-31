import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";
import { extraTravelDuration, sampleExtraTravel } from "../lib/story-stage-extra-travel.ts";
import { sampleJourney } from "../lib/story-stage-travel.ts";
import { readFrame } from "../scripts/home-pixel-frames.mjs";

const id = "tower-restoration-return";
const keeper = (cue) => cue.extras.find((e) => e.id === "keeper");
const marks = (cue) => cue.items.filter((i) => i.art === "chalk-mark");

test("the keeper reaches the closed lid before drawing and returns before dialogue advances", () => {
  const cue = studyCue(id, 10, true),
    before = studyCue(id, 9, true);
  const beats = cue.sequence.map((beat) => ({ ...cue, ...beat }));
  const touch = beats.find((b) => keeper(b).hatchMark === "touch");
  assert.equal(cue.finishBeforeAdvance, true);
  assert.ok(extraTravelDuration(keeper(cue), keeper(before)) < touch.after);
  assert.equal(stageExtraFrame(keeper(touch)), 25);
  const returning = beats.find((b) => keeper(b).via?.some((v) => v.bottom === 23));
  const final = beats.at(-1);
  assert.ok(extraTravelDuration(keeper(returning), keeper(touch)) < final.after - returning.after);
  assert.equal(keeper(final).x, keeper(studyCue(id, 11, true)).x);
  assert.equal(keeper(final).bottom, keeper(studyCue(id, 11, true)).bottom);
  assert.equal(stageExtraFrame(keeper(cue), true, 180), 9, "walking uses the canonical blue gait");
  // Measured chalk tips in the registered two kneeling poses land on the stone cover.
  const tip = (x, y) => ({
    x: keeper(touch).x + ((x - 64) * 24) / 128,
    bottom: keeper(touch).bottom + ((128 - y) * 36) / 128,
  });
  for (const point of [tip(23, 94), tip(24, 102)]) {
    assert.ok(point.x > 64.7 && point.x < 65.5);
    assert.ok(point.bottom > 64.8 && point.bottom < 67.6);
  }
  const mark = marks(final)[0];
  assert.ok(Math.abs(mark.x - 65.1) < 0.01);
  assert.ok(Math.abs(mark.bottom + mark.width * 0.75 - 66.15625) < 0.01);
});

test("approach and return stay on the dry apron, clear of Aria returning from the wall", () => {
  const cue = studyCue(id, 10, true),
    before = studyCue(id, 9, true);
  const touch = cue.sequence.find((b) => keeper(b).hatchMark === "touch");
  const returning = cue.sequence.find((b) => b.after === 4550);
  const ariaStart = cue.actors.find((a) => a.id === "aria");
  const ariaReturn = cue.sequence[0].actors.find((a) => a.id === "aria");
  for (const [target, origin, start] of [
    [keeper(cue), keeper(before), 0],
    [keeper(returning), keeper(touch), 4550],
  ])
    for (let elapsed = 0; elapsed < 2600; elapsed += 25) {
      const at = sampleExtraTravel(target, origin, elapsed, false);
      assert.ok(
        at.x <= 89 && at.x >= 72 && (at.x <= 75 || at.bottom <= 23),
        "walk left of the wet outlet",
      );
      const aria = sampleJourney(ariaReturn, ariaStart, Math.max(0, start + elapsed - 350), false);
      for (const obstacle of [
        aria,
        ...cue.actors.filter((a) => a.id !== "aria"),
        ...cue.extras.filter((e) => e.id !== "keeper"),
      ]) {
        const gap = Math.hypot(at.x - obstacle.x, ((at.bottom - (obstacle.bottom ?? 14)) * 2) / 3);
        assert.ok(gap > 8, `clear ${obstacle.id} at ${start + elapsed}: ${gap}`);
      }
    }
});

test("chalk appears only during strokes and remains through basket pickup and the last tap", () => {
  for (let line = 0; line < 10; line++) assert.equal(marks(studyCue(id, line, true)).length, 0);
  const cue = studyCue(id, 10, true);
  assert.equal(marks(cue).length, 0);
  assert.deepEqual(
    cue.sequence.map((b) => marks(b).length),
    [0, 0, 1, 1, 2, 2, 2, 2],
  );
  const expected = marks(cue.sequence.at(-1));
  for (let line = 11; line <= 16; line++) {
    const next = studyCue(id, line, true);
    for (const beat of [next, ...(next.sequence ?? [])]) assert.deepEqual(marks(beat), expected);
  }
  assert.deepEqual(marks(storybookExitCue(id)), expected);
});

test("the keeper's head, low height, transparent gutters and boot baseline stay consistent", async () => {
  const name = "keeper-hatch-mark-v2";
  const metrics = JSON.parse(await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"));
  const source = await sharp(`assets/source/storybook/${name}.png`).metadata();
  assert.equal(source.hasAlpha, true);
  assert.ok(metrics.every((m) => m.scale === metrics[0].scale));
  for (let frame = 0; frame < 4; frame++) {
    const rect = { left: frame * 128, top: 0, width: 128, height: 128 };
    const pose = await readFrame(`public/storybook-study/${name}.webp`, rect);
    assert.equal(pose.box.top + pose.box.height, 120);
    assert.ok(pose.box.left >= 3 && pose.box.left + pose.box.width <= 125);
    assert.ok(Math.abs(pose.box.height - (frame === 1 || frame === 2 ? 68 : 93)) <= 1);
    const alpha = await sharp(`public/storybook-study/${name}.webp`)
      .extract(rect)
      .ensureAlpha()
      .raw()
      .toBuffer();
    assert.equal(alpha[3], 0);
    assert.equal(alpha[(127 * 128 + 64) * 4 + 3], 0);
  }
  assert.ok(Math.abs(metrics[0].upperSilhouetteWidth - 36) <= 2);
  assert.ok(Math.abs(metrics[3].upperSilhouetteWidth - 36) <= 2);
});

test("the next morning keeps the chalk on the closed lid, then on the removed lid", () => {
  const closed = studyCue("tower-moss-removal-departure", 0, true);
  const opened = studyCue("tower-moss-removal-departure", 1, true);
  const lid = (cue) => cue.items.find((item) => item.art === "inspection-lid");
  assert.deepEqual(lid(opened), lid(closed));
  assert.equal(marks(closed).length, 0, "chalk is drawn on the animated lid itself");
  assert.ok(lid(opened.sequence.at(-1)).x < 60);
  assert.deepEqual(
    lid(storybookExitCue("tower-moss-removal-departure")),
    lid(opened.sequence.at(-1)),
  );
});
