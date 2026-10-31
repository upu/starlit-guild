import sharp from "sharp";
import { copyFile, writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const [name, rows, cell, sole, height] of [
  ["household-parent-v1", 2, 128, 120, 94],
  ["household-cook-v1", 2, 128, 120, 94],
  ["homeward-worker-v1", 2, 128, 120, 96],
  ["household-child-bed-v1", 1, 512, 480, 460],
]) {
  const source = `assets/source/storybook/${name}.png`;
  const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
    count: rows * 4,
    columns: 4,
    rows,
  });
  if (parts.length !== rows * 4) throw Error(`Incomplete ${name}`);
  const scale = height / parts[0].height;
  const layers = [],
    metrics = [];
  for (const [frame, p] of parts.entries()) {
    const width = Math.round(p.width * scale),
      height = Math.round(p.height * scale);
    const left = name.includes("bed")
        ? Math.round((cell - width) / 2)
        : Math.round(cell / 2 - (footCenter(raw, p) - p.left) * scale),
      top = sole - height;
    if (left < 3 || top < 3) throw Error(`Clipped ${name}/${frame}`);
    layers.push({
      input: await sharp(source).extract(p).resize(width, height).png().toBuffer(),
      left: (frame % 4) * cell + left,
      top: Math.floor(frame / 4) * cell + top,
    });
    metrics.push({ frame, width, height, left, top, scale, baseline: sole });
  }
  await sharp({
    create: { width: cell * 4, height: cell * rows, channels: 4, background: "#00000000" },
  })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  await writeFile(`public/storybook-study/${name}-metrics.json`, JSON.stringify(metrics, null, 2));
}
function footCenter(raw, bounds) {
  let sum = 0,
    count = 0;
  for (let y = bounds.top + Math.floor(bounds.height * 0.85); y < bounds.top + bounds.height; y++)
    for (let x = bounds.left; x < bounds.left + bounds.width; x++)
      if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  if (!count) throw Error("Missing feet in household atlas");
  return sum / count;
}
const source = "assets/source/storybook/household-carry-props-v1.png";
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 4,
  columns: 2,
  rows: 2,
});
for (const [i, p] of parts.entries()) {
  const scale = Math.min(240 / p.width, 232 / p.height),
    width = Math.round(p.width * scale),
    height = Math.round(p.height * scale);
  const input = await sharp(source).extract(p).resize(width, height).png().toBuffer();
  const name = [
    "household-water-bucket",
    "homeward-bottles",
    "homeward-receipts",
    "homeward-medicine",
  ][i];
  await sharp({ create: { width: 256, height: 256, channels: 4, background: "#00000000" } })
    .composite([{ input, left: Math.round((256 - width) / 2), top: 248 - height }])
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}-v1.webp`);
}
for (const name of ["settlement-house-v1", "settlement-patient-room-v1"])
  await copyFile(`assets/source/storybook/${name}.png`, `public/storybook-study/${name}.png`);
