import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/leon-basket-turn-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
if (parts.length !== 4) throw Error("Expected four isolated turn poses");
const scale = 144 / parts[0].height,
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
  if (!count) throw Error(`Missing feet in frame ${frame}`);
  const width = Math.round(part.width * scale),
    height = Math.round(part.height * scale),
    left = Math.round(96 - (sum / count - part.left) * scale),
    top = 176 - height;
  if (left < 4 || left + width > 188 || top < 4) throw Error(`Clipped frame ${frame}`);
  const input = await sharp(source).extract(part).resize(width, height).png().toBuffer();
  layers.push({ input, left: frame * 192 + left, top });
  metrics.push({ frame, scale, left, top, width, height, baseline: 176 });
}
await sharp({ create: { width: 768, height: 192, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/leon-basket-turn-v1.webp");
await writeFile(
  "public/storybook-study/leon-basket-turn-v1-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
