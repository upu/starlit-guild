import test from "node:test";
import assert from "node:assert/strict";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { extraTravelDuration } from "../lib/story-stage-extra-travel.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { readFrame } from "../scripts/home-pixel-frames.mjs";

const basket = (cue) => cue.items.find((item) => item.art === "basket");
const keeper = (cue) => cue.extras.find((extra) => extra.id === "keeper");
const leon = (cue) => cue.actors.find((actor) => actor.id === "leon");

test("the keeper picks up the grounded basket and offers it before Leon accepts", () => {
  const previous = studyCue("tower-restoration-departure", 5, true);
  const cue = studyCue("tower-restoration-departure", 6, true);
  assert.deepEqual(basket(cue), basket(previous));
  assert.equal(basket(cue).actor, undefined);
  assert.equal(basket(cue).extra, undefined);
  assert.equal(leon(cue).carry, false);
  assert.equal(cue.finishBeforeAdvance, true);
  assert.ok(extraTravelDuration(keeper(cue), keeper(previous)) < cue.sequence[0].after);
  const beats = cue.sequence.map((beat) => ({ ...cue, ...beat }));
  assert.deepEqual(
    beats.map((beat) => keeper(beat).basketHandoff),
    ["reach", "reach", "lift", "offer", "offer", "offer", "idle", "idle"],
  );
  assert.deepEqual(
    beats.map((beat) => basket(beat).actor ?? basket(beat).extra),
    [undefined, "keeper", "keeper", "keeper", "keeper", "leon", "leon", "leon"],
  );
  for (const beat of [cue, ...beats]) assert.equal(basket(beat).width, 8);
  const offering = beats[4],
    accepted = beats[5];
  const npc = keeper(offering);
  const giver = { ...npc, wrist: stageExtraWrist(npc, false, 0) };
  const recipient = sampleStageActor(leon(accepted), leon(accepted), 0, false);
  const held = stageItemTarget(basket(offering), offering, new Map([["extra:keeper", giver]]));
  const taken = stageItemTarget(basket(accepted), accepted, new Map([["leon", recipient]]));
  assert.ok(Math.abs(held.x - taken.x) < 1);
  assert.ok(Math.abs(held.bottom - taken.bottom) < 1);
  assert.equal(stageExtraFrame(npc, false, 0), 22);
  assert.equal(leon(offering).carry, false, "recipient offers his palm before taking ownership");
});

test("the participants return without taking the basket away from Leon", () => {
  const cue = studyCue("tower-restoration-departure", 6, true);
  const final = { ...cue, ...cue.sequence.at(-1) };
  assert.equal(leon(final).x, 57);
  assert.equal(leon(final).left, true);
  assert.equal(leon(final).carry, true);
  assert.equal(basket(final).actor, "leon");
  assert.equal(keeper(final).x, 73);
  assert.equal(stageExtraFrame(keeper(final), true, 0), 8, "walking uses the registered gait");
  assert.equal(stageExtraFrame(keeper(final), false, 0), 23, "stop at standing stature");
  for (const line of [7, 8]) {
    const next = studyCue("tower-restoration-departure", line, true);
    const owner = sampleStageActor(leon(next), leon(next), 0, false);
    const before = sampleStageActor(leon(final), leon(final), 0, false);
    assert.deepEqual(
      stageItemTarget(basket(next), next, new Map([["leon", owner]])),
      stageItemTarget(basket(final), final, new Map([["leon", before]])),
    );
    assert.equal(basket(next).actor, "leon");
  }
});

test("the keeper's new bends retain his standing scale, lower body height and foot baseline", async () => {
  const cell = (frame) => ({ left: frame * 128, top: 0, width: 128, height: 128 });
  const original = await readFrame("public/storybook-study/keeper-poses-v1.webp", cell(0));
  for (let frame = 0; frame < 4; frame++) {
    const pose = await readFrame(
      "public/storybook-study/keeper-basket-handoff-v1.webp",
      cell(frame),
    );
    assert.equal(pose.box.top + pose.box.height, 120);
    assert.ok(pose.box.left > 2 && pose.box.left + pose.box.width < 126);
    if (frame === 0 || frame === 3) {
      assert.ok(Math.abs(pose.box.height - original.box.height) <= 2);
      assert.ok(Math.abs(pose.head.width - original.head.width) <= 2);
    } else assert.ok(pose.box.height < original.box.height);
    const walk = await readFrame("public/storybook-study/keeper-yard-walk-v1.webp", cell(frame));
    assert.equal(walk.box.top + walk.box.height, 120);
    assert.ok(Math.abs(walk.box.height - original.box.height) <= 1);
    assert.ok(Math.abs(walk.head.width - original.head.width) <= 2);
  }
});
