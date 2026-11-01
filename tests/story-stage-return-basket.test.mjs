import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue } from "../lib/story-stage.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageWrist } from "../lib/story-stage-wrists.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";

test("tower basket is offered before the handoff and leaves with Leon after contact", () => {
  const cue = storyStageCue("moss-transplant-return", 9);
  const basket = (s) => s.items.find((p) => p.id === "tower-basket");
  const offer = cue.sequence.find((s) => s.after === 4600);
  const receive = cue.sequence.find((s) => s.after === 6000);
  const depart = cue.sequence.find((s) => s.after === 6800);
  assert.equal(cue.finishBeforeAdvance, true);
  assert.equal(basket(cue).extra, undefined);
  const leon = offer.actors.find((a) => a.id === "leon");
  const worker = offer.extras.find((e) => e.id === "worker");
  const pose = actorPose(leon, false, 0, false);
  const positions = new Map([
    ["leon", { ...leon, wrist: stageWrist("leon", pose.atlas, pose.frame) }],
    ["extra:worker", { ...worker, wrist: stageExtraWrist(worker, false, 0) }],
  ]);
  assert.deepEqual(
    stageItemTarget(basket(offer), cue, positions),
    stageItemTarget(basket(receive), cue, positions),
  );
  assert.ok(worker.x - leon.x > 7);
  assert.ok(receive.after > journeyDuration(leon, { x: 35, bottom: 14 }));
  assert.ok(depart.after - receive.after >= 650);
  assert.equal(depart.actors.find((a) => a.id === "leon").carry, true);
  for (const state of [cue, ...cue.sequence, storyStageCue("moss-transplant-return", 14)]) {
    assert.equal(basket(state).width, 6);
  }
  assert.equal(basket(storyStageCue("moss-transplant-return", 14)).actor, "leon");
});

test("worker lifts moss from the stone before collecting the grounded basket", () => {
  const cue = storyStageCue("moss-transplant-return", 9);
  const item = (s, id) => s.items.find((p) => p.id === id);
  const grab = cue.sequence.find((s) => s.after === 900);
  const approach = cue.sequence.find((s) => s.after === 1800);
  const collect = cue.sequence.find((s) => s.after === 2800);
  const lift = cue.sequence.find((s) => s.after === 3600);
  const target = (s, id) => {
    const w = s.extras.find((e) => e.id === "worker");
    return stageItemTarget(
      item(s, id),
      cue,
      new Map([["extra:worker", { ...w, wrist: stageExtraWrist(w, false, 0) }]]),
    );
  };
  assert.deepEqual(target(cue, "peeled-moss"), target(grab, "peeled-moss"));
  assert.equal(item(approach, "peeled-moss").carrier, "tower-basket");
  assert.deepEqual(target(approach, "tower-basket"), target(collect, "tower-basket"));
  assert.ok(lift.after - collect.after >= 650);
  assert.equal(lift.extras.find((e) => e.id === "worker").carry, true);
  for (const s of [cue, ...cue.sequence]) assert.equal(item(s, "peeled-moss").width, 2.5);
});
