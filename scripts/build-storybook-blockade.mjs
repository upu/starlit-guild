import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/masked-pumpety-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 12, columns: 4, rows: 3 });
if (parts.length !== 12) throw Error("Missing masked poses");
// The helmet is deliberately smaller than the adult figures' 89–96px body height.
const scale = 78 / parts[0].height;
const layers = [],
  metrics = [];
for (const [frame, part] of parts.entries()) {
  const width = Math.round(part.width * scale),
    height = Math.round(part.height * scale);
  let sum = 0,
    count = 0;
  for (let y = part.top + Math.floor(part.height * 0.85); y < part.top + part.height; y++)
    for (let x = part.left; x < part.left + part.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  const left = Math.round(64 - (sum / count - part.left) * scale),
    top = 120 - height;
  if (left < 3 || left + width > 125 || top < 4) throw Error(`Clipped masked pose ${frame}`);
  layers.push({
    input: await sharp(source).extract(part).resize(width, height).png().toBuffer(),
    left: (frame % 4) * 128 + left,
    top: Math.floor(frame / 4) * 128 + top,
  });
  metrics.push({ frame, scale, width, height, left, top, baseline: 120 });
}
await sharp({ create: { width: 512, height: 384, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/masked-pumpety-v1.webp");
await writeFile(
  "public/storybook-study/masked-pumpety-v1-metrics.json",
  JSON.stringify(metrics, null, 2),
);

const supplies = "assets/source/storybook/blockade-supplies-v1.png";
const raw = await sharp(supplies).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const props = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 4,
  columns: 2,
  rows: 2,
});
for (const [i, name] of [
  "honey-v1",
  "honey-bag-v1",
  "honey-bag-open-v1",
  "trade-parcels-open-v1",
].entries())
  await sharp(supplies)
    .extract(props[i])
    .resize({ width: 256 })
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);

// Bring the existing 84px worker actions to the same adult scale as the 94px standing strip.
const worker = [];
for (let i = 0; i < 12; i++) {
  const enlarged = await sharp("public/storybook-study/worker-transplant-v1.webp")
    .extract({ left: (i % 4) * 128, top: Math.floor(i / 4) * 128, width: 128, height: 128 })
    .resize(143, 143)
    .png()
    .toBuffer();
  worker.push({
    input: await sharp(enlarged)
      .extract({ left: 8, top: 14, width: 128, height: 128 })
      .png()
      .toBuffer(),
    left: (i % 4) * 128,
    top: Math.floor(i / 4) * 128,
  });
}
await sharp({ create: { width: 512, height: 384, channels: 4, background: "#00000000" } })
  .composite(worker)
  .webp({ lossless: true })
  .toFile("public/storybook-study/worker-road-v1.webp");

const cart = await sharp("assets/source/storybook/handcart-raised-v1.png")
  .trim({ threshold: 16 })
  .resize({ width: 512 })
  .png()
  .toBuffer({ resolveWithObject: true });
if (cart.info.height > 304) throw Error("Raised cart does not fit wheel baseline");
await sharp({ create: { width: 512, height: 320, channels: 4, background: "#00000000" } })
  .composite([{ input: cart.data, left: 0, top: 304 - cart.info.height }])
  .webp({ lossless: true })
  .toFile("public/storybook-study/handcart-raised-v1.webp");
