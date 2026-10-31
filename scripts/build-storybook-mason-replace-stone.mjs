import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const name = process.argv[2] === "carry" ? "carry" : "replace";
const version = name === "carry" && process.argv[3] === "v2" ? "v2" : "v1";
const source = `assets/source/storybook/mason-${name}-stone-${version}.png`;
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
if (parts.length !== 4) throw Error("Expected four mason poses");
const scale = 94 / parts[0].height,
  layers = [],
  metrics = [];
for (const [frame, part] of parts.entries()) {
  let sum = 0,
    count = 0;
  for (let y = part.top + Math.floor(part.height * 0.9); y < part.top + part.height; y++)
    for (let x = part.left; x < part.left + part.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  if (!count) throw Error(`Missing mason foot ${frame}`);
  const width = Math.round(part.width * scale),
    height = Math.round(part.height * scale);
  let headSum = 0,
    headCount = 0;
  for (let y = part.top; y < part.top + Math.floor(part.height * 0.3); y++)
    for (let x = part.left; x < part.left + part.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        headSum += x;
        headCount++;
      }
  const head = (headSum / headCount - part.left) * scale;
  const left = Math.round(name === "carry" ? 69 - head : 64 - (sum / count - part.left) * scale),
    top = 120 - height;
  if (left < 3 || left + width > 125 || top < 3) throw Error(`Clipped mason ${frame}`);
  layers.push({
    input: await sharp(source).extract(part).resize(width, height).png().toBuffer(),
    left: frame * 128 + left,
    top,
  });
  metrics.push({ frame, scale, left, top, width, height, baseline: 120, headX: left + head });
}
await sharp({ create: { width: 512, height: 128, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile(`public/storybook-study/mason-${name}-stone-${version}.webp`);
await writeFile(
  `public/storybook-study/mason-${name}-stone-${version}-metrics.json`,
  JSON.stringify(metrics, null, 2) + "\n",
);
console.log(metrics);
