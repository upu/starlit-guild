import sharp from "sharp";
import { writeFileSync } from "node:fs";

/** Leather-overlap split. Both shaft and shoe use original master pixels. */
export async function splitMasterFeet(config, cut) {
  const feet = [];
  for (const ankle of config.ankles) {
    const part = cut.parts[ankle.side ? 11 : 9],
      [, top, width, height] = part.rect;
    const pixels = await sharp(part.image).raw().toBuffer(),
      shaft = Buffer.from(pixels),
      shoe = Buffer.from(pixels);
    const overlap = 20;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const p = (y * width + x) * 4;
        if (y + top > ankle.splitY + overlap) shaft[p + 3] = 0;
        if (y + top < ankle.splitY - overlap) shoe[p + 3] = 0;
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
