import sharp from "sharp";
import { writeFileSync } from "node:fs";

/** Leather-overlap split. Both shaft and shoe use original master pixels. */
export async function splitMasterFeet(config, cut) {
  const feet = [];
  for (const ankle of config.ankles) {
    const part = cut.parts[ankle.side ? 11 : 9],
      [left, top, width, height] = part.rect;
    const pixels = await sharp(part.image).raw().toBuffer(),
      shaft = Buffer.from(pixels),
      shoe = Buffer.from(pixels);
    const rounded = config.ankleJoin === "rounded";
    const overlap = rounded ? 28 : 20;
    const radius = width / 2;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const p = (y * width + x) * 4;
        const dx = (x + left - ankle.point[0]) / radius;
        const cap = rounded ? overlap * Math.sqrt(Math.max(0, 1 - dx * dx)) : overlap;
        const center = rounded ? ankle.point[1] : ankle.splitY;
        if (y + top > center + cap) shaft[p + 3] = 0;
        if (y + top < center - cap) shoe[p + 3] = 0;
      }
    const encode = (p) =>
      sharp(p, { raw: { width, height, channels: 4 } })
        .png()
        .toBuffer();
    part.image = await encode(shaft);
    writeFileSync(`${config.directory}/${part.name}-shaft.png`, part.image);
    const image = await encode(shoe);
    writeFileSync(`${config.directory}/${part.name}-foot.png`, image);
    feet.push({
      ...ankle,
      image,
      rect: part.rect,
      root: ankle.point.map((v, i) => v - part.rect[i]),
      overlap,
    });
  }
  return feet;
}
