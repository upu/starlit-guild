import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/keeper-lantern-v1.png";
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const boxes = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 4,
  columns: 4,
  rows: 1,
});
if (boxes.length !== 4) throw Error("Missing keeper lantern pose");
const scale = 134 / boxes[3].height;
const layers = [],
  metrics = [];
for (const [frame, box] of boxes.entries()) {
  let sum = 0,
    count = 0;
  // The lowered hand reaches the ground; only use the boots to align the body.
  for (let y = box.top + Math.floor(box.height * 0.9); y < box.top + box.height; y++)
    for (let x = box.left + Math.floor(box.width * 0.45); x < box.left + box.width; x++)
      if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  const width = Math.round(box.width * scale),
    height = Math.round(box.height * scale);
  const left = Math.round(96 - (sum / count - box.left) * scale),
    top = 176 - height;
  if (!count || left < 3 || left + width > 253 || top < 4) throw Error(`Clipped pose ${frame}`);
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
  .toFile("public/storybook-study/keeper-lantern-v1.webp");
await writeFile(
  "public/storybook-study/keeper-lantern-v1-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
