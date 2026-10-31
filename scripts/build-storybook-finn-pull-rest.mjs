import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/finn-pull-rest-v1.png";
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const part = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 1,
  columns: 1,
  rows: 1,
})[0];
if (!part) throw Error("Missing Finn's stopped pulling pose");
let sum = 0,
  count = 0;
for (let y = part.top; y < part.top + Math.floor(part.height * 0.3); y++)
  for (let x = part.left; x < part.left + part.width; x++)
    if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
      sum += x;
      count++;
    }
if (!count) throw Error("Missing Finn's head");
const scale = 148 / part.height,
  width = Math.round(part.width * scale),
  height = Math.round(part.height * scale);
const left = Math.round(103 - (sum / count - part.left) * scale),
  top = 176 - height;
if (left < 3 || left + width > 189 || top < 4) throw Error("Clipped Finn pose");
const input = await sharp(source).extract(part).resize(width, height).png().toBuffer();
await sharp({ create: { width: 768, height: 192, channels: 4, background: "#00000000" } })
  .composite([{ input, left, top }])
  .webp({ lossless: true })
  .toFile("public/storybook-study/finn-pull-rest-v1.webp");
await writeFile(
  "public/storybook-study/finn-pull-rest-v1-metrics.json",
  JSON.stringify(
    {
      left,
      top,
      width,
      height,
      scale,
      headX: left + (sum / count - part.left) * scale,
      baseline: 176,
    },
    null,
    2,
  ) + "\n",
);
