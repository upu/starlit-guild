import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { labCharacters } from "../lib/guild-lab-characters.ts";
import { renderMasterPose } from "./guild-lab-master-render.mjs";
import { format } from "prettier";
import { LabSkirtMotion } from "../lib/guild-lab-skirt.ts";
import { labSingleLeg } from "../lib/guild-lab-single-legs.ts";
import { labPose } from "../lib/guild-lab-model.ts";

const { art, rig } = labCharacters.aria;
const skirtMotion = new LabSkirtMotion(rig.skirt);
const directory = "assets/source/guild/aria-master-v5-parts";
const atlas = await sharp(`public${art.asset}`).raw().toBuffer({ resolveWithObject: true });
const masks = new Map();
for (const part of art.master.parts) {
  const source = `${directory}/${part.name}`;
  const mask = await sharp(source + "-underpaint.png")
    .raw()
    .toBuffer({ resolveWithObject: true });
  masks.set(part.frame, { part, source, mask, remove: new Set(), candidates: [] });
  for (let p = 3; p < mask.data.length; p += 4)
    if (mask.data[p]) masks.get(part.frame).candidates.push((p - 3) / 4);
}
// Include multiple hair/cape periods, seat poses, and the stopped standing pose.
const poses = [
  ...Array.from({ length: 180 }, (_, i) => ["walk", i * 50]),
  ...Array.from({ length: 40 }, (_, i) => ["idle", i * 200]),
  ...Array.from({ length: 40 }, (_, i) => ["tea", i * 200]),
  ...Array.from({ length: 20 }, (_, i) => ["work", i * 100]),
];
for (const [mode, time] of poses) {
  const pose = labPose(time, mode, false, 1, 0, rig, art);
  const angles = rig.singleLegs.map(
    (_, i) => labSingleLeg(time, i, mode, pose.bob, false, rig).rotation,
  );
  const skirt = skirtMotion.sample(time, mode, angles, false);
  const r = await renderMasterPose(mode, time, skirt, { hideUnderpaint: true, animate: true });
  const painted = await renderMasterPose(mode, time, skirt, { animate: true });
  // Inspect the actual raster too: rounding at a crop edge must not expose even one added pixel.
  for (let q = 0; q < painted.pixels.length; q += 4) {
    if (painted.pixels.subarray(q, q + 4).equals(r.pixels.subarray(q, q + 4))) continue;
    const point = {
      x: (((q / 4) % r.width) - art.master.origin[0]) * art.master.scale,
      y: (Math.floor(q / 4 / r.width) - art.master.origin[1]) * art.master.scale,
    };
    for (const layer of painted.layers) {
      const entry = masks.get(layer.frame);
      if (!entry) continue;
      const [sx, sy] = layer.sourceAt(point),
        x = sx - art.framePadding,
        y = sy - art.framePadding;
      if (x < 0 || y < 0 || x >= entry.mask.info.width || y >= entry.mask.info.height) continue;
      const p = y * entry.mask.info.width + x;
      if (entry.mask.data[p * 4 + 3]) entry.remove.add(p);
    }
  }
  for (const [index, layer] of r.layers.entries()) {
    const entry = masks.get(layer.frame);
    if (!entry) continue;
    const above = r.layers.slice(index + 1);
    for (const p of entry.candidates) {
      if (entry.remove.has(p)) continue;
      const x = (p % entry.mask.info.width) + art.framePadding,
        y = Math.floor(p / entry.mask.info.width) + art.framePadding;
      const [wx, wy] = layer.point(x, y);
      const covered = [
        [0, 0],
        [-0.6, 0],
        [0.6, 0],
        [0, -0.6],
        [0, 0.6],
      ].every(([dx, dy]) => above.some((a) => a.sample({ x: wx + dx, y: wy + dy })[3] >= 250));
      if (!covered) entry.remove.add(p);
    }
  }
}
const report = [];
for (const entry of masks.values()) {
  const { part, source, mask, remove } = entry;
  const image = await sharp(source + ".png")
    .raw()
    .toBuffer();
  const [ax, ay] = art.frames[part.frame];
  for (const p of remove) {
    image[p * 4 + 3] = mask.data[p * 4 + 3] = 0;
    const x = (p % mask.info.width) + art.framePadding,
      y = Math.floor(p / mask.info.width) + art.framePadding;
    atlas.data[((ay + y) * atlas.info.width + ax + x) * 4 + 3] = 0;
  }
  await sharp(image, { raw: mask.info })
    .png()
    .toFile(source + ".png");
  await sharp(mask.data, { raw: mask.info })
    .png()
    .toFile(source + "-underpaint.png");
  report.push({
    name: part.name,
    frame: part.frame,
    removed: remove.size,
    kept: entry.candidates.length - remove.size,
  });
}
await sharp(atlas.data, { raw: atlas.info }).webp({ lossless: true }).toFile(`public${art.asset}`);
writeFileSync(
  directory + "/underpaint-visibility.json",
  JSON.stringify({ poses: poses.length, report }, null, 2) + "\n",
);
const master = JSON.parse(JSON.stringify(art.master));
for (const part of master.parts) part.added = report.find((r) => r.frame === part.frame).kept;
writeFileSync(
  "lib/guild-lab-aria-master.ts",
  await format(
    "// Generated from aria-master-v5.json by build-guild-lab-aria.mjs\nexport const ariaLabMaster = " +
      JSON.stringify(master) +
      " as const;\n",
    { parser: "typescript", printWidth: 100 },
  ),
);
const measurements = JSON.parse(readFileSync(directory + "/measurements.json", "utf8"));
for (const part of measurements) {
  part.sourceAdded = part.added;
  part.added = report.find((r) => r.name === part.name).kept;
}
writeFileSync(directory + "/measurements.json", JSON.stringify(measurements, null, 2) + "\n");
console.log(
  "Trimmed exposed underpaint",
  report.filter((p) => p.removed),
);
