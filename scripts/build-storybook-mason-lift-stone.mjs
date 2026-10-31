import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/mason-lift-stone-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
if (parts.length !== 4) throw Error("Expected four lifting poses");
// The final upright frame matches the 94px standing mason; keep this single
// scale for every pose so that the crouch is not enlarged to fill its cell.
const scale = 94 / parts[3].height;
const layers = [],
  metrics = [];
for (const [frame, part] of parts.entries()) {
  let sum = 0,
    count = 0;
  for (let y = part.top; y < part.top + Math.floor(part.height * 0.3); y++)
    for (let x = part.left; x < part.left + part.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  if (!count) throw Error(`Missing mason head ${frame}`);
  const width = Math.round(part.width * scale),
    height = Math.round(part.height * scale);
  const head = (sum / count - part.left) * scale;
  const left = Math.round(69 - head),
    top = 120 - height;
  if (left < 3 || left + width > 125 || top < 3) throw Error(`Clipped mason ${frame}`);
  layers.push({
    input: await sharp(source).extract(part).resize(width, height).png().toBuffer(),
    left: frame * 128 + left,
    top,
  });
  metrics.push({ frame, scale, left, top, width, height, baseline: 120, headX: left + head });
}
await sharp({ create: { width: 512, height: 128, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/mason-lift-stone-v1.webp");
await writeFile(
  "public/storybook-study/mason-lift-stone-v1-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
console.log(metrics);
