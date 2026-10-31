import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storyArtAt } from "../lib/story-art.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
const depart = "keystone-night-road-departure",
  bridge = "keystone-night-road-return";
const actor = (s, id) => s.actors.find((a) => a.id === id);
const item = (s, id) => s.items.find((a) => a.id === id);
const gap = (a, b) => Math.hypot(a.x - b.x, a.bottom - b.bottom);
test("the visible tip of the hanging cover meets the servant's raised hand", () => {
  const cue = studyCue(depart, 0, true),
    step = cue.sequence[0];
  const servant = step.extras[0],
    cover = item(step, "cover-cloth");
  const pixel = cue.cell / 128;
  const pos = stageItemTarget(
    cover,
    cue,
    new Map([
      [
        "extra:merchant",
        {
          ...servant,
          wrist: stageExtraWrist(servant, false, 0),
        },
      ],
    ]),
  );
  const visibleTip = { x: pos.x, bottom: pos.bottom + (cover.width * 1.5 * (320 - 28)) / 256 };
  const hand = {
    x: servant.x + (30 - 64) * pixel,
    bottom: servant.bottom + (128 - 49) * pixel * 1.5,
  };
  assert.ok(gap(visibleTip, hand) < 0.1);
});
function clothPosition(cue, step) {
  const c = { ...cue, ...step };
  const at = new Map(c.actors.map((a) => [a.id, sampleStageActor(a, a, 0, false)]));
  return stageItemTarget(item(c, "palm-cloth"), c, at);
}
test("night hand and checking poses share a calibration scale and retain complete boots", async () => {
  for (const [name, count, height] of [
    ["finn-injury-balanced-v2", 8, 148],
    ["mira-check-v1", 4, 126],
    ["finn-pat-balanced-v2", 2, 148],
  ]) {
    const poses = JSON.parse(await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"));
    assert.equal(poses.length, count);
    assert.equal(poses[0].height, height);
    for (const p of poses) {
      assert.equal(p.scale, poses[0].scale);
      assert.equal(p.top + p.height, 176);
      assert.ok(p.left > 0 && p.left + p.width < 192);
    }
  }
});
test("cloth transfer remains between the two offered hands and animations finish before advancing", () => {
  const cue = studyCue(depart, 9, true);
  const transfer = cue.sequence[0];
  assert.ok(gap(clothPosition(cue, cue), clothPosition(cue, transfer)) < 1.4);
  for (const step of [cue, ...cue.sequence]) {
    assert.equal(item(step, "palm-cloth").wrist, true);
    assert.equal(item(step, "palm-cloth").wristAnchor, "bottom");
  }
  for (const [id, count] of [
    [depart, 13],
    [bridge, 13],
  ])
    for (let i = 0; i < count; i++) {
      const c = studyCue(id, i, true);
      if (c.sequence?.length || c.actors.some((a) => a.via?.length))
        assert.equal(c.finishBeforeAdvance, true);
    }
});
test("the free hand pats leftward without turning the bandaged hand away from Mira", () => {
  const cue = studyCue(bridge, 6, true);
  const pat = cue.sequence.find((s) => actor(s, "finn").handAction === "pat-touch");
  assert.equal(actor(pat, "finn").left, false);
  assert.equal(actor(pat, "finn").reachOver, "recovered-parcel");
  assert.equal(actor(pat, "mira").visit, "touch");
  assert.ok(actor(pat, "mira").x < actor(cue, "mira").x);
  assert.equal(actor(cue, "finn").bottom, actor(pat, "finn").bottom);
  assert.equal(item(cue, "front-pot").width, 6);
  assert.equal(item(cue, "recovered-parcel").carrier, "reception-cart");
});
test("the illustration stays at its authored reveal and the carried pot stays inside the stage", () => {
  assert.equal(storyArtAt(depart, 12), undefined);
  assert.match(storyArtAt(depart, 13).src, /mira-tends-finn/);
  const cue = studyCue(depart, 12, true),
    last = cue.sequence.at(-1),
    a = actor(last, "aria"),
    p = item(last, "display-pot");
  const at = new Map(last.actors.map((v) => [v.id, sampleStageActor(v, v, 0, false)]));
  const pos = stageItemTarget(p, cue, at);
  assert.ok(pos.x + p.width / 2 < 100);
  assert.equal(a.carryWalkFrames.length, 4);
  assert.equal(p.wristAnchor, "bottom");
});
