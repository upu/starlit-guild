import { test } from "node:test";
import assert from "node:assert/strict";
import { BrekkaArrivalTransition } from "../lib/road-brekka-arrival-transition.ts";

const state = (time, changes = {}) => ({
  ready: true,
  paused: false,
  instant: false,
  time,
  ...changes,
});

test("arrival is staged under black before the visual completion callback", () => {
  const transition = new BrekkaArrivalTransition();
  assert.deepEqual(transition.update(state(0, { ready: false })), {
    arrival: false,
    fade: 0,
    complete: false,
  });
  assert.deepEqual(transition.update(state(100)), { arrival: false, fade: 0, complete: false });
  assert.deepEqual(transition.update(state(450)), { arrival: true, fade: 1, complete: false });
  assert.deepEqual(transition.update(state(800)), { arrival: true, fade: 0, complete: true });
});

test("pause freezes arrival and reduced motion completes immediately", () => {
  const transition = new BrekkaArrivalTransition();
  transition.update(state(0));
  assert.equal(transition.update(state(500, { paused: true })).fade, 0);
  assert.equal(transition.update(state(850)).fade, 1);
  const reduced = new BrekkaArrivalTransition();
  assert.deepEqual(reduced.update(state(0, { instant: true })), {
    arrival: true,
    fade: 0,
    complete: true,
  });
});

test("a long delayed frame still displays black before changing the final layout", () => {
  const transition = new BrekkaArrivalTransition();
  transition.update(state(0));
  assert.deepEqual(transition.update(state(3000)), { arrival: true, fade: 1, complete: false });
  assert.deepEqual(transition.update(state(3350)), { arrival: true, fade: 0, complete: true });
});
