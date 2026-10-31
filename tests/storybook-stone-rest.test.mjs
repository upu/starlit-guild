import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";

const id = "matching-lantern-stone-return";
const item = (step, name) => step.items.find((value) => value.id === name);
function target(step, name) {
  const positions = new Map([
    ...step.actors.map((actor) => [actor.id, sampleStageActor(actor, actor, 0, false)]),
    ...(step.extras ?? []).map((extra) => [
      `extra:${extra.id}`,
      { ...extra, wrist: stageExtraWrist(extra, false, 0) },
    ]),
  ]);
  return stageItemTarget(item(step, name), { ...studyCue(id, 0, true), ...step }, positions);
}
const distance = (a, b) => Math.hypot(a.x - b.x, a.bottom - b.bottom);

test("writing, kettle and chair actions retain their standing scale and complete ground contact", async () => {
  for (const [name, sole, count] of [
    ["mason-paper-v1", 120, 8],
    ["leon-kettle-v1", 176, 8],
    ["aria-seat-v1", 176, 4],
  ]) {
    const poses = JSON.parse(await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"));
    assert.equal(poses.length, count);
    for (const pose of poses) {
      assert.equal(pose.scale, poses[0].scale);
      assert.equal(pose.top + pose.height, sole);
      assert.ok(pose.left > 0);
    }
    if (name === "aria-seat-v1") assert.ok(poses[2].height < poses[0].height);
  }
});

test("the selected stone and white cloth keep the original sample gap with one candidate covered", () => {
  const compared = studyCue(id, 5, true);
  const original = studyCue("riverside-manor-return", 21, true);
  const prior = { ...original, ...original.sequence.find((step) => step.after === 1500) };
  const gap = Math.abs(target(compared, "violet-stone").x - target(compared, "comparison-cloth").x);
  const priorGap = Math.abs(target(prior, "tower-stone").x - target(prior, "light-sample").x);
  assert.ok(Math.abs(gap - priorGap) < 0.1);
  assert.equal(item(compared, "dull-stone").art, "covered-stone");
  assert.equal(item(compared, "comparison-cloth").glow, "dim");
  assert.equal(item(compared, "violet-stone").width, item(prior, "tower-stone").width);
});

test("receipt and cup handoffs stay between the painted palms rather than falling back to floor coordinates", () => {
  const receipt = studyCue(id, 12, true);
  const received = receipt.sequence[0];
  assert.ok(
    distance(
      target({ ...receipt, actors: received.actors }, "sale-receipt"),
      target(received, "sale-receipt"),
    ) < 1.2,
  );
  const passed = receipt.sequence.at(-1),
    carried = receipt.sequence.at(-2);
  assert.equal(
    carried.actors.find((actor) => actor.id === "finn").x,
    passed.actors.find((actor) => actor.id === "finn").x,
  );
  assert.ok(distance(target(carried, "sale-receipt"), target(passed, "sale-receipt")) < 1.2);
  const cups = studyCue(id, 20, true),
    accepted = cups.sequence.at(-1);
  assert.ok(
    distance(
      target({ ...cups.sequence.at(-2), actors: accepted.actors }, "mira-cup"),
      target(accepted, "mira-cup"),
    ) < 0.7,
  );
  const rising = studyCue(id, 15, true);
  assert.ok(target(rising, "mira-cup").bottom > 25);
});

test("all four chairs remain present and retain size through reaching, carrying, release and sitting down", () => {
  const cue = studyCue(id, 21, true);
  assert.equal(cue.finishBeforeAdvance, true);
  const steps = [cue, ...cue.sequence];
  for (const id of ["finn", "leon", "aria", "mira"]) {
    const name = `chair-${id}`;
    const pickup = steps.findIndex((step) => item(step, name).actor === "finn");
    assert.ok(pickup > 0);
    assert.equal(steps[pickup - 1].actors.find((actor) => actor.id === "finn").inspect, true);
    assert.equal(item(steps[pickup], name).wristAnchor, "top");
    const drop = steps.findIndex((step, index) => index > pickup && !item(step, name).actor);
    assert.equal(steps[drop].actors.find((actor) => actor.id === "finn").inspect, true);
    for (const step of steps) {
      assert.equal(item(step, name).width, 8.5);
      assert.equal(item(step, name).seatFor, undefined);
    }
    for (const phase of ["lower", "settle"])
      assert.ok(
        steps.some(
          (step) => step.actors.find((actor) => actor.id === id)?.seatTransition === phase,
        ),
      );
  }
  const lower = cue.sequence[0];
  const placed = cue.sequence.find((step) => item(step, "kettle").support === "brazier");
  const cup = item(placed, "mira-cup"),
    table = item(placed, "table");
  assert.ok(Math.abs(cup.x - table.x) + cup.width / 2 < table.width / 2);
  assert.ok(distance(target(lower, "kettle"), target(placed, "kettle")) < 1);
  assert.ok(
    cue.sequence.every((step, index) => index === 0 || step.after > cue.sequence[index - 1].after),
  );
});
