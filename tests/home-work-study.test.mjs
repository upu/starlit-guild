import test from "node:test";
import assert from "node:assert/strict";
import { workStudy, workStudyPose, workPhase } from "../lib/home-work-study.ts";
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
test("hands work over the bench with continuous arms and planted feet", () => {
  const rest = workStudyPose(0);
  for (let t = 0; t < workStudy.duration; t += 5) {
    const p = workStudyPose(t, true);
    assert.ok(Math.abs(distance(p.shoulder, p.elbow) - 21) < 1e-8, "upper arm length");
    assert.ok(Math.abs(distance(p.elbow, p.hand) - 23) < 1e-8, "forearm length");
    assert.ok(
      p.hand.x >= 130 && p.hand.x <= 141 && p.hand.y >= 85 && p.hand.y <= 92,
      "working hand stays close to the tabletop",
    );
    assert.ok(distance(p.hand, p.support) >= 8, "hands remain distinct");
    assert.deepEqual(p.feet, rest.feet, "feet stay planted");
    assert.deepEqual(p.support, rest.support, "second hand holds the work steadily");
  }
});
test("four-pose reference and interpolated loop share their key poses and wrap continuously", () => {
  assert.equal(Math.floor(workPhase(-1)), 3);
  for (let i = 0; i < 4; i++) {
    assert.equal(workStudyPose(i * 400).frame, i);
    assert.deepEqual(workStudyPose(i * 400), workStudyPose(i * 400, true));
    assert.deepEqual(workStudyPose(i * 400), workStudyPose(i * 400 + 399));
  }
  assert.deepEqual(workStudyPose(0), workStudyPose(workStudy.duration));
  for (let t = 0; t < workStudy.duration; t += 5) {
    assert.ok(distance(workStudyPose(t, true).hand, workStudyPose(t + 5, true).hand) < 1);
  }
  assert.ok(workStudyPose(800).lean > workStudyPose(0).lean, "upper body follows the hands");
});
