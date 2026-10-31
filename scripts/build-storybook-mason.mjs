import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/mason-motion-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height);
if (parts.length !== 8) throw Error("Expected eight mason poses");
const scale = 94 / parts[0].height;
const layers = [],
  metrics = [];
for (const [index, part] of parts.entries()) {
  let sum = 0,
    count = 0;
  const band = index >= 1 && index <= 4 ? 0.7 : 0.85;
  for (let y = part.top + Math.floor(part.height * band); y < part.top + part.height; y++) {
    for (let x = part.left; x < part.left + part.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
    }
  }
  const width = Math.round(part.width * scale),
    height = Math.round(part.height * scale);
  const left = Math.round(64 - (sum / count - part.left) * scale);
  if (left < 0 || left + width > 128 || height > 120) throw Error(`Mason clipped: ${index}`);
  const input = await sharp(source)
    .extract({ left: part.left, top: part.top, width: part.width, height: part.height })
    .resize(width, height)
    .png()
    .toBuffer();
  layers.push({
    input,
    left: (index % 4) * 128 + left,
    top: Math.floor(index / 4) * 128 + 120 - height,
  });
  metrics.push({ width, height, left, top: 120 - height, scale });
}
await sharp({ create: { width: 512, height: 256, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/mason-motion-v1.webp");
await writeFile(
  "public/storybook-study/mason-motion-metrics.json",
  JSON.stringify(metrics, null, 2),
);
