import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/leon-kneel-notes-v1.png";
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 4,
  columns: 4,
  rows: 1,
});
if (parts.length !== 4) throw Error("Kneeling notes needs four separate figures");
const scale = 144 / parts[0].height;
const layers = [];
const metrics = [];
for (const [frame, part] of parts.entries()) {
  let headX = 0,
    pixels = 0;
  for (let y = part.top; y < part.top + Math.floor(part.height * 0.3); y++)
    for (let x = part.left; x < part.left + part.width; x++)
      if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
        headX += x;
        pixels++;
      }
  if (!pixels) throw Error(`Missing head in frame ${frame}`);
  const width = Math.round(part.width * scale);
  const height = Math.round(part.height * scale);
  const left = Math.round(94 - (headX / pixels - part.left) * scale);
  const top = 176 - height;
  if (left < 3 || left + width > 189 || top < 4) throw Error(`Clipped frame ${frame}`);
  layers.push({
    input: await sharp(source)
      .extract(part)
      .resize(width, height, { kernel: "nearest" })
      .png()
      .toBuffer(),
    left: frame * 192 + left,
    top,
  });
  metrics.push({ frame, scale, left, top, width, height, baseline: 176 });
}
await sharp({ create: { width: 768, height: 192, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/leon-kneel-notes-v1.webp");
await writeFile(
  "public/storybook-study/leon-kneel-notes-v1-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
