import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const version = process.argv[2] ?? "v1";
if (!["v1", "v2"].includes(version)) throw Error("Unknown turning version");
const source = `assets/source/storybook/merchant-turn-carry-${version}.png`;
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
if (parts.length !== 4) throw Error("Expected four turning poses");
const scale = 94 / parts[0].height;
const layers = [];
const metrics = [];
for (const [frame, part] of parts.entries()) {
  let sum = 0;
  let count = 0;
  for (let y = part.top + Math.floor(part.height * 0.85); y < part.top + part.height; y++) {
    for (let x = part.left; x < part.left + part.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
    }
  }
  if (!count) throw Error(`Missing foot anchor in frame ${frame}`);
  const width = Math.round(part.width * scale);
  const height = Math.round(part.height * scale);
  const left = Math.round(64 - (sum / count - part.left) * scale);
  if (left < 1 || left + width >= 127 || height > 116)
    throw Error(`Frame ${frame} does not fit within the padded cell`);
  layers.push({
    input: await sharp(source)
      .extract({ left: part.left, top: part.top, width: part.width, height: part.height })
      .resize(width, height)
      .png()
      .toBuffer(),
    left: frame * 128 + left,
    top: 120 - height,
  });
  metrics.push({ frame, width, height, left, baseline: 120, scale });
}
await sharp({ create: { width: 512, height: 128, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile(`public/storybook-study/merchant-turn-carry-${version}.webp`);
await writeFile(
  `public/storybook-study/merchant-turn-carry-${version}-metrics.json`,
  JSON.stringify(metrics, null, 2),
);
