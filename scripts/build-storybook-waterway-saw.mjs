import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/waterway-worker-saw-lower-v1.png";
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const boxes = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 4,
  columns: 4,
  rows: 1,
});
if (boxes.length !== 4) throw Error("Incomplete saw-lowering strip");
const scale = 134 / boxes[3].height,
  layers = [],
  metrics = [];
for (const [frame, box] of boxes.entries()) {
  let sum = 0,
    count = 0;
  // The lowered blade is as low as the soles; exclude it from the boot anchor.
  const endX = box.left + Math.floor(box.width * (frame < 2 ? 0.6 : 1));
  for (let y = box.top + Math.floor(box.height * 0.9); y < box.top + box.height; y++)
    for (let x = box.left; x < endX; x++)
      if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  if (!count) throw Error(`No boots ${frame}`);
  const width = Math.round(box.width * scale),
    height = Math.round(box.height * scale);
  const left = Math.round(96 - (sum / count - box.left) * scale),
    top = 176 - height;
  if (left < 3 || left + width > 253 || top < 4) throw Error(`Clipped ${frame}`);
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
  .toFile("public/storybook-study/waterway-worker-saw-lower-v1.webp");
await writeFile(
  "public/storybook-study/waterway-worker-saw-lower-v1-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
await sharp("assets/source/storybook/waterway-saw-v1.png")
  .trim()
  .resize({ width: 256 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/waterway-saw-v1.webp");
console.log("Saw lowering and persistent ground saw packed.");
