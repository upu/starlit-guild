import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { foundingAmbushReview } from "../app/sprite-lab/storybook/founding-ambush-review.ts";

function start() {
  const quest = "starlit-guild-founding";
  let state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === quest),
    40,
    10000,
  );
  const interlude = pendingInterlude(state);
  if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
  state = act(
    state,
    { type: "start", id: quest, readDeparture: true, value: false },
    state.updatedAt,
  );
  for (let i = 0; i < 1000 && state.squads[0].run?.phase !== "work"; i++)
    state = settle(state, state.updatedAt + 100);
  return state;
}

test("the founding review ambush preserves the work and original state, and does not replace an active battle", () => {
  const state = start(),
    original = JSON.stringify(state),
    before = state.squads[0].run;
  const next = foundingAmbushReview(state),
    run = next.squads[0].run;
  assert.equal(JSON.stringify(state), original);
  assert.notEqual(next, state);
  assert.equal(run.quest, before.quest);
  assert.equal(run.node, before.node);
  assert.equal(run.target, before.target);
  assert.equal(run.targetMax, before.targetMax);
  assert.ok(
    run.enemies.every(
      (enemy) => enemy.hp > 0 && Number.isFinite(enemy.nextAt) && run.road.opponents[enemy.id],
    ),
  );
  assert.equal(foundingAmbushReview(next), next);
});

test("the injected opponents approach, attack, take damage and finish through the real simulation", () => {
  let state = foundingAmbushReview(start());
  const initial = structuredClone(state.squads[0].run.road.opponents);
  let moved = false,
    attacked = false,
    defeated = false;
  for (let i = 0; i < 600 && !defeated; i++) {
    state = settle(state, state.updatedAt + 100);
    const run = state.squads[0].run;
    assert.ok(run);
    moved ||= Object.entries(run.road.opponents).some(([id, point]) => point.x !== initial[id]?.x);
    attacked ||= run.events.some((event) => event.kind === "hurt" && event.target);
    defeated ||= !run.enemies.some((enemy) => enemy.hp > 0);
  }
  assert.ok(moved, "opponents walk toward the party");
  assert.ok(attacked, "the enemy lands an actual attack");
  assert.ok(defeated, "the battle can end without a visual-only enemy toggle");
});
