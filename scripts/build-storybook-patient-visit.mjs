import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const name = "patient-visit-v2";
const source = `assets/source/storybook/${name}.png`;
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
if (parts.length !== 4) throw new Error("The patient sheet must contain four separate figures");
const cell = 128,
  sole = 120,
  scale = 94 / parts[0].height;
const layers = [],
  metrics = [];
for (const [index, part] of parts.entries()) {
  const width = Math.round(part.width * scale),
    height = Math.round(part.height * scale);
  let sum = 0,
    count = 0;
  for (let y = part.top + Math.floor(part.height * 0.85); y < part.top + part.height; y++)
    for (let x = part.left; x < part.left + part.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  if (!count) throw new Error(`Missing foot pixels in frame ${index}`);
  const left = Math.round(cell / 2 - (sum / count - part.left) * scale),
    top = sole - height;
  if (left <= 0 || left + width >= cell || top <= 0) throw new Error(`Clipped frame ${index}`);
  layers.push({
    input: await sharp(source).extract(part).resize(width, height).png().toBuffer(),
    left: index * cell + left,
    top,
  });
  metrics.push({ width, height, left, top, scale });
}
await sharp({ create: { width: cell * 4, height: cell, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile(`public/storybook-study/${name}.webp`);
await writeFile(`public/storybook-study/${name}-metrics.json`, JSON.stringify(metrics, null, 2));
