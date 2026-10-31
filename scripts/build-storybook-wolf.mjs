import sharp from "sharp";
import { writeFile } from "node:fs/promises";
const source = "assets/source/storybook/wolf-v1.png";
const trimmed = await sharp(source).trim().png().toBuffer();
const meta = await sharp(trimmed).metadata();
const height = 384,
  width = Math.round((meta.width * height) / meta.height);
const input = await sharp(trimmed).resize(width, height).png().toBuffer();
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: "#00000000" } })
  .composite([{ input, left: Math.round((1024 - width) / 2), top: 960 - height }])
  .webp({ lossless: true })
  .toFile("public/storybook-study/wolf-v1.webp");
await writeFile(
  "public/storybook-study/wolf-metrics.json",
  JSON.stringify({ width, height, foot: 960, cell: 1024 }, null, 2),
);
