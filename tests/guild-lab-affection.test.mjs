import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { LabAffection } from "../lib/guild-lab-affection.ts";
import { labShadow, labSole } from "../lib/guild-lab-contact.ts";
import { labRig } from "../lib/guild-lab-rig.ts";
import { guildLabArt } from "../lib/guild-lab-art.ts";
import { guildLabAriaArt } from "../lib/guild-lab-aria-art.ts";
import { labPose, labJoint, LAB_ACTOR_SCALE } from "../lib/guild-lab-model.ts";
import { portraitExpressions } from "../lib/portrait-expressions.ts";
import { labArmArtwork } from "../lib/guild-lab-arms.ts";
import { labLookDirection } from "../lib/guild-lab-pair.ts";

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

test("Aria's edited face patches stay within the head and share Leon's expression keys", () => {
  const head = guildLabAriaArt.frames[0];
  for (const key of ["neutral", "smile", "surprised", "tired", "yawn"]) {
    const expression = guildLabAriaArt.head.expressions[key];
    assert.ok(expression);
    for (const patch of expression.patches) {
      const [x, y, width, height] = patch.rect;
      assert.ok(x >= 0 && y >= 0 && x + width <= head[2] && y + height <= head[3]);
      assert.deepEqual(guildLabAriaArt.frames[patch.frame].slice(2), [width, height]);
    }
  }
  assert.ok(
    guildLabAriaArt.head.blink.rect[1] + guildLabAriaArt.head.blink.rect[3] <
      guildLabAriaArt.head.mouth.bounds[1],
  );
});

test("tapping one resident turns the other toward them without copying the reaction", () => {
  const aria = new LabAffection(() => 0.5),
    leon = new LabAffection(() => 0.5);
  aria.tap(1000);
  leon.lookAt(1000, 1);
  assert.equal(aria.reacting(1000), true);
  assert.equal(aria.reacting(3400), false);
  assert.equal(leon.reacting(1100), false);
  assert.equal(aria.sample(1100, false).expression, "surprised");
  assert.equal(leon.sample(1100, false).expression, "neutral");
  assert.ok(leon.sample(1100, false).look > 0);
  assert.equal(leon.sample(1100, true).look, 0);
  assert.ok(labLookDirection(272, 369, false) > 0);
  assert.ok(labLookDirection(369, 272, true) > 0);
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
test("completed-master shoulder roots have painted backing and cape is behind both arms", async () => {
  const { renderMasterPose } = await import("../scripts/guild-lab-master-render.mjs");
  const r = await renderMasterPose("idle", 0, undefined, { character: "leon" });
  for (const arm of labRig.arms) {
    const x = Math.round(arm.joint.x / guildLabArt.master.scale + guildLabArt.master.origin[0]),
      y = Math.round(arm.joint.y / guildLabArt.master.scale + guildLabArt.master.origin[1]);
    assert.ok(r.pixels[(y * r.width + x) * 4 + 3] > 240);
  }
  assert.ok(labRig.cape.layer < labRig.arms[0].layer && labRig.cape.layer < labRig.arms[1].layer);
  assert.ok(labRig.cape.walkSway <= 0.06);
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
    assert.equal(expression.closedEyes, key === "smile" || key === "yawn");
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
