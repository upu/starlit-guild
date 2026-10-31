import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/waterway-worker-v1.png";
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const bounds = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 4,
  columns: 4,
  rows: 1,
});
if (bounds.length !== 4) throw Error("Incomplete worker strip");
const scale = 134 / bounds[0].height;
const layers = [],
  metrics = [];
for (const [frame, box] of bounds.entries()) {
  let sum = 0,
    count = 0;
  for (let y = box.top + Math.floor(box.height * 0.9); y < box.top + box.height; y++)
    for (let x = box.left; x < box.left + box.width; x++)
      if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  const width = Math.round(box.width * scale),
    height = Math.round(box.height * scale);
  const left = Math.round(96 - (sum / count - box.left) * scale),
    top = 176 - height;
  if (left < 3 || left + width > 253 || top < 4) throw Error(`Clipped worker ${frame}`);
  layers.push({
    input: await sharp(source).extract(box).resize(width, height).png().toBuffer(),
    left: frame * 256 + left,
    top,
  });
  metrics.push({ frame, width, height, left, top, scale, baseline: 176 });
}
await sharp({ create: { width: 1024, height: 192, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/waterway-worker-v1.webp");
await writeFile(
  "public/storybook-study/waterway-worker-v1-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
await sharp("assets/source/storybook/waterway-tool-cart-v1.png")
  .resize(420, 280)
  .webp({ lossless: true })
  .toFile("public/storybook-study/waterway-tool-cart-v1.webp");
await sharp("assets/source/storybook/waterway-branches-v1.png")
  .trim()
  .resize({ width: 192 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/waterway-branches-v1.webp");
console.log("Waterway worker, tool cart and hand-reachable debris packed.");
