import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";
import { extraTravelDuration, sampleExtraTravel } from "../lib/story-stage-extra-travel.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { readFrame } from "../scripts/home-pixel-frames.mjs";
import { sampleJourney, journeyDuration } from "../lib/story-stage-travel.ts";

const id = "tower-moss-removal-departure";
const keeper = (cue) => cue.extras.find((e) => e.id === "keeper");
const lid = (cue) => cue.items.find((i) => i.art === "inspection-lid");
const light = (cue) => cue.items.some((i) => i.art === "inspection-glow");
function rendered(cue, moving = false, elapsed = 0, at = keeper(cue)) {
  const extra = keeper(cue);
  return stageItemTarget(
    lid(cue),
    cue,
    new Map([["extra:keeper", { ...at, wrist: stageExtraWrist(extra, moving, elapsed) }]]),
  );
}

test("the same solid cover is gripped before lifting and released only at the dry resting point", () => {
  const before = studyCue(id, 0, true),
    cue = studyCue(id, 1, true);
  const beats = cue.sequence.map((b) => ({ ...cue, ...b }));
  assert.equal(cue.finishBeforeAdvance, true);
  assert.deepEqual(lid(cue), lid(before));
  const grip = beats.find((b) => b.after === 3300),
    take = beats.find((b) => b.after === 3750);
  const low = beats.find((b) => b.after === 6400),
    release = beats.find((b) => b.after === 6900);
  for (const [a, b] of [
    [grip, take],
    [low, release],
  ]) {
    const from = rendered(a),
      to = rendered(b);
    assert.ok(Math.abs(from.x - to.x) < 0.001);
    assert.ok(Math.abs(from.bottom - to.bottom) < 0.001, "no ground/hand teleport");
  }
  assert.ok(rendered(beats.find((b) => b.after === 4700)).bottom > rendered(take).bottom + 4);
  for (const beat of [cue, ...beats]) {
    assert.equal(lid(beat).id, lid(before).id);
    assert.equal(lid(beat).width, lid(before).width);
    assert.deepEqual(
      beat.extras.map((e) => e.id),
      cue.extras.map((e) => e.id),
    );
  }
});

test("the approach, loaded sidestep and empty return arrive before the next action", () => {
  const cue = studyCue(id, 1, true),
    previous = studyCue(id, 0, true);
  const beats = cue.sequence.map((b) => ({ ...cue, ...b }));
  const carrying = beats.find((b) => b.after === 5200),
    prior = beats.find((b) => b.after === 4700);
  const returning = beats.find((b) => b.after === 7750),
    grounded = beats.find((b) => b.after === 7400);
  for (const [target, origin, limit] of [
    [keeper(cue), keeper(previous), 3300],
    [keeper(carrying), keeper(prior), 850],
    [keeper(returning), keeper(grounded), 4100],
  ]) {
    assert.ok(extraTravelDuration(target, origin) < limit);
    for (let elapsed = 0; elapsed <= limit; elapsed += 25) {
      const at = sampleExtraTravel(target, origin, elapsed, false);
      assert.ok(at.x <= 75 && at.bottom >= 24 && at.bottom <= 57.7, "remain on the dry apron");
      for (const a of [...cue.actors, ...cue.extras.filter((e) => e.id !== "keeper")]) {
        assert.ok(
          Math.hypot(at.x - a.x, ((at.bottom - (a.bottom ?? 14)) * 2) / 3) > 8,
          `clear ${a.id}`,
        );
      }
    }
  }
  assert.deepEqual(
    [0, 180, 360, 540].map((t) => stageExtraFrame(keeper(carrying), true, t)),
    [32, 33, 34, 35],
  );
  assert.equal(
    stageExtraFrame(keeper(beats.find((b) => b.after === 4200)), true, 180),
    30,
    "small weight shifts retain the half-rise pose",
  );
  assert.equal(
    stageExtraFrame(keeper(beats.find((b) => b.after === 6400)), true, 180),
    29,
    "lowering retains the bend while the keeper shifts his planted feet",
  );
  for (let elapsed = 0; elapsed < 750; elapsed += 30) {
    const at = sampleExtraTravel(keeper(carrying), keeper(prior), elapsed, false);
    const actual = rendered(carrying, true, elapsed, at);
    const hand = stageExtraWrist(keeper(carrying), true, elapsed);
    assert.ok(
      Math.abs(actual.x + 4.35 - (at.x + ((hand.x - 64) * 24) / 128)) < 0.001,
      "leftward travel keeps the right slab edge in the authored near hand",
    );
  }
  assert.equal(keeper(beats.at(-1)).x, keeper(studyCue(id, 2, true)).x);
});

test("the moss light waits for the gap and the removed lid stays clear of later kneeling feet", () => {
  const cue = studyCue(id, 1, true);
  assert.equal(light(studyCue(id, 0, true)), false);
  for (const b of [cue, ...cue.sequence.filter((b) => b.after < 5200)])
    assert.equal(light(b), false);
  assert.equal(light(cue.sequence.find((b) => b.after === 5200)), true);
  const resting = lid(cue.sequence.at(-1));
  for (let line = 2; line < 18; line++) {
    const c = studyCue(id, line, true);
    for (const beat of [c, ...(c.sequence ?? [])]) {
      assert.deepEqual(lid(beat), resting);
      assert.equal(light(beat), true);
      for (const a of beat.actors.filter((a) => a.inspect)) {
        const half = (resting.width * 1.5 * 205) / 200 / 1.5 / 2;
        assert.ok(a.x - resting.x > half + 2.5, "boots stay beyond the resting stone's edge");
      }
    }
  }
  assert.deepEqual(lid(storybookExitCue(id)), resting);
});

test("the moving lid uses clean alpha and keeper bends/gait retain the standing scale", async () => {
  const image = "public/storybook-study/inspection-stone-lid-v1.webp";
  const { data, info } = await sharp(image)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(data[3], 0);
  assert.ok(
    data[(100 * info.width + 100) * 4 + 3] >= 250,
    "the solid panel occludes over 98% of the moss",
  );
  for (const name of ["keeper-hatch-open-v1", "keeper-hatch-carry-walk-v2"]) {
    const metrics = JSON.parse(await readFile(`public/storybook-study/${name}-metrics.json`));
    assert.ok(metrics.every((m) => m.scale === metrics[0].scale));
    for (let frame = 0; frame < 4; frame++) {
      const pose = await readFrame(`public/storybook-study/${name}.webp`, {
        left: frame * 128,
        top: 0,
        width: 128,
        height: 128,
      });
      assert.equal(pose.box.top + pose.box.height, 120);
      assert.ok(pose.box.left > 2 && pose.box.left + pose.box.width < 126);
      if (name.includes("open") && frame === 1) assert.ok(pose.box.height < 70);
      else if (name.includes("walk")) assert.ok(pose.box.height >= 91 && pose.box.height <= 95);
    }
  }
  const walks = JSON.parse(
    await readFile("public/storybook-study/keeper-hatch-carry-walk-v2-metrics.json"),
  );
  assert.ok(
    walks[0].width - walks[1].width > 20 && walks[2].width - walks[3].width > 20,
    "passing poses visibly bring the boots under the pelvis between long strides",
  );
  assert.deepEqual(
    await sharp("assets/source/storybook/drain-inspection-bare-v1.png").raw().toBuffer(),
    await sharp("public/storybook-study/drain-inspection-bare-v1.png").raw().toBuffer(),
  );
});

test("the pair approaches the work from opposite sides, clear of people, the lid and the basket", () => {
  const before = studyCue(id, 6, true),
    cue = studyCue(id, 7, true);
  assert.equal(cue.finishBeforeAdvance, true);
  const duration = Math.max(
    ...cue.actors.map((a) =>
      journeyDuration(
        a,
        before.actors.find((b) => b.id === a.id),
      ),
    ),
  );
  for (let elapsed = 0; elapsed <= duration + 50; elapsed += 25) {
    const positions = cue.actors.map((a) => ({
      ...a,
      ...sampleJourney(
        a,
        before.actors.find((b) => b.id === a.id),
        elapsed,
        false,
      ),
    }));
    assert.ok(
      Math.hypot(
        positions[0].x - positions[1].x,
        ((positions[0].bottom - positions[1].bottom) * 2) / 3,
      ) > 8,
    );
    for (const at of positions) {
      for (const npc of cue.extras)
        assert.ok(Math.hypot(at.x - npc.x, ((at.bottom - (npc.bottom ?? 23)) * 2) / 3) > 8);
      if (Math.abs(at.x - 61) < 6.5)
        assert.ok(
          at.bottom <= 38 || at.bottom >= 52,
          "walk in front of or behind the grounded basket",
        );
      if (Math.abs(at.x - 51) < 7)
        assert.ok(at.bottom <= 56, "walk in front of the propped stone, not across it");
    }
  }
});
