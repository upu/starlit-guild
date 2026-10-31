import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/battle-trio-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 12, columns: 4, rows: 3 });
const metrics = {};
for (const [row, id, height] of [
  [0, "aria", 134],
  [1, "leon", 144],
  [2, "mira", 126],
]) {
  const poses = parts.slice(row * 4, row * 4 + 4);
  const scale = height / poses[0].height;
  metrics[id] = [];
  const layers = [];
  for (const [index, part] of poses.entries()) {
    let sum = 0,
      count = 0;
    for (let y = part.top + Math.floor(part.height * 0.9); y < part.top + part.height; y++) {
      for (let x = part.left; x < part.left + part.width; x++) {
        if (data[(y * info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
      }
    }
    const w = Math.round(part.width * scale),
      h = Math.round(part.height * scale);
    const left = Math.round(96 - (sum / count - part.left) * scale);
    if (left < 0 || left + w > 256 || h > 176) throw Error(`Battle pose clipped: ${id}/${index}`);
    const input = await sharp(source)
      .extract({ left: part.left, top: part.top, width: part.width, height: part.height })
      .resize(w, h)
      .png()
      .toBuffer();
    layers.push({ input, left: index * 256 + left, top: 176 - h });
    metrics[id].push({ width: w, height: h, left, top: 176 - h, scale });
  }
  await sharp({ create: { width: 1024, height: 192, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${id}-battle-v1.webp`);
}
await writeFile("public/storybook-study/battle-metrics.json", JSON.stringify(metrics, null, 2));
