import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";

const id = "manor-survey-return";
const item = (step, name) => step.items.find((item) => item.id === name);
function target(step, name) {
  const cue = { ...studyCue(id, 0, true), ...step };
  const positions = new Map(
    cue.actors.map((actor) => [actor.id, sampleStageActor(actor, { ...actor }, 0, false)]),
  );
  for (const extra of cue.extras ?? [])
    positions.set(`extra:${extra.id}`, { ...extra, wrist: stageExtraWrist(extra, false, 0) });
  return stageItemTarget(item(step, name), cue, positions);
}
const gap = (a, b) => Math.hypot(a.x - b.x, a.bottom - b.bottom);

test("gardener and glove actions retain the standing body scale and padded boots", async () => {
  for (const [name, sole, height] of [
    ["gardener-survey-v1", 120, 94],
    ["finn-gloves-balanced-v2", 176, 148],
  ]) {
    const poses = JSON.parse(await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"));
    assert.equal(poses.length, 8);
    assert.equal(poses[0].height, height);
    for (const pose of poses) {
      assert.equal(pose.scale, poses[0].scale);
      assert.equal(pose.top + pose.height, sole);
      assert.ok(pose.left > 0 && pose.left + pose.width < (sole === 120 ? 128 : 192));
    }
    if (sole === 120) assert.ok(poses[6].height < height * 0.8);
  }
});

test("the same pot lowers to its ground contact before the gardener stands", () => {
  const cue = studyCue(id, 0, true);
  assert.equal(cue.finishBeforeAdvance, true);
  const crouch = cue.sequence.find((step) => step.extras[0].inspect);
  const placed = cue.sequence.find((step) => !item(step, "garden-pot").extra);
  assert.ok(crouch.after < placed.after);
  assert.ok(gap(target(crouch, "garden-pot"), target(placed, "garden-pot")) < 0.1);
  for (const step of [cue, ...cue.sequence]) assert.equal(item(step, "garden-pot").width, 6);
});

test("gloves and key are returned between matching palms after Finn reaches the gardener", () => {
  const cue = studyCue(id, 10, true);
  const opening = cue.actors.find((actor) => actor.id === "finn");
  const before = studyCue(id, 9, true).actors.find((actor) => actor.id === "finn");
  assert.ok(journeyDuration(opening, before) < cue.sequence[0].after);
  const givenGloves = cue.sequence.find(
    (step) => item(step, "work-gloves").extra && !item(step, "work-gloves").stored,
  );
  const offered = cue.sequence.find(
    (step) => item(step, "work-gloves").actor && item(step, "work-gloves").wristOffset.x === 0,
  );
  assert.ok(gap(target(offered, "work-gloves"), target(givenGloves, "work-gloves")) < 0.1);
  const givenKey = cue.sequence.find(
    (step) => item(step, "case-key").extra && item(step, "case-key").wrist,
  );
  const beforeKey = cue.sequence[cue.sequence.indexOf(givenKey) - 1];
  assert.ok(gap(target(beforeKey, "case-key"), target(givenKey, "case-key")) < 0.1);
  assert.equal(item(cue.sequence.at(-1), "case-key").wrist, undefined);
});

test("the garden path stays separate from the working court and empty hands follow the return", () => {
  const cue = studyCue(id, 10, true),
    aria = cue.actors.find((actor) => actor.id === "aria");
  assert.equal(aria.x, 14);
  assert.equal(aria.bottom, 73);
  assert.ok(aria.via.every((point) => point.x === 12));
  const care = studyCue(id, 13, true)
    .sequence.at(-1)
    .actors.find((actor) => actor.id === "mira");
  assert.equal(care.healing, "treat");
  assert.equal(care.x, 71.5);
  const shown = studyCue(id, 14, true).sequence.at(-1);
  assert.equal(shown.actors.find((actor) => actor.id === "finn").handAction, "wipe");
  assert.equal(
    shown.items.some((item) => item.actor === "finn" && !item.stored),
    false,
  );
});
