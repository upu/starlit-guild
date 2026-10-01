import sharp from "sharp";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { sealPaintCavities } from "./guild-lab-coverage.mjs";

const turn = (p, root, a) => {
  const x = p[0] - root[0],
    y = p[1] - root[1];
  return [root[0] + x * Math.cos(a) - y * Math.sin(a), root[1] + x * Math.sin(a) + y * Math.cos(a)];
};
/** Resample the SAME owned sleeve/glove or thigh/boot pixels; no independently generated variant. */
export async function pixelBends(config, cut) {
  const out = [];
  const definitions = [
    ["near-arm-gentle", 6, 7, 60, "arm", 1],
    ["near-arm-folded", 6, 7, 105, "arm", 1],
    ["far-arm-folded", 4, 5, 85, "arm", 0],
    ["far-leg-bent", 8, 9, -16, "leg", 0],
    ["near-leg-bent", 10, 11, -16, "leg", 1],
  ];
  for (const [name, ai, bi, degrees, kind, side] of definitions) {
    const a = cut.parts[ai],
      b = cut.parts[bi],
      root = a.joints[0],
      hinge = a.joints[1],
      end = b.joints[1];
    const angle = (p) => Math.atan2(p[1], p[0]);
    const current =
      angle([end[0] - hinge[0], end[1] - hinge[1]]) -
      angle([hinge[0] - root[0], hinge[1] - root[1]]);
    const rotation = (degrees * Math.PI) / 180 - current;
    const lower = await sharp(b.image).raw().toBuffer(),
      upper = await sharp(a.image).raw().toBuffer();
    const width = cut.width,
      height = cut.height,
      pixels = Buffer.alloc(width * height * 4),
      fore = Buffer.alloc(pixels.length);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const q = (y * width + x) * 4;
        const ax = x - a.rect[0],
          ay = y - a.rect[1];
        if (ax >= 0 && ay >= 0 && ax < a.rect[2] && ay < a.rect[3])
          upper.copy(pixels, q, (ay * a.rect[2] + ax) * 4, (ay * a.rect[2] + ax) * 4 + 4);
        const source = turn([x + 0.5, y + 0.5], hinge, -rotation),
          bx = Math.floor(source[0] - b.rect[0]),
          by = Math.floor(source[1] - b.rect[1]);
        if (bx >= 0 && by >= 0 && bx < b.rect[2] && by < b.rect[3]) {
          const p = (by * b.rect[2] + bx) * 4;
          if (lower[p + 3]) {
            lower.copy(pixels, q, p, p + 4);
            lower.copy(fore, q, p, p + 4);
          }
        }
      }
    // The hinge is the only newly exposed paint; close subpixel joint cavities.
    const repairedPixels = sealPaintCavities(pixels, width, height, 64);
    let x0 = width,
      y0 = height,
      x1 = 0,
      y1 = 0;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        if (pixels[(y * width + x) * 4 + 3] >= 180) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
    const rect = [x0 - 8, y0 - 8, x1 - x0 + 17, y1 - y0 + 17];
    const extract = (data) =>
      sharp(data, { raw: { width, height, channels: 4 } })
        .extract({ left: rect[0], top: rect[1], width: rect[2], height: rect[3] })
        .png()
        .toBuffer();
    const image = await extract(pixels),
      forearm = kind === "arm" ? await extract(fore) : null;
    writeFileSync(`${config.directory}/${name}-v7.png`, image);
    if (forearm) writeFileSync(`${config.directory}/${name}-forearm-v7.png`, forearm);
    const local = (p) => [p[0] - rect[0], p[1] - rect[1]],
      destination = turn(end, hinge, rotation);
    out.push({
      name,
      kind,
      side,
      image,
      forearm,
      root: local(root),
      hinge: local(hinge),
      end: local(destination),
      bend: Math.abs(degrees),
      rect,
      repairedPixels,
      sharedSource: {
        image: `${config.directory}/${b.name}${kind === "leg" ? "-shaft" : ""}.png`,
        sha256: createHash("sha256").update(lower).digest("hex"),
        rotation,
        hinge,
        sourceRect: b.rect,
      },
    });
  }
  return out;
}
