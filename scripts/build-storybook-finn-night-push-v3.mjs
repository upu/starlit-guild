import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

// The first two poses are the reviewed idle and stationary push. Only frames
// 2–5 are replaced; the hands stay aligned with the existing cart grip.
const source = "assets/source/storybook/finn-night-push-walk-v3.png";
const old = "public/storybook-study/finn-night-push-v2.webp";
const oldMetrics = JSON.parse(
  await readFile("public/storybook-study/finn-night-push-v2-metrics.json", "utf8"),
);
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 4,
  columns: 4,
  rows: 1,
});
if (parts.length !== 4) throw Error("Expected four Finn pushing strides");
const scale = 145 / parts[0].height;
const layers = [],
  metrics = [...oldMetrics];
for (const frame of [0, 1, 6, 7]) {
  const input = await sharp(old)
    .extract({ left: (frame % 4) * 192, top: Math.floor(frame / 4) * 192, width: 192, height: 192 })
    .png()
    .toBuffer();
  layers.push({ input, left: (frame % 4) * 192, top: Math.floor(frame / 4) * 192 });
}
for (const [index, part] of parts.entries()) {
  let sum = 0,
    count = 0;
  for (let y = part.top; y < part.top + Math.floor(part.height * 0.3); y++)
    for (let x = part.left; x < part.left + part.width; x++)
      if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  if (!count) throw Error(`Missing head in stride ${index}`);
  const head = (sum / count - part.left) * scale;
  const width = Math.round(part.width * scale),
    height = Math.round(part.height * scale);
  const left = Math.round(oldMetrics[1].headX - head),
    top = 176 - height;
  if (left < 3 || left + width > 189 || top < 4) throw Error(`Clipped Finn stride ${index}`);
  const frame = index + 2;
  const input = await sharp(source).extract(part).resize(width, height).png().toBuffer();
  layers.push({ input, left: (frame % 4) * 192 + left, top: Math.floor(frame / 4) * 192 + top });
  metrics[frame] = { frame, scale, left, top, width, height, baseline: 176, headX: left + head };
}
await sharp({ create: { width: 768, height: 384, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/finn-night-push-v3.webp");
await writeFile(
  "public/storybook-study/finn-night-push-v3-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
console.log(metrics.slice(1, 6));
