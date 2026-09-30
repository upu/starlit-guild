import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { LabAffection } from "../lib/guild-lab-affection.ts";
import { labShadow, labSole } from "../lib/guild-lab-contact.ts";
import { labRig } from "../lib/guild-lab-rig.ts";
import { guildLabArt } from "../lib/guild-lab-art.ts";
import { labPose, labJoint, LAB_ACTOR_SCALE } from "../lib/guild-lab-model.ts";
import { portraitExpressions } from "../lib/portrait-expressions.ts";
import { labWalkingArm, labArmArtwork } from "../lib/guild-lab-arms.ts";

test("tea, work arrival, yawning and waking choose familiar expression names", () => {
  const mood = new LabAffection(() => 0.5);
  assert.equal(mood.sample(5000, false).expression, "neutral");
  assert.equal(mood.sample(6700, false).expression, "smile");
  assert.equal(mood.sample(6700, false).mark, "note");
  mood.enter("work", 8000);
  assert.equal(mood.sample(8100, false).mark, "sweat");
  assert.equal(mood.sample(8100, false).expression, "serious");
  mood.enter("idle", 10000);
  assert.ok(mood.sample(36200, false).yawn);
  assert.equal(mood.sample(38500, false).expression, "tired");
  mood.tap(39000);
  assert.equal(mood.sample(39000, false).expression, "surprised");
  assert.equal(mood.sample(39500, false).expression, "smile");
  assert.equal(mood.sample(42500, false).expression, "neutral");
  for (const t of [5000, 39000, 39500])
    assert.ok(portraitExpressions.includes(mood.sample(t, true).expression));
});
test("touches vary, repeat touches blush, and reduced motion preserves expression without movement", () => {
  const mood = new LabAffection(() => 0.5);
  mood.tap(1000);
  assert.equal(mood.sample(1100, false).mark, "notice");
  assert.ok(mood.sample(1100, false).squash > 0);
  assert.ok(mood.sample(1450, false).jump > 0);
  assert.equal(mood.sample(1500, false).mark, "heart");
  const reduced = mood.sample(1450, true);
  assert.equal(reduced.expression, "smile");
  assert.equal(reduced.mark, "heart");
  assert.deepEqual([reduced.jump, reduced.stretch, reduced.squash, reduced.look], [0, 0, 0, 0]);
  mood.tap(1600);
  assert.equal(mood.sample(1700, false).expression, "shy");
  assert.ok(mood.sample(1700, false).blush);
  assert.equal(mood.sample(1700, false).mark, "thought");
  mood.tap(5000);
  mood.tap(8000);
  assert.equal(mood.sample(8500, false).mark, "notice");
  mood.lookAt(11000, -1);
  assert.ok(mood.sample(11100, false).look < 0);
  assert.equal(mood.sample(11100, true).look, 0);
});
test("idle gestures occur in 10-20 seconds and can look, stretch or hum", () => {
  for (const [random, gesture] of [
    [0, "look"],
    [0.5, "stretch"],
    [0.99, "hum"],
  ]) {
    const mood = new LabAffection(() => random);
    mood.enter("idle", 100);
    assert.equal(mood.sample(10099, false).gesture, "none");
    const at = 10100 + random * 10000;
    mood.sample(at, false);
    const pose = mood.sample(at + 700, false);
    assert.equal(pose.gesture, gesture);
    const still = mood.sample(at + 700, true);
    assert.equal(still.stretch, 0);
    assert.equal(still.look, 0);
    assert.equal(mood.sample(at + 2400, false).gesture, "none");
  }
});
const part = async (frame) => {
  const [left, top, width, height] = guildLabArt.frames[frame];
  return {
    width,
    height,
    data: await sharp(`public${guildLabArt.asset}`)
      .extract({ left, top, width, height })
      .ensureAlpha()
      .raw()
      .toBuffer(),
  };
};
test("both shoulders sit in the new torso, the far glove stays above the hem, and cape stays narrow", async () => {
  const torso = await part(labRig.torso.frame),
    scale = labRig.torso.height / torso.height;
  for (const arm of labRig.arms) {
    const px = Math.round(torso.width / 2 + (arm.joint.x - labRig.torso.x) / scale);
    const py = Math.round(torso.height / 2 + (arm.joint.y - labRig.torso.y) / scale);
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++)
        assert.ok(torso.data[((py + dy) * torso.width + px + dx) * 4 + 3] > 240);
  }
  const arm = labRig.arms[0],
    glove = await part(arm.frames[1]);
  assert.ok(arm.layer < labRig.legs[0].layer);
  const art = labArmArtwork(arm.frames[1], arm.lengths[1]),
    s = art.scale;
  const [px, py] = guildLabArt.armJoints[arm.frames[1]].proximal;
  const hem = labRig.torso.y + labRig.torso.height / 2;
  for (let t = 0; t < 900; t += 10) {
    const a = labWalkingArm(t, 0);
    const elbow = { x: -Math.sin(a.upper) * arm.lengths[0], y: Math.cos(a.upper) * arm.lengths[0] };
    for (let row = 0; row < glove.height; row += 3)
      for (let col = 0; col < glove.width; col += 3) {
        if (glove.data[(row * glove.width + col) * 4 + 3] < 200) continue;
        const x = (col - px) * s,
          y = (row - py) * s;
        const angle = a.upper + a.lower + art.rotation;
        const paintedY =
          arm.joint.y + (elbow.y + x * Math.sin(angle) + y * Math.cos(angle)) * a.scale;
        assert.ok(paintedY < hem, `far glove stays above hem at ${t}ms: ${paintedY}`);
      }
    const cape = guildLabArt.frames[labRig.cape.frame],
      width = (cape[2] / cape[3]) * labRig.cape.height;
    const sway = labPose(t, "walk", false).cape;
    assert.ok(
      width * Math.cos(sway) + labRig.cape.height * Math.abs(Math.sin(sway)) < torso.width * scale,
    );
  }
  assert.ok(labRig.cape.height <= labRig.torso.height);
});
test("shadow touches the planted sole at all stride phases, standing and work", () => {
  for (const mode of ["idle", "walk", "work"])
    for (let t = 0; t < 900; t += 10) {
      const shadow = labShadow(t, mode),
        index = mode === "walk" && t % 900 >= 450 ? 1 : 0;
      const sole = labSole(t, mode, index);
      assert.ok(sole.y * LAB_ACTOR_SCALE >= shadow.y - shadow.height / 2);
      assert.ok(Math.abs(sole.x * LAB_ACTOR_SCALE - shadow.x) < shadow.width / 2);
      assert.ok(shadow.height < 7 && shadow.width > 31);
    }
});
test("the near glove keeps the thumb side upward when holding a cup or working", async () => {
  const arm = labRig.arms[1],
    glove = await part(arm.frames[1]);
  // Landmarks on the original downward-pointing glove: thumb pad and opposite side at the same distance from the wrist.
  const thumb = { x: glove.width - 1 - 35, y: 183 },
    outerEdge = { x: glove.width - 1 - 85, y: 183 };
  for (const point of [thumb, outerEdge])
    assert.ok(glove.data[(point.y * glove.width + point.x) * 4 + 3] > 240);
  for (const mode of ["tea", "work"])
    for (let time = 0; time < 8000; time += 100) {
      const hand = labPose(time, mode, false).hand;
      const angles = labJoint(hand, ...arm.lengths, arm.bend);
      const rotation =
        angles.upper + angles.lower + labArmArtwork(arm.frames[1], arm.lengths[1]).rotation;
      const dx = thumb.x - outerEdge.x;
      const dy = thumb.y - outerEdge.y;
      assert.ok(dx * Math.sin(rotation) + dy * Math.cos(rotation) < 0, `${mode} at ${time}ms`);
    }
});
test("expression patches use measured bounds and leave the original head silhouette untouched", async () => {
  const head = await part(0),
    [, , hw, hh] = guildLabArt.frames[0];
  for (const [key, expression] of Object.entries(guildLabArt.head.expressions)) {
    assert.equal(expression.closedEyes, key === "smile");
    const inputs = [];
    for (const patch of expression.patches) {
      const [x, y, w, h] = patch.rect;
      assert.ok(x >= 0 && y >= 0 && x + w <= hw && y + h <= hh);
      const pixels = await part(patch.frame);
      assert.deepEqual([pixels.width, pixels.height], [w, h]);
      assert.ok(patch.changedPixels > 20);
      inputs.push({
        input: await sharp(pixels.data, { raw: { width: w, height: h, channels: 4 } })
          .png()
          .toBuffer(),
        left: x,
        top: y,
      });
    }
    const composite = await sharp(head.data, { raw: { width: hw, height: hh, channels: 4 } })
      .composite(inputs)
      .raw()
      .toBuffer();
    for (let y = 0; y < hh; y++)
      for (let x = 0; x < hw; x++) {
        if (
          expression.patches.some(
            (p) =>
              x >= p.rect[0] &&
              x < p.rect[0] + p.rect[2] &&
              y >= p.rect[1] &&
              y < p.rect[1] + p.rect[3],
          )
        )
          continue;
        const i = (y * hw + x) * 4;
        assert.equal(composite[i + 3], head.data[i + 3]);
        if (head.data[i + 3] === 255)
          assert.deepEqual(composite.subarray(i, i + 3), head.data.subarray(i, i + 3));
      }
  }
});
