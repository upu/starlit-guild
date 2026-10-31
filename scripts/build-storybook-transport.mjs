import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

function headCenter(data, stride, part) {
  let left = stride,
    right = 0;
  for (let y = part.top; y < part.top + part.height * 0.28; y++)
    for (let x = part.left; x < part.left + part.width; x++)
      if (data[(y * stride + x) * 4 + 3] > 128) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
  return (left + right) / 2;
}

const source = "assets/source/storybook/leon-pull-walk-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
const reference = await sharp("public/storybook-study/leon-walk-v1.webp")
  .extract({ left: 0, top: 0, width: 192, height: 192 })
  .ensureAlpha()
  .raw()
  .toBuffer();
const referencePart = spriteBounds(reference, 192, 192, { count: 1, columns: 1, rows: 1 })[0];
const anchor = headCenter(reference, 192, referencePart);
const scale = referencePart.height / parts[0].height;
const layers = [],
  metrics = [];
for (const [frame, part] of parts.entries()) {
  const { left, top, width, height } = part;
  const w = Math.round(width * scale),
    h = Math.round(height * scale);
  const x = Math.round(anchor - (headCenter(data, info.width, part) - left) * scale);
  if (x < 0 || x + w > 192 || h > 176) throw Error(`Transport frame exceeds cell: ${frame}`);
  const input = await sharp(source)
    .extract({ left, top, width, height })
    .resize(w, h)
    .png()
    .toBuffer();
  layers.push({ input, left: frame * 192 + x, top: 176 - h });
  metrics.push({ frame, scale, width: w, height: h, left: x, baseline: 176 });
}
await sharp({ create: { width: 768, height: 192, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/leon-pull-v1.webp");
await writeFile("public/storybook-study/leon-pull-metrics.json", JSON.stringify(metrics, null, 2));
