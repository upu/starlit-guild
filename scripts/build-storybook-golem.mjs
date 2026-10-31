import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/golem-poses-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height);
const scale = 384 / parts[0].height;
const layers = [],
  metrics = [];
for (const [index, part] of parts.entries()) {
  let sum = 0,
    count = 0;
  // Walking alternates the planted foot; register the lower body rather than
  // chasing that foot horizontally and making the torso lurch each step.
  const baseBand = index >= 1 && index <= 4 ? 0.7 : 0.94;
  for (let y = part.top + Math.floor(part.height * baseBand); y < part.top + part.height; y++) {
    for (let x = part.left; x < part.left + part.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
    }
  }
  const width = Math.round(part.width * scale),
    height = Math.round(part.height * scale);
  const left = Math.round(256 - (sum / count - part.left) * scale);
  if (left < 0 || left + width > 512 || height > 480) throw Error(`Golem clipped: ${index}`);
  const input = await sharp(source)
    .extract({ left: part.left, top: part.top, width: part.width, height: part.height })
    .resize(width, height)
    .png()
    .toBuffer();
  layers.push({
    input,
    left: (index % 4) * 512 + left,
    top: Math.floor(index / 4) * 512 + 480 - height,
  });
  metrics.push({ width, height, left, top: 480 - height, scale });
}
await sharp({ create: { width: 2048, height: 1024, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/golem-poses-v1.webp");
await writeFile("public/storybook-study/golem-metrics.json", JSON.stringify(metrics, null, 2));
