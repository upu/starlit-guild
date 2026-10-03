import test from "node:test";
import assert from "node:assert/strict";
import { walkStudyPose } from "../lib/home-walk-study.ts";
test("walk reference swaps both arms, returns through neutral, and loops without a jump", () => {
  const handX = (f, s) => {
    const p = walkStudyPose(f)[s];
    return p.hand.x - p.shoulder.x;
  };
  for (const side of ["near", "far"]) {
    assert.ok(handX(0, side) * handX(4, side) < 0, side + " must swing behind as well as ahead");
    assert.ok(Math.abs(handX(2, side)) < 2);
    assert.ok(Math.abs(handX(6, side)) < 2);
  }
  for (let f = 0; f < 8; f += 0.125) {
    const p = walkStudyPose(f);
    assert.ok(Math.abs(p.near.angle + p.far.angle) < 1e-12);
    for (const s of [p.near, p.far]) {
      assert.ok(Math.abs(Math.hypot(s.hand.x - s.elbow.x, s.hand.y - s.elbow.y) - 12) < 1e-9);
      assert.ok(s.hand.y > s.shoulder.y + 22, "no forward chest-height reach");
    }
  }
  assert.deepEqual(walkStudyPose(0), walkStudyPose(8));
  const a = walkStudyPose(7.999).near.hand,
    b = walkStudyPose(0).near.hand;
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 0.02);
});
test("planted feet stay level and move back at a fixed pace during support", () => {
  const samples = Array.from({ length: 6 }, (_, i) => walkStudyPose(i).near);
  for (let i = 1; i < samples.length; i++) {
    assert.equal(samples[i].ankle.y, samples[0].ankle.y);
    assert.ok(Math.abs(samples[i].ankle.x - samples[i - 1].ankle.x + 4) < 1e-9);
  }
  assert.ok(walkStudyPose(6).near.ankle.y < samples[0].ankle.y);
});
