import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/finn-handheld-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 8, columns: 4, rows: 2 });
const scale = 148 / parts[0].height,
  layers = [],
  metrics = [];
function headCenter(p) {
  let sum = 0,
    count = 0;
  for (let y = p.top; y < p.top + Math.floor(p.height * 0.3); y++)
    for (let x = p.left; x < p.left + p.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  return sum / count;
}
let standingHead;
for (const [frame, p] of parts.entries()) {
  let foot = 0,
    count = 0;
  for (let y = p.top + Math.floor(p.height * 0.92); y < p.top + p.height; y++)
    for (let x = p.left; x < p.left + p.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        foot += x;
        count++;
      }
  if (!count) throw Error(`Missing boot anchor ${frame}`);
  const width = Math.round(p.width * scale),
    height = Math.round(p.height * scale),
    left = Math.round(
      frame >= 4
        ? standingHead - (headCenter(p) - p.left) * scale
        : 96 - (foot / count - p.left) * scale,
    ),
    top = 176 - height;
  if (left < 3 || left + width > 189 || top < 3) throw Error(`Clipped Finn pose ${frame}`);
  if (frame === 0) standingHead = left + (headCenter(p) - p.left) * scale;
  layers.push({
    input: await sharp(source).extract(p).resize(width, height).png().toBuffer(),
    left: (frame % 4) * 192 + left,
    top: Math.floor(frame / 4) * 192 + top,
  });
  metrics.push({
    frame,
    source,
    scale,
    left,
    top,
    width,
    height,
    baseline: 176,
    headX: left + (headCenter(p) - p.left) * scale,
  });
}
if (metrics[1].height >= metrics[0].height * 0.85) throw Error("Crouch stays too tall");
await sharp({ create: { width: 768, height: 384, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/finn-handheld-v1.webp");
await writeFile(
  "public/storybook-study/finn-handheld-v1-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);

const gate = "assets/source/storybook/berne-gate-v1.png";
const raw = await sharp(gate).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const [bounds] = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 1,
  columns: 1,
  rows: 1,
});
await sharp(gate)
  .extract(bounds)
  .resize({ width: 1024 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/berne-gate-v1.webp");
await writeFile(
  "public/storybook-study/berne-gate-v1-metrics.json",
  JSON.stringify({ source: gate, bounds, width: 1024 }, null, 2) + "\n",
);
