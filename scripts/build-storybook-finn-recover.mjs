import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/finn-recover-offer-v1.png";
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 4,
  columns: 4,
  rows: 1,
});
if (parts.length !== 4) throw Error("Four Finn recovery poses are required");
const scale = 148 / parts[3].height;
const layers = [],
  metrics = [];
for (const [frame, p] of parts.entries()) {
  let sum = 0,
    count = 0;
  for (let y = p.top; y < p.top + Math.floor(p.height * 0.25); y++)
    for (let x = p.left; x < p.left + p.width; x++)
      if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  if (!count) throw Error(`Missing head anchor in frame ${frame}`);
  const width = Math.round(p.width * scale),
    height = Math.round(p.height * scale);
  const left = Math.round(96 - (sum / count - p.left) * scale),
    top = 176 - height;
  if (left < 3 || left + width > 189 || top < 4) throw Error(`Clipped frame ${frame}`);
  layers.push({
    input: await sharp(source).extract(p).resize(width, height).png().toBuffer(),
    left: frame * 192 + left,
    top,
  });
  metrics.push({ frame, source, scale, left, top, width, height, baseline: 176 });
}
await sharp({ create: { width: 768, height: 192, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/finn-recover-offer-v1.webp");
await writeFile(
  "public/storybook-study/finn-recover-offer-v1-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
