import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";
const src = "assets/source/storybook/linde-table-v1.png";
const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const [p] = spriteBounds(data, info.width, info.height, { count: 1, columns: 1, rows: 1 });
const scale = Math.min(368 / p.width, 144 / p.height),
  width = Math.round(p.width * scale),
  height = Math.round(p.height * scale),
  left = Math.round((384 - width) / 2),
  top = 152 - height;
const input = await sharp(src)
  .extract({ left: p.left, top: p.top, width: p.width, height: p.height })
  .resize(width, height)
  .png()
  .toBuffer();
await sharp({ create: { width: 384, height: 160, channels: 4, background: "#00000000" } })
  .composite([{ input, left, top }])
  .webp({ lossless: true })
  .toFile("public/storybook-study/linde-table-v1.webp");
await writeFile(
  "public/storybook-study/linde-table-v1-metrics.json",
  JSON.stringify({ width, height, left, top, scale }, null, 2),
);
console.log({ width, height, left, top });
