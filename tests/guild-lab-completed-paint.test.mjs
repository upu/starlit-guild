import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { labCharacters } from "../lib/guild-lab-characters.ts";
import { labHip, labJoint, labLegTarget } from "../lib/guild-lab-model.ts";
import { labBentArm } from "../lib/guild-lab-bent-arms.ts";
import { renderMasterPose } from "../scripts/guild-lab-master-render.mjs";
import { transparentHoles } from "../scripts/guild-lab-coverage.mjs";
import { leatherMedian } from "../scripts/guild-lab-boot-palette.mjs";

test("hole detection catches an interior cut while leaving exterior arm/hair spacing alone", () => {
  const pixels = Buffer.alloc(20 * 20 * 4);
  for (let y = 3; y < 17; y++) for (let x = 3; x < 17; x++) pixels[(y * 20 + x) * 4 + 3] = 255;
  pixels[(10 * 20 + 10) * 4 + 3] = 0;
  assert.deepEqual(transparentHoles({ pixels, width: 20, height: 20 }), [
    { pixels: 1, rect: [10, 10, 1, 1] },
  ]);
});

test("completed garments and bent limbs have painted interiors without alpha cavities", async () => {
  const { art } = labCharacters.aria;
  const frames = [
    ...art.master.parts
      .filter((p) =>
        ["torso", "back-cape", "skirt", "near-upper-arm", "far-upper-arm"].includes(p.name),
      )
      .map((p) => p.frame),
    ...art.variants.map((v) => v.frame),
  ];
  for (const frame of frames) {
    const [left, top, width, height] = art.frames[frame];
    const pixels = await sharp("public" + art.asset)
      .extract({ left, top, width, height })
      .raw()
      .toBuffer();
    assert.deepEqual(
      transparentHoles({ pixels, width, height }).filter((p) => p.pixels > 4),
      [],
      `frame ${frame}: painted interior`,
    );
  }
});

test("tea, walking, idle, work and tap/stretch leave no holes in the body clothing interior", async () => {
  const dir = "work/lab-fourteenth-coverage";
  mkdirSync(dir, { recursive: true });
  const report = [];
  for (const mode of ["tea", "walk", "idle", "work"])
    for (const time of mode === "walk"
      ? Array.from({ length: 16 }, (_, i) => i * 56.25)
      : [0, 1500, 3500, 5000]) {
      const r = await renderMasterPose(mode, time, undefined, { animate: true });
      // Hair curls and space between limbs are exterior silhouette openings, not fabric holes.
      const holes = transparentHoles(r, [490, 750, 780, 980]).filter((p) => p.pixels > 4);
      assert.deepEqual(holes, [], `${mode}/${time}: transparent clothing cavity`);
      report.push({ mode, time, holes });
      if (time === 0 || time === 3500)
        await sharp(r.pixels, { raw: { width: r.width, height: r.height, channels: 4 } })
          .resize(600)
          .png()
          .toFile(`${dir}/${mode}-${time}.png`);
    }
  for (const feeling of [{ jump: 5, squash: 0.4 }, { stretch: 1, look: 0.17 }, { look: -0.17 }]) {
    const r = await renderMasterPose("idle", 0, undefined, { animate: true, feeling });
    assert.deepEqual(
      transparentHoles(r, [490, 750, 780, 980]).filter((p) => p.pixels > 4),
      [],
    );
    report.push({ mode: "reaction", feeling, holes: [] });
  }
  writeFileSync(`${dir}/coverage.json`, JSON.stringify(report, null, 2) + "\n");
});

test("painted bend variants keep root and grip registered to the FK contact, with continuous joints", async () => {
  const { art, rig } = labCharacters.aria;
  assert.deepEqual(
    art.variants.filter((v) => v.kind === "leg").map((v) => Math.round(v.bend)),
    [16, 16],
  );
  for (const v of art.variants) {
    const [left, top, width, height] = art.frames[v.frame];
    const pixels = await sharp("public" + art.asset)
      .extract({ left, top, width, height })
      .raw()
      .toBuffer();
    for (const centre of [v.root, v.hinge, v.end])
      for (let y = -3; y <= 3; y++)
        for (let x = -3; x <= 3; x++) {
          const px = Math.round(centre[0] + x),
            py = Math.round(centre[1] + y);
          assert.ok(pixels[(py * width + px) * 4 + 3] >= 180, `${v.name}: fully painted joint`);
        }
    if (v.kind !== "arm") continue;
    const limb = rig.arms[v.side];
    for (const angle of [0.9, 1.4, 1.9]) {
      const p = labBentArm(art, v.side, -0.3, angle, limb.lengths);
      const vector = { x: v.end[0] - v.root[0], y: v.end[1] - v.root[1] };
      const chosen = p.variant,
        s =
          ((limb.lengths[0] + limb.lengths[1]) * p.scale) /
          Math.hypot(chosen.end[0] - chosen.root[0], chosen.end[1] - chosen.root[1]);
      vector.x = chosen.end[0] - chosen.root[0];
      vector.y = chosen.end[1] - chosen.root[1];
      const x = (vector.x * Math.cos(p.rotation) - vector.y * Math.sin(p.rotation)) * s;
      const y = (vector.x * Math.sin(p.rotation) + vector.y * Math.cos(p.rotation)) * s;
      assert.ok(Math.hypot(x - p.x, y - p.y) < 1e-6);
    }
  }
});

test("Leon idle reproduces the independent completed standing master with nearly straight uncrossed legs", async () => {
  const { art, rig } = labCharacters.leon,
    r = await renderMasterPose("idle", 0, undefined, { character: "leon" });
  const original = await sharp(art.master.image).raw().toBuffer();
  let missing = 0,
    extra = 0,
    paint = 0;
  for (let p = 3; p < original.length; p += 4) {
    if (original[p] > 180) {
      paint++;
      if (r.pixels[p] < 180) missing++;
    } else if (r.pixels[p] > 180) extra++;
  }
  assert.ok(missing / paint < 0.002, "master missing contour " + missing + "/" + paint);
  assert.ok(extra / paint < 0.002, "master extra contour " + extra + "/" + paint);
  for (let i = 0; i < 2; i++) {
    const leg = rig.legs[i],
      target = labLegTarget(0, i / 2, "idle", 0, rig);
    assert.ok(Math.abs(labJoint(target, ...leg.lengths, leg.bend).lower) < 0.13);
    assert.deepEqual(labHip(i, "idle", rig), leg.joint);
  }
  assert.ok(
    (rig.idleFeet[0].x - rig.idleFeet[1].x) * (rig.legs[0].joint.x - rig.legs[1].joint.x) > 0,
  );
  mkdirSync("work/lab-fifteenth-comparison", { recursive: true });
  await sharp(r.pixels, { raw: { width: r.width, height: r.height, channels: 4 } })
    .png()
    .toFile("work/lab-fifteenth-comparison/leon-standing.png");
  const rigImage = await sharp(r.pixels, { raw: { width: r.width, height: r.height, channels: 4 } })
    .png()
    .toBuffer();
  await sharp({
    create: { width: r.width * 2, height: r.height, channels: 4, background: "#ede5d8" },
  })
    .composite([
      { input: await sharp(art.master.image).png().toBuffer(), left: 0, top: 0 },
      { input: rigImage, left: r.width, top: 0 },
    ])
    .png()
    .toBuffer()
    .then((b) =>
      sharp(b).resize(900).png().toFile("work/lab-fifteenth-comparison/leon-master-vs-rig.png"),
    );
});
test("straight and bent boots keep each side's original leather palette when switching", async () => {
  const { art, rig } = labCharacters.aria;
  for (const [i, cfg] of rig.singleLegs.entries()) {
    const medians = [];
    for (const frame of [cfg.frame, cfg.bentFrame]) {
      const [left, top, width, height] = art.frames[frame];
      medians.push(
        leatherMedian(
          await sharp("public" + art.asset)
            .extract({ left, top, width, height })
            .raw()
            .toBuffer(),
        ),
      );
    }
    for (let c = 0; c < 3; c++)
      assert.ok(Math.abs(medians[0][c] - medians[1][c]) <= 2, `leg ${i}: leather changes on swap`);
    assert.ok(
      art.variants.find((v) => v.frame === cfg.bentFrame).sharedSource.sha256.length === 64,
    );
  }
});
