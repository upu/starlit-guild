import sharp from "sharp";
import { writeFile, copyFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const [name, cell, sole, standing] of [
  ["doctor-visit-v1", 128, 120, 94],
  ["patient-visit-v1", 128, 120, 94],
  ["mira-knock-v1", 192, 176, 126],
  ["mira-bag-place-v1", 192, 176, 126],
]) {
  const source = `assets/source/storybook/${name}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
  const scale = standing / parts[0].height;
  const layers = [],
    metrics = [];
  for (const [i, p] of parts.entries()) {
    const width = Math.round(p.width * scale),
      height = Math.round(p.height * scale);
    let sum = 0,
      count = 0;
    for (let y = p.top + Math.floor(p.height * 0.85); y < p.top + p.height; y++)
      for (let x = p.left; x < p.left + p.width; x++)
        if (data[(y * info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    const left = Math.round(cell / 2 - (sum / count - p.left) * scale),
      top = sole - height;
    if (left < 0 || left + width >= cell || top < 0) throw Error(`Clipped ${name}/${i}`);
    const input = await sharp(source).extract(p).resize(width, height).png().toBuffer();
    layers.push({ input, left: i * cell + left, top });
    metrics.push({ width, height, left, top, scale });
  }
  await sharp({ create: { width: cell * 4, height: cell, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  await writeFile(`public/storybook-study/${name}-metrics.json`, JSON.stringify(metrics, null, 2));
}
const source = "assets/source/storybook/visit-tea-props-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 2, columns: 2, rows: 1 });
for (const [i, p] of parts.entries()) {
  const scale = Math.min(240 / p.width, 232 / p.height);
  const width = Math.round(p.width * scale),
    height = Math.round(p.height * scale);
  const input = await sharp(source).extract(p).resize(width, height).png().toBuffer();
  await sharp({ create: { width: 256, height: 256, channels: 4, background: "#00000000" } })
    .composite([{ input, left: Math.round((256 - width) / 2), top: 248 - height }])
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${i ? "patient-teacup" : "patient-ale-bottle"}-v1.webp`);
}
for (const name of ["patient-room-v1", "brekka-homes-v1"])
  await copyFile(`assets/source/storybook/${name}.png`, `public/storybook-study/${name}.png`);
