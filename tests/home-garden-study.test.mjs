import test from "node:test";
import assert from "node:assert/strict";
import { gardenPose, gardenPhase, gardenStudy } from "../lib/home-garden-study.ts";
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
test("garden arms remain connected and soles stay planted throughout both cycles", () => {
  for (const action of ["water", "inspect"]) {
    const rest = gardenPose(action, 0);
    for (let time = 0; time < gardenStudy.duration; time += 5) {
      const p = gardenPose(action, time, true);
      assert.ok(Math.abs(distance(p.shoulder, p.elbow) - 24) < 1e-8);
      assert.ok(Math.abs(distance(p.elbow, p.hand) - 25) < 1e-8);
      assert.deepEqual(p.feet, rest.feet);
      assert.ok(p.elbow.y > p.shoulder.y, "elbow bends down, never behind the head");
      assert.ok(p.crouch <= 5, "observe with a slight knee bend, not floor sitting");
      assert.ok(p.hand.x < 144, "hand stays beside the leaves, not inside the planter");
    }
    const last = gardenPose(action, gardenStudy.duration - 0.001, true);
    assert.ok(distance(rest.hand, last.hand) < 0.001);
    assert.ok(Math.abs(rest.lean - last.lean) < 0.001);
  }
});
test("water comes from the tilted spout above the roots, never from an upright can", () => {
  for (let time = 0; time < gardenStudy.duration; time += 5) {
    const p = gardenPose("water", time, true);
    if (p.pouring) {
      assert.ok(p.tilt >= 12);
      assert.ok(p.spout.x > 145 && p.spout.x < 165);
      assert.ok(p.spout.y > 100 && p.spout.y < 132);
    }
    assert.equal(gardenPose("inspect", time, true).pouring, false);
  }
  assert.equal(gardenPose("water", 1200).pouring, true);
  assert.equal(gardenPose("water", 1800).pouring, false);
  assert.equal(gardenPhase(-600), 3);
  assert.equal(gardenPhase(2400), 0);
});
test("observation brings head and shoulders toward leaves without moving the feet", () => {
  const rest = gardenPose("inspect", 0),
    look = gardenPose("inspect", 1200);
  assert.ok(look.shoulder.x - rest.shoulder.x >= 10);
  assert.ok(look.shoulder.y - rest.shoulder.y >= 10);
  assert.ok(look.crouch > rest.crouch);
});
