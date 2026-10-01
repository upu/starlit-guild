import sharp from "sharp";
import { writeFileSync } from "node:fs";

function shaftEdges(pixels, width, rect, point, overlap) {
  const y = point[1] - overlap * 2 - rect[1],
    start = point[0] - rect[0];
  let left = start,
    right = start;
  while (left > 0 && pixels[(y * width + left - 1) * 4 + 3] > 180) left--;
  while (right < width - 1 && pixels[(y * width + right + 1) * 4 + 3] > 180) right++;
  return [left + rect[0], right + rect[0]];
}

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
    const edges = rounded ? shaftEdges(pixels, width, part.rect, ankle.point, overlap) : null;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const p = (y * width + x) * 4;
        const delta = x + left - ankle.point[0];
        const radius = edges
          ? delta < 0
            ? ankle.point[0] - edges[0]
            : edges[1] - ankle.point[0]
          : width / 2;
        const dx = delta / radius;
        const cap = rounded ? overlap * Math.sqrt(Math.max(0, 1 - dx * dx)) : overlap;
        const center = rounded ? ankle.point[1] : ankle.splitY;
        if (y + top > center + cap) shaft[p + 3] = 0;
        // The boot's toe is wider than its barrel. Never rotate the toe with
        // the shin, even when its upper leather reaches the overlap band.
        if (rounded && y + top >= center - overlap && Math.abs(dx) > 1) shaft[p + 3] = 0;
        if (y + top < center - cap) shoe[p + 3] = 0;
        if (rounded && y + top >= center - overlap && !shaft[p + 3]) shoe[p + 3] = pixels[p + 3];
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
      ...(edges ? { shaftBounds: edges } : {}),
    });
  }
  return feet;
}
