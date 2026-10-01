import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { sealPaintCavities } from "./guild-lab-coverage.mjs";

export const bareSkin = (r, g, b, a) =>
  a >= 180 && r > 180 && g > 105 && g < 225 && r - g > 27 && g - b < 48 && g - b > 3;

/** Edited material-only paint replaces reviewed contaminated cutouts.
 * Registration stays in master pixels. Bounds are explicit exceptions to the
 * untouched-master comparison, never a new reference rendered from the rig.
 */
export async function repairAriaMaterials(config, cut) {
  const repairs = [];
  const sheet = await sharp("assets/source/guild/aria-cleanup-v7.png")
    .resize(1280, 1280)
    .png()
    .toBuffer();
  for (const [name, cell, paintHeight] of [
    ["back-hair", [640, 0], null],
    ["front-hair", [0, 640], null],
    ["far-hair", [640, 640], null],
    ["skirt", [0, 0], 170],
  ]) {
    const part = cut.parts.find((p) => p.name === name),
      [, , width, height] = part.rect;
    const crop = await sharp(sheet)
      .extract({ left: cell[0], top: cell[1], width: 640, height: 640 })
      .png()
      .toBuffer();
    const h = paintHeight ?? height;
    part.image = await sharp(crop)
      .trim({ threshold: 30 })
      .resize(width - 16, h - 16, { fit: "fill" })
      .extend({ left: 8, right: 8, top: 8, bottom: height - h + 8, background: "#00000000" })
      .png()
      .toBuffer();
    if (name === "skirt") {
      const pixels = await sharp(part.image).raw().toBuffer();
      sealPaintCavities(pixels, width, height, 64);
      part.image = await sharp(pixels, { raw: { width, height, channels: 4 } })
        .png()
        .toBuffer();
    }
    writeFileSync(`${config.directory}/${name}.png`, part.image);
    repairs.push({
      name,
      rect: part.rect,
      source: "aria-cleanup-v7.png",
      cell,
      paintHeight: h,
      material: name === "skirt" ? "cloth, leather belt, gold ornaments" : "blond hair only",
    });
  }
  writeFileSync(
    `${config.directory}/material-repairs.json`,
    JSON.stringify({ repairs }, null, 2) + "\n",
  );
}
