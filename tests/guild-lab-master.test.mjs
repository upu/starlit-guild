import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { labCharacters } from "../lib/guild-lab-characters.ts";
import { labJoint, labLegTarget, labPose, labTeaCup } from "../lib/guild-lab-model.ts";
import { LabSkirtMotion } from "../lib/guild-lab-skirt.ts";
import { renderMasterPose } from "./guild-lab-master-render.mjs";

test("master-derived idle rig reproduces the completed painting without silhouette drift", async () => {
  const { art, rig } = labCharacters.aria,
    rendered = await renderMasterPose();
  const original = await sharp(art.master.image).raw().toBuffer();
  let missing = 0,
    extra = 0,
    originalPaint = 0;
  for (let i = 3; i < original.length; i += 4) {
    if (original[i] > 180) {
      originalPaint++;
      if (rendered.pixels[i] <= 180) missing++;
    } else if (rendered.pixels[i] > 180) extra++;
  }
  assert.ok(
    missing / originalPaint < 0.002,
    `missing master contour pixels ${missing}/${originalPaint}`,
  );
  assert.ok(extra / originalPaint < 0.002, `extra contour pixels ${extra}/${originalPaint}`);
  assert.equal(labPose(0, "idle", false, 1, 0, rig, art).bob, 0);
  for (const p of art.master.parts)
    assert.equal(
      art.frames[p.frame][3] * art.master.scale,
      p.frame === 0 ? art.head.displayHeight : p.rect[3] * art.master.scale,
    );
  mkdirSync("work/lab-eleventh-comparison", { recursive: true });
  const image = await sharp(rendered.pixels, {
    raw: { width: rendered.width, height: rendered.height, channels: 4 },
  })
    .png()
    .toBuffer();
  const pair = await sharp({
    create: {
      width: rendered.width * 2,
      height: rendered.height,
      channels: 4,
      background: "#ede5d8",
    },
  })
    .composite([
      { input: await sharp(art.master.image).png().toBuffer(), left: 0, top: 0 },
      { input: image, left: rendered.width, top: 0 },
    ])
    .png()
    .toBuffer();
  await sharp(pair).resize(900).png().toFile("work/lab-eleventh-comparison/master-vs-rig.png");
  const translucent = Buffer.from(rendered.pixels);
  for (let i = 3; i < translucent.length; i += 4) translucent[i] = Math.round(translucent[i] * 0.5);
  const overlay = await sharp(art.master.image)
    .composite([
      {
        input: await sharp(translucent, {
          raw: { width: rendered.width, height: rendered.height, channels: 4 },
        })
          .png()
          .toBuffer(),
      },
    ])
    .png()
    .toBuffer();
  await sharp(overlay).resize(600).png().toFile("work/lab-eleventh-comparison/master-overlay.png");
  writeFileSync(
    "work/lab-eleventh-comparison/master-metrics.json",
    JSON.stringify({ missing, extra, originalPaint }, null, 2),
  );
});

test("idle feet keep the hip ordering and the two leg bones do not cross", () => {
  for (const { rig, art } of Object.values(labCharacters)) {
    assert.ok(
      (rig.idleFeet[0].x - rig.idleFeet[1].x) * (rig.legs[0].joint.x - rig.legs[1].joint.x) > 0,
    );
    const bob = labPose(0, "idle", false, 1, 0, rig, art).bob;
    const bones = rig.legs.map((leg, i) => {
      const a = labJoint(
        labLegTarget(0, i / 2, "idle", bob, rig),
        ...leg.lengths,
        leg.idleBend ?? leg.bend,
      );
      const knee = {
        x: leg.joint.x - Math.sin(a.upper) * leg.lengths[0],
        y: leg.joint.y + Math.cos(a.upper) * leg.lengths[0],
      };
      return [leg.joint, knee, rig.idleFeet[i]];
    });
    const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++) {
        const [a, b] = bones[0].slice(i, i + 2),
          [c, d] = bones[1].slice(j, j + 2);
        assert.ok(
          !(cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0),
          "legs intersect",
        );
      }
  }
});

test("master proportions preserve visible chest, near upper sleeve and natural chin/cup contact", async () => {
  const { art, rig } = labCharacters.aria;
  for (const [mode, times] of [
    ["idle", [0]],
    ["walk", Array.from({ length: 8 }, (_, i) => i * 112.5)],
  ])
    for (const time of times) {
      const r = await renderMasterPose(mode, time);
      for (const frame of [2, 6]) {
        const visible = r.owner.reduce((n, v) => n + (v === frame), 0);
        assert.ok(
          visible / r.counts[frame] > 0.4,
          `${mode}/${time} frame ${frame} visibility ${visible / r.counts[frame]}`,
        );
      }
    }
  assert.ok((art.master.chin[1] - art.master.collar[1]) * art.master.scale >= 0);
  assert.ok((art.master.chin[1] - art.master.collar[1]) * art.master.scale <= 3);
  for (const angle of [-0.17, 0, 0.17]) {
    const cup = labTeaCup(1, angle, rig, art);
    assert.ok(Math.hypot(cup.rim.x - cup.mouth.x, cup.rim.y - cup.mouth.y) < 0.001);
  }
  assert.equal(art.master.reviewed.connectedLongHair, true);
  assert.equal(art.master.reviewed.torsoIncludesSkirt, false);
});

test("skirt follows strongly, bounces, rings down after stopping and freezes seated or reduced", () => {
  const rig = labCharacters.aria.rig,
    motion = new LabSkirtMotion(rig.skirt);
  const stride = [];
  for (let t = 0; t <= 3600; t += 16) {
    const bob = labPose(t, "walk", false, 1, 0, rig, labCharacters.aria.art).bob;
    const thighs = rig.legs.map(
      (leg, i) =>
        labJoint(labLegTarget(t, i / 2, "walk", bob, rig), ...leg.lengths, leg.bend).upper,
    );
    stride.push(motion.sample(t, "walk", thighs, false));
  }
  assert.ok(stride.some((p) => Math.abs(p.rotation) > 0.12));
  assert.ok(stride.some((p) => p.width > 1.06));
  assert.ok(stride.some((p) => Math.abs(p.height - 1) > 0.01));
  assert.ok(
    stride.every(
      (p) =>
        Math.abs(p.rotation) <= 0.25 && p.width <= 1.12 && p.height >= 0.97 && p.height <= 1.03,
    ),
  );
  const stopped = motion.sample(3616, "idle", [0, 0], false);
  assert.ok(Math.abs(stopped.rotation) > 0.001);
  const tail = [];
  for (let t = 3632; t < 6600; t += 16) tail.push(motion.sample(t, "idle", [0, 0], false).rotation);
  const turns = tail.slice(1).filter((v, i) => v * tail[i] < 0).length;
  assert.ok(turns >= 4, "two or more damped oscillations");
  assert.ok(Math.abs(tail.at(-1)) < 0.002);
  assert.deepEqual(motion.sample(6616, "tea", [1, -1], false), {
    rotation: 0,
    width: 1,
    height: 1,
  });
  motion.sample(6632, "idle", [0, 0], false, 5);
  assert.ok(motion.sample(6700, "idle", [0, 0], false, 5).height < 1, "jump lifts the hem");
  assert.deepEqual(motion.sample(6716, "walk", [1, -1], true), {
    rotation: 0,
    width: 1,
    height: 1,
  });
});
