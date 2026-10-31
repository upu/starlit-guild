import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

function footAnchor(data, stride, part) {
  let sum = 0,
    count = 0;
  for (let y = part.top + Math.floor(part.height * 0.85); y < part.top + part.height; y++) {
    for (let x = part.left; x < part.left + part.width; x++) {
      if (data[(y * stride + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
    }
  }
  if (!count) throw Error("Missing conversation foot anchor");
  return sum / count;
}

const kind = process.argv[2] ?? "conversation";
if (!["conversation", "carry", "raised", "lowering"].includes(kind))
  throw Error("Unknown pose sheet");
const source = `assets/source/storybook/${kind}-pair-v1.png`;
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height);
if (parts.length !== 8) throw Error("Expected eight conversation poses");
const report = {};
for (const [row, id, standingHeight] of [
  [0, "aria", 134],
  [1, "leon", 144],
]) {
  const reference = await sharp(`public/storybook-study/${id}-poses-v1.webp`)
    .extract({ left: 0, top: 0, width: 192, height: 192 })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const anchor = footAnchor(reference, 192, {
    left: 0,
    top: 176 - standingHeight,
    width: 192,
    height: standingHeight,
  });
  const poses = parts.slice(row * 4, row * 4 + 4);
  const scale = standingHeight / poses[0].height;
  const layers = [];
  report[id] = [];
  for (const [index, part] of poses.entries()) {
    const { left, top, width, height } = part;
    const w = Math.round(width * scale),
      h = Math.round(height * scale);
    const input = await sharp(source)
      .extract({ left, top, width, height })
      .resize(w, h)
      .png()
      .toBuffer();
    const x = Math.round(anchor - (footAnchor(data, info.width, part) - left) * scale);
    if (x < 0 || x + w > 192 || h > 176) throw Error(`Pose exceeds cell: ${id}/${index}`);
    layers.push({ input, left: index * 192 + x, top: 176 - h });
    report[id].push({ scale, width: w, height: h, left: x, top: 176 - h, footAnchor: anchor });
  }
  await sharp({ create: { width: 768, height: 192, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${id}-${kind}-v1.webp`);
}
await writeFile(`public/storybook-study/${kind}-metrics.json`, JSON.stringify(report, null, 2));
