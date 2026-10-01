import sharp from "sharp";
import { inPolygon } from "./guild-lab-master-layers.mjs";

/** Painted side overlap behind the front hem. Coordinates measured in master pixels. */
export async function skirtLining(image, rect) {
  const [left, top, width, height] = rect,
    pixels = await sharp(image).raw().toBuffer();
  const polygon = [
    [548, 887],
    [784, 887],
    [844, 970],
    [817, 1028],
    [692, 1030],
    [545, 1022],
    [525, 960],
  ];
  const original = Buffer.from(pixels);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      if (pixels[p + 3] >= 245 || !inPolygon(x + left, y + top, polygon)) continue;
      let nearest = null;
      for (let d = 1; d < 64 && !nearest; d++)
        for (const [dx, dy] of [
          [d, 0],
          [-d, 0],
          [0, d],
          [0, -d],
        ]) {
          const xx = x + dx,
            yy = y + dy,
            q = (yy * width + xx) * 4;
          if (xx >= 0 && yy >= 0 && xx < width && yy < height && original[q + 3] >= 245) {
            nearest = q;
            break;
          }
        }
      if (nearest === null) throw Error("Missing skirt lining shade");
      original.copy(pixels, p, nearest, nearest + 3);
      pixels[p + 3] = 255;
    }
  return sharp(pixels, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}
