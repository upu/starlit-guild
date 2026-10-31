import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/lico-records-sit-transition-v1.png";
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 4,
  columns: 4,
  rows: 1,
});
if (parts.length !== 4) throw Error("Expected four Lico poses");
const scale = 128 / parts[0].height;
const layers = [],
  metrics = [];
for (const [frame, bounds] of parts.entries()) {
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
  const left = Math.round(96 - (sum / count - bounds.left) * scale),
    top = 176 - height;
  if (left < 3 || left + width > 189 || top < 4) throw Error(`Clipped pose: ${frame}`);
  layers.push({
    input: await sharp(source).extract(bounds).resize(width, height).png().toBuffer(),
    left: frame * 192 + left,
    top,
  });
  metrics.push({ frame, scale, width, height, left, top, baseline: 176 });
}
await sharp({ create: { width: 768, height: 192, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/lico-records-sit-transition-v1.webp");
await writeFile(
  "public/storybook-study/lico-records-sit-transition-v1-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
console.log(metrics);
