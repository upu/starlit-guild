import sharp from "sharp";
import { writeFileSync } from "node:fs";

/** Join owned paint at its original master coordinates, not at the animated knee. */
export async function singleLegs(config, cut) {
  const out = [];
  for (const [name, upper, lower] of [
    ["far-leg", 8, 9],
    ["near-leg", 10, 11],
  ]) {
    const a = cut.parts[upper],
      b = cut.parts[lower];
    const left = Math.min(a.rect[0], b.rect[0]),
      top = Math.min(a.rect[1], b.rect[1]);
    const width = Math.max(a.rect[0] + a.rect[2], b.rect[0] + b.rect[2]) - left;
    const height = Math.max(a.rect[1] + a.rect[3], b.rect[1] + b.rect[3]) - top;
    const pieces = [],
      fills = [];
    let added = 0;
    for (const part of [a, b]) {
      const data = await sharp(part.image).raw().toBuffer();
      const mask = await sharp(`${config.directory}/${part.name}-underpaint.png`).raw().toBuffer();
      // Knee underpaint is never carried into the single, continuous painted leg.
      for (let p = 3; p < data.length; p += 4)
        if (mask[p]) {
          const y = Math.floor((p - 3) / 4 / part.rect[2]) + part.rect[1];
          if (part !== a || y > a.joints[0][1] + 24) data[p] = mask[p] = 0;
          else added++;
        }
      pieces.push({
        input: await sharp(data, {
          raw: { width: part.rect[2], height: part.rect[3], channels: 4 },
        })
          .png()
          .toBuffer(),
        left: part.rect[0] - left,
        top: part.rect[1] - top,
      });
      fills.push({
        input: await sharp(mask, {
          raw: { width: part.rect[2], height: part.rect[3], channels: 4 },
        })
          .png()
          .toBuffer(),
        left: part.rect[0] - left,
        top: part.rect[1] - top,
      });
    }
    const image = await sharp({
      create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite(pieces)
      .png()
      .toBuffer();
    writeFileSync(`${config.directory}/${name}.png`, image);
    // Keep a short occluded hip extension, never the exposed knee patch.
    await sharp({
      create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite(fills)
      .png()
      .toFile(`${config.directory}/${name}-underpaint.png`);
    out.push({
      name,
      image,
      rect: [left, top, width, height],
      joints: [a.joints[0], b.joints[1]],
      layer: a.layer,
      visible: a.visible + b.visible,
      added,
    });
  }
  return out;
}
