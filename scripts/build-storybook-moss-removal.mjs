import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/aria-moss-scrape-v1.png";
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const boxes = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 4,
  columns: 4,
  rows: 1,
});
if (boxes.length !== 4) throw Error("Incomplete moss-scraping atlas");
const scale = 134 / boxes[0].height;
const layers = [],
  metrics = [];
for (const [frame, box] of boxes.entries()) {
  let sum = 0,
    count = 0;
  // The raised spatula is never part of the boot anchor.
  for (let y = box.top + Math.floor(box.height * 0.9); y < box.top + box.height; y++)
    for (let x = box.left; x < box.left + box.width * 0.65; x++)
      if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  if (!count) throw Error(`Missing boots: ${frame}`);
  const width = Math.round(box.width * scale),
    height = Math.round(box.height * scale);
  const left = Math.round(96 - (sum / count - box.left) * scale),
    top = 176 - height;
  if (left < 3 || left + width > 253 || top < 4) throw Error(`Clipped scraper ${frame}`);
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
  .toFile("public/storybook-study/aria-moss-scrape-v1.webp");
await writeFile(
  "public/storybook-study/aria-moss-scrape-v1-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
await sharp("assets/source/storybook/waterway-hatch-moss-v1.png")
  .trim()
  .resize({ width: 512 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/waterway-hatch-moss-v1.webp");
console.log("Registered moss-removal assets with common figure scale and planted boots.");
