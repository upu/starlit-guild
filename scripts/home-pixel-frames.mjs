import sharp from "sharp";
import { residentArt } from "../lib/home-actor.ts";

export async function spriteBounds(buffer, fraction = 1) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width,
    top = info.height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < Math.ceil(info.height * fraction); y++)
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] < 96) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  if (right <= left) throw Error("Empty sprite");
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}
export async function readFrame(source, rect) {
  const cell = await sharp(source).extract(rect).png().toBuffer();
  const box = await spriteBounds(cell);
  const crop = await sharp(cell).extract(box).png().toBuffer();
  const head = await headBounds(crop);
  return { cell, box, head };
}
export async function headBounds(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const height = Math.ceil(info.height * 0.38),
    seen = new Uint8Array(info.width * height);
  let largest = [];
  for (let p = 0; p < seen.length; p++) {
    if (seen[p] || data[p * 4 + 3] < 96) continue;
    const component = [p];
    seen[p] = 1;
    for (let n = 0; n < component.length; n++) {
      const q = component[n],
        x = q % info.width,
        y = Math.floor(q / info.width);
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
          ny >= height ||
          seen[np] ||
          data[np * 4 + 3] < 96
        )
          continue;
        seen[np] = 1;
        component.push(np);
      }
    }
    if (component.length > largest.length) largest = component;
  }
  let left = info.width,
    right = 0,
    top = height,
    bottom = 0;
  for (const p of largest) {
    const x = p % info.width,
      y = Math.floor(p / info.width);
    left = Math.min(left, x);
    right = Math.max(right, x);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
  }
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

// Register the top of the head and its horizontal center, not a changing cape,
// lifted boot or moving hand. A constant crown-to-sole height prevents the whole
// figure from floating or changing size. The head's connected component excludes
// an independently raised hammer/quill from the registration measurements.
export async function packFrames(frames) {
  const size = residentArt.cell,
    composite = [],
    anchors = [];
  const headY = residentArt.foot - residentArt.height;
  for (const [i, f] of frames.entries()) {
    const scale = residentArt.height / f.box.height;
    const width = Math.round(f.box.width * scale),
      height = Math.round(f.box.height * scale);
    const center = f.head.left + f.head.width / 2;
    const left = Math.round(size / 2 - center * scale),
      top = Math.round(headY - f.head.top * scale);
    if (left < 4 || top < 4 || left + width >= size - 4 || top + height >= size - 4)
      throw Error(`Sprite ${i} exceeds padded cell: ${left},${top},${width},${height}`);
    composite.push({
      input: await sharp(f.cell)
        .extract(f.box)
        .resize(width, height, { kernel: "lanczos3" })
        .png()
        .toBuffer(),
      left: (i % 4) * size + left,
      top: Math.floor(i / 4) * size + top,
    });
    anchors[i] = { source: f.box, head: f.head, scale, left, top, width, height };
  }
  const image = await sharp({
    create: {
      width: size * 4,
      height: size * Math.ceil(frames.length / 4),
      channels: 4,
      background: "#00000000",
    },
  })
    .composite(composite)
    .webp({ lossless: true })
    .toBuffer();
  return { image, anchors };
}
export async function rowCuts(source, rows) {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const cuts = [0];
  for (let row = 1; row < rows; row++) {
    const expected = Math.round((info.height * row) / rows);
    let best = expected,
      bestCount = Infinity;
    for (let y = expected - 18; y <= expected + 18; y++) {
      let count = 0;
      for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] >= 96) count++;
      const score = count * 100 + Math.abs(y - expected);
      if (score < bestCount) {
        best = y;
        bestCount = score;
      }
    }
    cuts.push(best);
  }
  return [...cuts, info.height];
}
