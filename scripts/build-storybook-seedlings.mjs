import sharp from "sharp";
import { copyFile, writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

// Merrill is shorter than the adults; a single body calibration covers every pose.
const layers = [],
  metrics = [];
let scale, standingHeadX;
for (const [name, rows, start] of [
  ["merrill-seedlings-v2", 3, 0],
  ["merrill-seedlings-walk-v2", 1, 12],
]) {
  const source = `assets/source/storybook/${name}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height, { count: rows * 4, columns: 4, rows });
  if (
    parts.length !== rows * 4 ||
    parts.some((p) => p.area < 1000 || p.height > (info.height / rows) * 1.1)
  )
    throw Error(`Touching sprites in ${name}`);
  const atlasScale =
    start === 0 ? 84 / parts[0].height : 84 / Math.max(...parts.map((p) => p.height));
  if (start === 0) scale = atlasScale;
  for (const [i, p] of parts.entries()) {
    const frame = start + i,
      width = Math.round(p.width * atlasScale),
      height = Math.round(p.height * atlasScale);
    let sum = 0,
      count = 0;
    for (let y = p.top + Math.floor(p.height * 0.87); y < p.top + p.height; y++)
      for (let x = p.left; x < p.left + p.width; x++)
        if (data[(y * info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    let headSum = 0,
      headCount = 0;
    for (let y = p.top; y < p.top + Math.floor(p.height * 0.35); y++)
      for (let x = p.left; x < p.left + p.width; x++)
        if (data[(y * info.width + x) * 4 + 3] > 128) {
          headSum += x;
          headCount++;
        }
    const head = (headSum / headCount - p.left) * atlasScale;
    const left = Math.round(
        start === 12 ? standingHeadX - head : 64 - (sum / count - p.left) * atlasScale,
      ),
      top = 120 - height;
    if (frame === 0) standingHeadX = left + head;
    if (left < 2 || left + width > 126 || top < 2) throw Error(`Clipped Merrill/${frame}`);
    layers.push({
      input: await sharp(source).extract(p).resize(width, height).png().toBuffer(),
      left: (frame % 4) * 128 + left,
      top: Math.floor(frame / 4) * 128 + top,
    });
    metrics.push({
      frame,
      source: name,
      scale: atlasScale,
      width,
      height,
      left,
      top,
      baseline: 120,
      headCenter: left + head,
    });
  }
}
await sharp({ create: { width: 512, height: 512, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/merrill-seedlings-v1.webp");
await writeFile(
  "public/storybook-study/merrill-seedlings-v1-metrics.json",
  JSON.stringify({ standingScale: scale, frames: metrics }, null, 2),
);
await copyFile(
  "assets/source/storybook/tower-loading-yard-v1.png",
  "public/storybook-study/tower-loading-yard-v1.png",
);
const propSource = "assets/source/storybook/seedling-loading-props-v1.png";
const raw = await sharp(propSource).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 6,
  columns: 3,
  rows: 2,
});
if (parts.length !== 6 || parts.some((p) => p.area < 1000)) throw Error("Incomplete loading props");
const names = [
  "loading-pot",
  "loading-pot-full",
  "loading-korotake",
  "loading-cloth",
  "loading-basket-covered",
  "loading-basket",
];
const propMetrics = [];
for (const [i, p] of parts.entries()) {
  const paired = i < 2 ? parts.slice(0, 2) : i >= 4 ? parts.slice(4) : [p];
  const ratio = Math.min(
    240 / Math.max(...paired.map((p) => p.width)),
    232 / Math.max(...paired.map((p) => p.height)),
  );
  const width = Math.round(p.width * ratio),
    height = Math.round(p.height * ratio);
  await sharp({ create: { width: 256, height: 256, channels: 4, background: "#00000000" } })
    .composite([
      {
        input: await sharp(propSource).extract(p).resize(width, height).png().toBuffer(),
        left: Math.round((256 - width) / 2),
        top: 248 - height,
      },
    ])
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${names[i]}-v1.webp`);
  propMetrics.push({ name: names[i], width, height, scale: ratio, baseline: 248 });
}
await writeFile(
  "public/storybook-study/seedling-loading-props-v1-metrics.json",
  JSON.stringify(propMetrics, null, 2),
);
