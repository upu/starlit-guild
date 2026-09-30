import sharp from "sharp";
import { fitPadded } from "./guild-lab-image-tools.mjs";

// Reviewed skin-only regions on the fitted neutral head. Neither polygon
// touches the bangs, cheek contour or chin. Joint coordinates use this canvas.
export const ariaFaceRegions = {
  eyes: [
    [160, 183, 85, 74],
    [265, 174, 50, 70],
  ],
  mouth: [[223, 246, 53, 42]],
};
export async function registerHead(file, base, width, height) {
  const drawing = await sharp(await fitPadded(file, width, height))
    .ensureAlpha()
    .raw()
    .toBuffer();
  let best = { dx: 0, dy: 0, error: Infinity };
  // Silhouette registration uses alpha only, so expression pixels cannot bias it.
  for (let dy = -6; dy <= 6; dy++)
    for (let dx = -6; dx <= 6; dx++) {
      let error = 0;
      for (let y = 8; y < height - 8; y += 3)
        for (let x = 8; x < width - 8; x += 3) {
          const p = (y * width + x) * 4,
            q = ((y - dy) * width + x - dx) * 4;
          error += Math.abs(base[p + 3] - drawing[q + 3]);
        }
      if (error < best.error) best = { dx, dy, error };
    }
  const aligned = Buffer.alloc(drawing.length);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const xx = x - best.dx,
        yy = y - best.dy;
      if (xx >= 0 && xx < width && yy >= 0 && yy < height)
        drawing.copy(
          aligned,
          (y * width + x) * 4,
          (yy * width + xx) * 4,
          (yy * width + xx) * 4 + 4,
        );
    }
  return { pixels: aligned, alignment: best };
}
const feature = (p) =>
  p[3] > 180 &&
  (Math.max(p[0], p[1], p[2]) < 170 ||
    (p[1] > p[0] * 1.08 && p[1] > p[2] * 1.08) ||
    (p[0] > 235 && p[1] > 235 && p[2] > 235));
function skinDomain(base, width, height) {
  const seen = new Uint8Array(width * height),
    queue = [];
  const skin = (p) =>
    base[p * 4 + 3] > 180 &&
    base[p * 4] > 210 &&
    base[p * 4 + 1] > 160 &&
    base[p * 4] - base[p * 4 + 1] > 8 &&
    base[p * 4 + 1] - base[p * 4 + 2] < 38;
  const seed = 244 * width + 253;
  queue.push(seed);
  seen[seed] = 1;
  for (let i = 0; i < queue.length; i++)
    for (const n of [queue[i] - 1, queue[i] + 1, queue[i] - width, queue[i] + width])
      if (n >= 0 && n < seen.length && !seen[n] && skin(n)) {
        seen[n] = 1;
        queue.push(n);
      }
  const domain = new Uint8Array(seen.length);
  for (let y = 170; y < 295; y++) {
    let lo = width,
      hi = 0;
    for (let x = 150; x < 320; x++)
      if (seen[y * width + x]) {
        lo = Math.min(lo, x);
        hi = Math.max(hi, x);
      }
    for (let x = lo; x <= hi; x++) domain[y * width + x] = 1;
  }
  const expanded = new Uint8Array(domain);
  for (let y = 174; y < 290; y++)
    for (let x = 154; x < 316; x++) {
      const p = (y * width + x) * 4;
      if (base[p + 1] - base[p + 2] > 45) continue; // Painted blonde strands stay immutable.
      if (
        [-4, -3, -2, -1, 0, 1, 2, 3, 4].some(
          (d) => domain[y * width + x + d] || domain[(y + d) * width + x],
        )
      )
        expanded[y * width + x] = 1;
    }
  return expanded;
}
export function faceMask(base, aligned, width, height, region, closed) {
  const boxes = ariaFaceRegions[region],
    mask = new Uint8Array(width * height);
  let changedPixels = 0;
  const domain = skinDomain(base, width, height);
  for (const [left, top, w, h] of boxes)
    for (let y = top; y < top + h; y++)
      for (let x = left; x < left + w; x++) {
        const p = (y * width + x) * 4;
        if (!domain[y * width + x]) continue;
        // Eyes: union of old/new painted features. Mouth also includes red lips.
        const changed =
          Math.max(...[0, 1, 2].map((c) => Math.abs(base[p + c] - aligned[p + c]))) > 24;
        if (
          feature(base.subarray(p, p + 4)) ||
          feature(aligned.subarray(p, p + 4)) ||
          (region === "mouth" && changed)
        ) {
          mask[y * width + x] = 1;
          changedPixels++;
        }
      }
  const padded = new Uint8Array(mask.length),
    radius = closed ? 6 : 4;
  for (const [left, top, w, h] of boxes)
    for (let y = top; y < top + h; y++)
      for (let x = left; x < left + w; x++) {
        let distance = Infinity;
        for (let dy = -radius; dy <= radius; dy++)
          for (let dx = -radius; dx <= radius; dx++)
            if (mask[(y + dy) * width + x + dx]) distance = Math.min(distance, Math.hypot(dx, dy));
        if (distance <= radius && domain[y * width + x])
          padded[y * width + x] =
            distance <= radius - 2 ? 255 : Math.round((radius - distance) * 127);
      }
  const x0 = Math.min(...boxes.map((b) => b[0])),
    y0 = Math.min(...boxes.map((b) => b[1]));
  const x1 = Math.max(...boxes.map((b) => b[0] + b[2])),
    y1 = Math.max(...boxes.map((b) => b[1] + b[3]));
  const w = x1 - x0,
    h = y1 - y0,
    pixels = Buffer.alloc(w * h * 4);
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x1; x++) {
      const p = (y * width + x) * 4,
        q = ((y - y0) * w + x - x0) * 4;
      aligned.copy(pixels, q, p, p + 3);
      const silhouetteEdge =
        base[p + 3] < 250 ||
        [-2, -1, 1, 2].some(
          (d) =>
            base[((y + d) * width + x) * 4 + 3] < 180 || base[(y * width + x + d) * 4 + 3] < 180,
        );
      pixels[q + 3] = silhouetteEdge
        ? 0
        : x === x0 || y === y0 || x === x1 - 1 || y === y1 - 1
          ? 0
          : padded[y * width + x];
    }
  return {
    pixels,
    rect: [x0, y0, w, h],
    changedPixels,
    maskRadius: radius,
    masked: true,
    silhouettePixels: 0,
    closedEyes: closed,
  };
}
