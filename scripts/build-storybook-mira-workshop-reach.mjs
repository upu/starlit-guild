import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/mira-workshop-reach-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const part = spriteBounds(data, info.width, info.height, { count: 8, columns: 4, rows: 2 })[0];
let sum = 0,
  count = 0;
for (let y = part.top + Math.floor(part.height * 0.9); y < part.top + part.height; y++)
  for (let x = part.left; x < part.left + part.width; x++)
    if (data[(y * info.width + x) * 4 + 3] > 128) {
      sum += x;
      count++;
    }
if (!count) throw Error("Missing Mira's planted feet");
const scale = 126 / part.height;
const width = Math.round(part.width * scale),
  height = Math.round(part.height * scale);
const left = Math.round(96 - (sum / count - part.left) * scale),
  top = 176 - height;
if (left < 3 || left + width > 189 || top < 3) throw Error("Mira's reach exceeds the sprite cell");
const input = await sharp(source).extract(part).resize(width, height).png().toBuffer();
await sharp({ create: { width: 192, height: 192, channels: 4, background: "#00000000" } })
  .composite([{ input, left, top }])
  .webp({ lossless: true })
  .toFile("public/storybook-study/mira-workshop-reach-v1.webp");
await writeFile(
  "public/storybook-study/mira-workshop-reach-v1-metrics.json",
  JSON.stringify({ left, top, width, height, scale, baseline: 176 }, null, 2) + "\n",
);
