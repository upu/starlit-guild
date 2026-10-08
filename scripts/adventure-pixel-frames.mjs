import sharp from "sharp";
import { readFrame } from "./home-pixel-frames.mjs";

// Separate silhouettes before cropping: blades cross the nominal grid columns.
export async function adventureRowFrames(source, top, bottom) {
  const width = (await sharp(source).metadata()).width;
  const { data, info } = await sharp(source)
    .extract({ left: 0, top, width, height: bottom - top })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const seen = new Uint8Array(info.width * info.height),
    components = [];
  for (let p = 0; p < seen.length; p++) {
    if (seen[p] || data[p * 4 + 3] < 96) continue;
    const pixels = [p];
    seen[p] = 1;
    let left = info.width,
      right = 0,
      yTop = info.height,
      yBottom = 0;
    for (let n = 0; n < pixels.length; n++) {
      const q = pixels[n],
        x = q % info.width,
        y = Math.floor(q / info.width);
      left = Math.min(left, x);
      right = Math.max(right, x);
      yTop = Math.min(yTop, y);
      yBottom = Math.max(yBottom, y);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx,
          ny = y + dy,
          np = ny * info.width + nx;
        if (
          nx < 0 ||
          nx >= info.width ||
          ny < 0 ||
          ny >= info.height ||
          seen[np] ||
          data[np * 4 + 3] < 96
        )
          continue;
        seen[np] = 1;
        pixels.push(np);
      }
    }
    components.push({ pixels, left, right, top: yTop, bottom: yBottom });
  }
  components.sort((a, b) => b.pixels.length - a.pixels.length);
  const figures = components.slice(0, 4).sort((a, b) => a.left - b.left);
  if (figures.length !== 4 || figures.some((f) => f.pixels.length < 1000))
    throw Error("Expected four separate figures");
  for (const piece of components.slice(4)) {
    const cx = (piece.left + piece.right) / 2,
      cy = (piece.top + piece.bottom) / 2;
    const distance = (f) =>
      Math.max(f.left - cx, 0, cx - f.right) ** 2 + Math.max(f.top - cy, 0, cy - f.bottom) ** 2;
    const owner = figures.reduce((a, b) => (distance(a) < distance(b) ? a : b));
    owner.pixels.push(...piece.pixels);
  }
  return Promise.all(
    figures.map(async (f) => {
      const pixels = Buffer.alloc(data.length);
      for (const p of f.pixels) {
        const x = p % info.width,
          y = Math.floor(p / info.width);
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx,
              ny = y + dy,
              np = ny * info.width + nx;
            if (nx >= 0 && nx < info.width && ny >= 0 && ny < info.height)
              data.copy(pixels, np * 4, np * 4, np * 4 + 4);
          }
      }
      const cell = await sharp(pixels, { raw: info }).png().toBuffer();
      return readFrame(cell, { left: 0, top: 0, width: info.width, height: info.height });
    }),
  );
}
