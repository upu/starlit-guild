import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/finn-tray-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height);
if (parts.length !== 8) throw Error("Expected eight Finn tray poses");
const scale = 148 / parts[0].height;
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
  const left = Math.round(96 - (sum / count - part.left) * scale);
  if (left < 0 || left + width > 192 || height > 176)
    throw Error(`Finn tray pose clipped: ${index}`);
  const input = await sharp(source)
    .extract({ left: part.left, top: part.top, width: part.width, height: part.height })
    .resize(width, height)
    .png()
    .toBuffer();
  layers.push({
    input,
    left: (index % 4) * 192 + left,
    top: Math.floor(index / 4) * 192 + 176 - height,
  });
  metrics.push({ width, height, left, top: 176 - height, scale });
}
await sharp({ create: { width: 768, height: 384, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/finn-tray-v1.webp");
await writeFile("public/storybook-study/finn-tray-metrics.json", JSON.stringify(metrics, null, 2));
