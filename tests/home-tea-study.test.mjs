import test from "node:test";
import assert from "node:assert/strict";
import { teaStudyPose, teaPair, teaStudy, teaLabels } from "../lib/home-tea-study.ts";
import { teaFrame, residentAnimation, residentAtlas, residentIds } from "../lib/home-actor.ts";

test("authored tea directions keep all four poses and freeze without swapping hands", () => {
  for (let i = 0; i < 4; i++) {
    const time = i * teaStudy.step;
    assert.equal(residentAnimation("tea", time, 0, false).frame, i);
    assert.equal(teaFrame(time, false), i);
    assert.equal(teaFrame(time, true), i + 4);
    assert.equal(teaFrame(time, false, true), 0);
    assert.equal(teaFrame(time, true, true), 4);
    for (const id of residentIds) {
      for (const left of [false, true]) {
        const atlas = residentAtlas(id, "tea", i, true, left);
        assert.equal(atlas.name, `${id}-tea`);
        assert.equal(atlas.frame, i + (left ? 4 : 0));
        assert.equal(atlas.flip, false, "authored drinking hand must never be mirrored");
      }
    }
  }
  assert.equal(teaFrame(teaStudy.duration), 0);
  assert.equal(teaFrame(-1), 3);
});

test("tea stays seated with feet on the floor, a free lap hand and fixed limb lengths", () => {
  const base = teaStudyPose(0);
  assert.equal(teaLabels.length, 4);
  assert.equal(base.cup.y + 6, teaStudy.tableY, "lowered cup sits at table height");
  for (let t = 0; t <= 16000; t += 20) {
    const p = teaStudyPose(t);
    assert.ok(p.cup.y + 6 <= teaStudy.tableY, "cup never lowers toward the lap");
    for (const key of ["hip", "knee", "ankle", "restingHand", "shoulder"])
      assert.deepEqual(p[key], base[key]);
    assert.equal(p.hip.y, p.knee.y);
    assert.equal(p.ankle.x, p.knee.x);
    for (const [a, b] of [
      [p.shoulder, p.elbow],
      [p.elbow, p.hand],
    ]) {
      assert.ok(Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - 15) < 1e-8);
    }
    assert.equal(p.hand.x, p.cup.x - 8, "hand follows handle");
    assert.equal(p.hand.y, p.cup.y + 1);
    assert.ok(
      Math.hypot(p.restingHand.x - p.cup.x, p.restingHand.y - p.cup.y) > 10,
      "never holds cup with both hands",
    );
    if (p.drinking) {
      assert.equal(p.cup.y - 3, p.mouth.y);
      assert.equal(p.cup.x - 6, p.mouth.x);
      assert.equal(p.nod, 0, "do not nod through the cup");
    }
  }
});

test("partners take turns drinking and reacting, with a continuous loop", () => {
  for (let t = 0; t < 16000; t += 20) {
    const [a, b] = teaPair(t);
    assert.ok(!(a.drinking && b.drinking));
    if (a.drinking) assert.equal(b.smile, true);
    if (b.drinking) assert.equal(a.smile, true);
    const next = teaStudyPose(t + 20);
    assert.ok(Math.hypot(a.hand.x - next.hand.x, a.hand.y - next.hand.y) < 0.5);
  }
  assert.deepEqual(teaStudyPose(0), teaStudyPose(16000));
});
