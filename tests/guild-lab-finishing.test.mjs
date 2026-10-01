import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { labCharacters } from "../lib/guild-lab-characters.ts";
import { forbiddenMaterialPixels } from "../scripts/guild-lab-material-audit.mjs";
import { LabArmMotion, labIdleArm } from "../lib/guild-lab-arms.ts";
import { LabAffection } from "../lib/guild-lab-affection.ts";
import { labPose, labTeaCup } from "../lib/guild-lab-model.ts";
import { renderMasterPose } from "../scripts/guild-lab-master-render.mjs";

test("shared material audit rejects garment paint on leather, sleeves and the lower head", async () => {
  assert.equal(
    forbiddenMaterialPixels(Buffer.from([30, 65, 110, 255]), 1, [{ colour: "blue" }]).length,
    1,
  );
  for (const [id, { art }] of Object.entries(labCharacters))
    for (const part of art.master.parts) {
      const [left, top, width, height] = art.frames[part.frame];
      const data = await sharp(`public${art.asset}`)
        .extract({ left, top, width, height })
        .raw()
        .toBuffer();
      const rules = [];
      if (/forearm|boot|thigh|cape|hair/.test(part.name))
        rules.push({ colour: "blue", maximum: 24 });
      if (/forearm|upper-arm/.test(part.name)) rules.push({ colour: "red", maximum: 32 });
      if (/forearm|boot|thigh/.test(part.name)) rules.push({ colour: "green", maximum: 24 });
      if (part.name === "head")
        rules.push({
          colour: "red",
          maximum: 32,
          bounds: [0, art.master.chin[1] - 10, 3000, 3000],
        });
      for (const rule of rules) {
        const matches = forbiddenMaterialPixels(data, width, [rule], part.rect);
        assert.ok(
          matches.length <= rule.maximum,
          `${id}/${part.name}/${rule.colour}: ${matches.length} foreign paint pixels`,
        );
      }
    }
});

test("stretch uses nearly straight direct elbows in every frame, with fixed reduced motion", () => {
  for (const { art, rig } of Object.values(labCharacters))
    for (const mode of ["walk", "idle", "tea", "work"]) {
      for (let time = 0; time < 8000; time += 80)
        for (const i of [0, 1]) {
          const pose = labPose(time, mode, false, 1, 0, rig, art);
          const target = i
            ? mode === "tea"
              ? labTeaCup(pose.sip, pose.head, rig, art).hand
              : pose.hand
            : pose.farHand;
          for (const reaction of [false, true]) {
            const a = new LabArmMotion(rig).sample(time, mode, i, target, reaction, false);
            // Painted neutral bone directions can differ slightly; flexion may only
            // go forward from that authored resting angle, never beyond 150 degrees.
            assert.ok(a.lower <= Math.max(0, labIdleArm(i, rig).lower) + 1e-9);
            assert.ok(a.lower >= (-rig.arms[i].elbowLimit * Math.PI) / 180 - 1e-9);
          }
          const motion = new LabArmMotion(rig);
          const a = motion.sample(time, mode, i, target, false, false, 1);
          assert.ok((-a.upper * 180) / Math.PI >= 150 && (-a.upper * 180) / Math.PI <= 165);
          assert.ok((-a.lower * 180) / Math.PI >= 10 && (-a.lower * 180) / Math.PI <= 20);
          assert.deepEqual(
            motion.sample(time, "idle", i, target, false, true, 1),
            labIdleArm(i, rig),
          );
        }
    }
  const feeling = new LabAffection(() => 0.5);
  feeling.enter("idle", 0);
  feeling.stretch(100);
  assert.equal(feeling.sample(1200, false).stretch, 1);
  assert.equal(feeling.sample(1200, true).stretch, 0);
});

test("shaft covers the shoe and both painted ankle pivots coincide during push-off", async () => {
  for (const [id, { art, rig }] of Object.entries(labCharacters)) {
    if (id !== "leon") continue;
    const render = await renderMasterPose("walk", 445, undefined, { character: id });
    for (const [i, foot] of art.feet.entries()) {
      const shaft = art.master.parts.find((p) => p.name === (i ? "near-boot" : "far-boot"));
      assert.ok(rig.feet[i].layer < rig.legs[i].layer);
      assert.deepEqual(art.legJoints[shaft.frame].distal, foot.root);
      const [left, top, width, height] = art.frames[shaft.frame];
      const pixels = await sharp(`public${art.asset}`)
        .extract({ left, top, width, height })
        .raw()
        .toBuffer();
      for (let y = Math.ceil(foot.root[1] - foot.overlap); y < height; y++)
        for (let x = 0; x < width; x++)
          if (pixels[(y * width + x) * 4 + 3] > 180)
            assert.ok(
              x + shaft.rect[0] >= foot.shaftBounds[0] && x + shaft.rect[0] <= foot.shaftBounds[1],
              "toe pixels must belong only to the independently rotated shoe",
            );
      const shoe = render.layers.find((l) => l.frame === foot.frame);
      const point = shoe.point(...foot.root);
      assert.ok(point.every(Number.isFinite));
    }
  }
});

test("Aria's far glove keeps its master pixels visible in front of completed clothing", async () => {
  const { art, rig } = labCharacters.aria,
    original = await sharp(art.master.image).raw().toBuffer();
  const render = await renderMasterPose("idle");
  const part = art.master.parts.find((p) => p.name === "far-forearm"),
    end = part.joints[1];
  let expected = 0,
    visible = 0,
    matched = 0;
  for (let y = end[1] - 30; y < end[1] + 25; y++)
    for (let x = end[0] - 22; x < end[0] + 33; x++) {
      const p = y * render.width + x;
      if (original[p * 4 + 3] < 180) continue;
      expected++;
      if (render.owner[p] === part.frame) visible++;
      if (original.subarray(p * 4, p * 4 + 3).equals(render.pixels.subarray(p * 4, p * 4 + 3)))
        matched++;
    }
  assert.ok(visible / expected > 0.85, `${visible}/${expected} far glove visible`);
  assert.ok(matched / expected > 0.88, `${matched}/${expected} far glove master pixels`);
  assert.ok(rig.arms[0].layer < rig.torso.layer && rig.arms[0].forearmLayer > rig.torso.layer);
});
