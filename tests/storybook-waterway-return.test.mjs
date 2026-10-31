import test from "node:test";
import assert from "node:assert/strict";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";
import { storybookStageAttributes } from "../lib/storybook/presentation.ts";
import { stageBackground } from "../lib/storybook/stage-images.ts";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const id = "tower-restoration-return";
const basket = (cue) => cue.items.find((item) => item.art === "basket");
const actor = (cue, id) => cue.actors.find((actor) => actor.id === id);
const renderedBasket = (cue) =>
  stageItemTarget(
    basket(cue),
    cue,
    new Map(cue.actors.map((a) => [a.id, sampleStageActor(a, a, 0, false)])),
  );

test("dusk and rooted wall moss persist through the return conversation and exit", async () => {
  const expected = "/storybook-study/drain-inspection-dusk-v1.png";
  for (let line = 0; line <= 16; line++) {
    const cue = studyCue(id, line, true);
    assert.equal(stageBackground(id, line, cue), expected);
    for (const beat of [cue, ...(cue.sequence ?? [])]) {
      assert.ok(!beat.items.some((item) => item.id === "remaining" || item.art === "colony"));
      if (line !== 10) assert.equal(beat.extras.find((e) => e.id === "keeper").x, 89);
    }
  }
  assert.equal(stageBackground(id, 16, storybookExitCue(id)), expected);
  assert.equal(
    stageBackground(
      "tower-moss-removal-departure",
      0,
      studyCue("tower-moss-removal-departure", 0, true),
    ),
    "/storybook-study/drain-inspection-bare-v1.png",
    "the following workday keeps its daylight; a solid animated lid closes its inspection opening",
  );
  const source = await readFile("assets/source/storybook/drain-inspection-dusk-v1.png");
  const output = await readFile(`public${expected}`);
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.width, 1536);
  assert.equal(metadata.height, 1024);
  assert.deepEqual(
    await sharp(source).ensureAlpha().raw().toBuffer(),
    await sharp(output).ensureAlpha().raw().toBuffer(),
    "the registered image retains the approved source pixels",
  );
});

test("Aria walks to the masonry before kneeling and returns to the pair before the cloth exchange", () => {
  const before = studyCue(id, 6, true),
    cue = studyCue(id, 7, true);
  const aria = actor(cue, "aria"),
    origin = actor(before, "aria");
  assert.equal(cue.finishBeforeAdvance, true);
  assert.equal(aria.inspect, false);
  assert.equal(cue.sequence[0].actors.find((a) => a.id === "aria").inspect, true);
  assert.ok(journeyDuration(aria, origin) < cue.sequence[0].after);
  assert.ok(aria.x > origin.x && aria.bottom > (origin.bottom ?? 14));
  for (const line of [8, 9]) {
    assert.equal(actor(studyCue(id, line, true), "aria").x, aria.x);
    assert.equal(actor(studyCue(id, line, true), "aria").inspect, true);
  }
  const back = studyCue(id, 10, true),
    returning = back.sequence[0].actors.find((a) => a.id === "aria");
  assert.equal(actor(back, "aria").inspect, false);
  assert.ok(journeyDuration(returning, aria) < back.sequence.at(-1).after - back.sequence[0].after);
  assert.equal(returning.x, actor(studyCue(id, 11, true), "aria").x);
  for (const [target, from] of [
    [aria, origin],
    [returning, aria],
  ]) {
    for (let elapsed = 0; elapsed <= 2300; elapsed += 25) {
      const at = sampleJourney(target, from, elapsed, false);
      assert.ok(at.x <= 67 && at.bottom <= 40, "stay on the dry left bank");
      for (const obstacle of [actor(cue, "leon"), ...cue.extras]) {
        const gap = Math.hypot(at.x - obstacle.x, ((at.bottom - (obstacle.bottom ?? 14)) * 2) / 3);
        assert.ok(gap > 8, `clear ${obstacle.id}'s foothold at ${elapsed}ms: ${gap}`);
      }
    }
  }
});

test("the empty basket and stored tools stay on their ground throughout the return dialogue", () => {
  for (let line = 0; line <= 15; line++) {
    const cue = studyCue(id, line, true);
    for (const beat of [cue, ...(cue.sequence ?? [])]) {
      assert.deepEqual(renderedBasket({ ...cue, ...beat }), { x: 51.3, bottom: 6 });
      assert.equal(basket(beat).width, 8);
      assert.equal(basket(beat).actor, undefined);
      assert.equal(beat.items.find((item) => item.art === "tools").bottom, 72);
    }
  }
});

test("cloth is put away, both bend and grip, then the basket rises without a floor-to-hand jump", () => {
  const before = studyCue(id, 15, true),
    cue = studyCue(id, 16, true);
  assert.equal(cue.finishBeforeAdvance, true);
  assert.deepEqual(basket(cue), basket(before));
  assert.equal(actor(cue, "aria").carry, true, "she still has the returned cloth initially");
  assert.equal(actor(cue, "leon").carry, false);
  const [stowing, approach, lower, grip, lift, release, settled] = cue.sequence.map((b) => ({
    ...cue,
    ...b,
  }));
  assert.equal(stowing.items.find((item) => item.art === "cloth").actor, "aria");
  assert.ok(!approach.items.some((item) => item.art === "cloth"));
  for (const a of lower.actors) {
    assert.ok(
      journeyDuration(actor(approach, a.id), actor(stowing, a.id)) < lower.after - approach.after,
    );
    assert.equal(a.inspect, true);
    assert.equal(a.carry, false);
    assert.equal(a.bottom, 2);
  }
  assert.deepEqual(
    renderedBasket(lower),
    renderedBasket(grip),
    "the hands meet the basket before it leaves the ground",
  );
  assert.equal(basket(grip).actor, "leon");
  assert.ok(
    lift.actors.every((a) => a.carry),
    "both support the lift",
  );
  assert.ok(renderedBasket(lift).bottom > renderedBasket(grip).bottom);
  assert.ok(
    renderedBasket(lift).bottom - renderedBasket(grip).bottom < 6,
    "hold at waist, clear of the face",
  );
  assert.ok(Math.abs(renderedBasket(lift).x - renderedBasket(grip).x) < 0.001);
  assert.equal(actor(release, "aria").carry, false);
  assert.equal(actor(release, "leon").carry, true);
  assert.deepEqual(renderedBasket(release), renderedBasket(settled));
  for (const beat of [cue, ...cue.sequence]) {
    assert.equal(basket(beat).width, 8);
    assert.deepEqual(
      beat.extras.map((e) => e.id),
      cue.extras.map((e) => e.id),
    );
  }
  assert.equal(storybookStageAttributes(id, 16)["data-repair-basket-place"], true);
  assert.equal(storybookStageAttributes(id, 15)["data-repair-basket-place"], false);
});

test("the final tap keeps the held basket and walks back onto the dry path with a steady separation", () => {
  const cue = studyCue(id, 16, true),
    settled = { ...cue, ...cue.sequence.at(-1) };
  const exit = storybookExitCue(id);
  assert.deepEqual(basket(exit), basket(settled));
  for (let elapsed = 0; elapsed <= 3000; elapsed += 50) {
    const a = sampleJourney(actor(exit, "aria"), actor(settled, "aria"), elapsed, false);
    const l = sampleJourney(actor(exit, "leon"), actor(settled, "leon"), elapsed, false);
    assert.ok(
      Math.abs(l.x - a.x - 13) < 0.001,
      "walk together, clear of each other's feet and basket",
    );
    assert.ok(a.bottom >= 2 && a.bottom <= 14);
    assert.ok(l.bottom >= 2 && l.bottom <= 14);
    assert.ok(a.x <= 44 && l.x <= 57, "do not enter the wet outlet on the upper right");
  }
  assert.equal(actor(exit, "leon").carry, true);
  assert.equal(actor(exit, "aria").carry, false);
});
