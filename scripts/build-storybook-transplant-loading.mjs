import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";
const source = "assets/source/storybook/farm-hoe-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const [p] = spriteBounds(data, info.width, info.height, { count: 1, columns: 1, rows: 1 });
const scale = 608 / p.height;
let sum = 0,
  count = 0;
for (let y = p.top + Math.floor(p.height * 0.9); y < p.top + p.height; y++)
  for (let x = p.left; x < p.left + p.width; x++)
    if (data[(y * info.width + x) * 4 + 3] > 128) {
      sum += x;
      count++;
    }
const width = Math.round(p.width * scale),
  height = Math.round(p.height * scale),
  left = Math.round(160 - (sum / count - p.left) * scale),
  top = 624 - height;
if (left < 4 || left + width > 316) throw Error("Clipped hoe blade");
await sharp({ create: { width: 320, height: 640, channels: 4, background: "#00000000" } })
  .composite([
    { input: await sharp(source).extract(p).resize(width, height).png().toBuffer(), left, top },
  ])
  .webp({ lossless: true })
  .toFile("public/storybook-study/farm-hoe-v1.webp");
await writeFile(
  "public/storybook-study/farm-hoe-v1-metrics.json",
  JSON.stringify(
    {
      source,
      scale,
      width,
      height,
      left,
      top,
      baseline: 624,
      shaftCenter: 160,
      canvas: [320, 640],
    },
    null,
    2,
  ),
);
