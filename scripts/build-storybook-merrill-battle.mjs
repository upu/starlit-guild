import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/merrill-battle-study-v1.png";
const existing = "public/storybook-study/merrill-seedlings-v1.webp";
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 4,
  columns: 4,
  rows: 1,
});
if (parts.length !== 4) throw Error("Expected four Merrill poses");
const scale = 84 / parts[0].height;
const neutral = await sharp(existing)
  .extract({ left: 0, top: 0, width: 128, height: 128 })
  .png()
  .toBuffer();
const gesture = await sharp(existing)
  .extract({ left: 128, top: 0, width: 128, height: 128 })
  .png()
  .toBuffer();
const layers = [
  { input: neutral, left: 0, top: 0 },
  { input: gesture, left: 128, top: 0 },
];
const metrics = [];
for (const frame of [2, 3]) {
  const bounds = parts[frame];
  let sum = 0,
    count = 0;
  for (let y = bounds.top + Math.floor(bounds.height * 0.9); y < bounds.top + bounds.height; y++)
    for (let x = bounds.left; x < bounds.left + bounds.width; x++)
      if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  if (!count) throw Error(`Missing feet: ${frame}`);
  const width = Math.round(bounds.width * scale),
    height = Math.round(bounds.height * scale);
  const left = Math.round(64 - (sum / count - bounds.left) * scale),
    top = 120 - height;
  if (left < 2 || left + width > 126 || top < 2) throw Error(`Clipped Merrill: ${frame}`);
  layers.push({
    input: await sharp(source).extract(bounds).resize(width, height).png().toBuffer(),
    left: frame * 128 + left,
    top,
  });
  metrics.push({ frame, scale, width, height, left, top, baseline: 120 });
}
await sharp({ create: { width: 512, height: 128, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/merrill-battle-v1.webp");
await writeFile(
  "public/storybook-study/merrill-battle-v1-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
console.log(metrics);
