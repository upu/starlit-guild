import test from "node:test";
import assert from "node:assert/strict";
import * as game from "../lib/game.ts";
import { mossAmbushReview } from "../app/sprite-lab/storybook/moss-ambush-review.ts";

test("the review ambush clones the state and preserves the work target", () => {
  let state = game.act(
    game.testState(0, 8, 18, 10000),
    { type: "start", id: "tower-moss-removal", readDeparture: true, value: false },
    0,
  );
  for (let time = 0; time < 90000; time += 50) {
    state = game.settle(state, time);
    const run = state.squads[0].run;
    if (run?.node === 3 && !run.enemies?.some((enemy) => enemy.hp > 0)) break;
  }
  const before = JSON.stringify(state),
    original = state.squads[0].run;
  assert.ok(original?.road);
  const next = mossAmbushReview(state),
    run = next.squads[0].run;
  assert.equal(JSON.stringify(state), before, "the original state and save remain unchanged");
  assert.ok(run.enemies.some((enemy) => enemy.hp > 0));
  assert.equal(run.target, original.target);
  assert.equal(run.targetMax, original.targetMax);
  assert.ok(run.enemies.every((enemy) => run.road.opponents[enemy.id]));
  assert.equal(mossAmbushReview(next), next, "do not replace a battle already in progress");
});
