import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { labCharacters } from "../lib/guild-lab-characters.ts";
import {
  labFoot,
  labJoint,
  labLegTarget,
  labPose,
  labUpperPoint,
  labWalkSpeed,
  LAB_ACTOR_SCALE,
} from "../lib/guild-lab-model.ts";
import { labSingleLeg } from "../lib/guild-lab-single-legs.ts";
import { labShadow, labSole } from "../lib/guild-lab-contact.ts";
import { renderMasterPose } from "../scripts/guild-lab-master-render.mjs";

test("each gait keeps a short front stride, the contact centre under the chest and no planted sliding", () => {
  for (const { rig, art } of Object.values(labCharacters)) {
    if (rig.legStyle === "single") continue;
    assert.ok(rig.walk.forward < rig.walk.back);
    const contacts = [],
      chests = [];
    for (let time = 0; time < 900; time += 5) {
      const index = time < 450 ? 0 : 1,
        leg = rig.legs[index],
        pose = labPose(time, "walk", false, 1, 0, rig, art);
      const target = labLegTarget(time, index / 2, "walk", pose.bob, rig);
      const next = labLegTarget(
        time + 1,
        index / 2,
        "walk",
        labPose(time + 1, "walk", false, 1, 0, rig, art).bob,
        rig,
      );
      assert.ok(Math.abs((next.x - target.x) * LAB_ACTOR_SCALE + labWalkSpeed(rig)) < 1e-6);
      assert.ok(
        Math.abs(leg.joint.y + pose.bob + target.y) < 1e-6,
        "planted bone endpoint stays at floor",
      );
      const joint = labJoint(target, ...leg.lengths, leg.bend);
      const endX =
        leg.joint.x -
        Math.sin(joint.upper) * leg.lengths[0] -
        Math.sin(joint.upper + joint.lower) * leg.lengths[1];
      assert.ok(Math.abs(endX - leg.joint.x - target.x) < 1e-6, "contact target is reachable");
      const sole = labSole(time, "walk", index, rig),
        shadow = labShadow(time, "walk", rig);
      assert.ok(Math.abs(sole.y * LAB_ACTOR_SCALE - shadow.y) < 1e-6);
      contacts.push(leg.joint.x + target.x);
      chests.push(labUpperPoint(rig.torso, pose.lean, rig).x);
    }
    const average = (xs) => xs.reduce((n, x) => n + x, 0) / xs.length;
    assert.ok(
      Math.abs(average(contacts) - average(chests)) < 4,
      "support centre stays within four body units of chest",
    );
    assert.equal(labFoot(0, 0, rig).x, rig.walk.forward);
    assert.equal(labFoot(450, 0, rig).x, -rig.walk.back);
  }
});

test("waist-forward upper body keeps legs on the ground and resets outside walking or reduced motion", () => {
  for (const { rig, art } of Object.values(labCharacters)) {
    for (let t = 0; t < 900; t += 25) {
      const pose = labPose(t, "walk", false, 1, 0, rig, art);
      assert.ok(pose.lean >= (2 * Math.PI) / 180 && pose.lean <= (4 * Math.PI) / 180);
      assert.ok(labUpperPoint(rig.head, pose.lean, rig).x > rig.head.x);
      assert.equal(labUpperPoint({ x: 0, y: rig.walk.pivotY }, pose.lean, rig).y, rig.walk.pivotY);
      assert.equal(labPose(t, "walk", true, 1, 0, rig, art).lean, 0);
    }
    for (const mode of ["tea", "idle", "work"])
      assert.equal(labPose(200, mode, false, 1, 0, rig, art).lean, 0);
  }
});

test("Aria's seated jointed legs retain front boot cuffs and filled knee sockets", async () => {
  const { rig, art } = labCharacters.aria;
  assert.ok(rig.legs.every((leg) => leg.front === "lower"));
  assert.ok(labCharacters.leon.rig.legs.every((leg) => leg.front === "upper"));
  for (const mode of ["tea"]) {
    for (let t = 0; t < (mode === "walk" ? 900 : 1); t += 25) {
      const rendered = await renderMasterPose(mode, t),
        pose = labPose(t, mode, false, 1, 0, rig, art);
      for (const [i, leg] of rig.legs.entries()) {
        const a = labJoint(
          labLegTarget(t, i / 2, mode, pose.bob, rig),
          ...leg.lengths,
          mode === "idle" ? leg.idleBend : leg.bend,
        );
        const knee = {
          x: leg.joint.x - Math.sin(a.upper) * leg.lengths[0],
          y: leg.joint.y + Math.cos(a.upper) * leg.lengths[0],
        };
        const layers = rendered.layers.filter((layer) => leg.frames.includes(layer.frame));
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
          const p = { x: knee.x + Math.cos(angle) * 2, y: knee.y + Math.sin(angle) * 2 };
          assert.ok(
            layers.some((layer) => layer.sample(p)[3] > 180),
            `${mode}/${t}/leg${i}: open knee socket`,
          );
        }
      }
    }
  }
});

test("complete leg paintings switch only during swing and keep the support centre under the body", async () => {
  const { rig, art } = labCharacters.aria;
  assert.equal(rig.legStyle, "single");
  assert.equal(labCharacters.leon.rig.legStyle, "jointed");
  const support = [];
  for (let t = 0; t < 900; t += 25) {
    const pose = labPose(t, "walk", false, 1, 0, rig, art);
    for (let i = 0; i < 2; i++) {
      const p = labSingleLeg(t, i, "walk", pose.bob, false, rig),
        cfg = rig.singleLegs[i];
      assert.ok(
        p.rotation >= (-15 * Math.PI) / 180 - 1e-8 && p.rotation <= (19 * Math.PI) / 180 + 1e-8,
      );
      const planted = (t / 900 + i / 2) % 1 < 0.5;
      assert.equal(p.bent, !planted);
      if (planted) {
        assert.equal(p.lift, 0);
        assert.ok(Math.abs(cfg.y + pose.bob + Math.cos(p.rotation) * cfg.length * p.scaleY) < 1e-6);
        support.push(cfg.x - Math.sin(p.rotation) * cfg.length * p.scaleY);
      }
      assert.equal(labSingleLeg(t, i, "walk", pose.bob, true, rig).rotation, cfg.paintedAngle);
    }
    const r = await renderMasterPose("walk", t);
    for (let i = 0; i < 2; i++) {
      const cfg = rig.singleLegs[i],
        p = labSingleLeg(t, i, "walk", pose.bob, false, rig);
      assert.ok(r.layers.some((layer) => layer.frame === (p.bent ? cfg.bentFrame : cfg.frame)));
    }
    assert.ok(!r.layers.some((p) => [8, 9, 10, 11].includes(p.frame)));
  }
  assert.ok(Math.abs(support.reduce((n, x) => n + x, 0) / support.length - rig.walk.center) < 4);
  const a = await renderMasterPose("idle", 0);
  assert.ok(a.layers.some((p) => p.frame === rig.singleLegs[1].frame));
  const seated = await renderMasterPose("tea", 0);
  assert.ok(seated.layers.some((p) => p.frame === 9));
  assert.ok(!seated.layers.some((p) => p.frame === rig.singleLegs[0].frame));
});

test("rear cloak uses completed painted lining and cloak fragments cannot travel on a sleeve", async () => {
  const { art } = labCharacters.aria;
  const config = JSON.parse(readFileSync("assets/source/guild/aria-master-v5.json", "utf8"));
  assert.ok(art.master.parts.find((p) => p.name === "back-cape").added > 0);
  assert.equal(config.completedPaint.image, "assets/source/guild/aria-completed-clothes-v6.png");
  assert.equal(config.parts.find((p) => p.name === "back-cape").fill, undefined);
  const rendered = await renderMasterPose();
  for (const frame of [4, 6]) {
    const layer = rendered.layers.find((p) => p.frame === frame);
    let stray = 0;
    for (let i = 0; i < layer.data.length; i += 4) {
      const [r, g, b, a] = layer.data.subarray(i, i + 4);
      if (a > 180 && r < 150 && g >= r - 5 && g - b > 15) stray++;
    }
    assert.equal(stray, 0, "cloak colour cannot drift into a moving sleeve");
  }
});
