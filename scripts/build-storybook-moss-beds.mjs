import sharp from "sharp";
import { writeFile, copyFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const [name, rows, standing] of [
  ["lico-moss-study-v1", 3, 128],
  ["lico-notebook-walk-v2", 2, 128],
  ["mira-moss-care-v1", 2, 126],
]) {
  const source = `assets/source/storybook/${name}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height, { count: 4 * rows, columns: 4, rows });
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
    const left = Math.round(96 - (sum / count - p.left) * scale),
      top = 176 - height;
    if (left < 0 || left + width >= 192 || top < 0) throw Error(`Clipped ${name}/${i}`);
    layers.push({
      input: await sharp(source).extract(p).resize(width, height).png().toBuffer(),
      left: (i % 4) * 192 + left,
      top: Math.floor(i / 4) * 192 + top,
    });
    metrics.push({ width, height, left, top, scale });
  }
  await sharp({ create: { width: 768, height: 192 * rows, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  await writeFile(`public/storybook-study/${name}-metrics.json`, JSON.stringify(metrics, null, 2));
}
const source = "assets/source/storybook/moss-bed-props-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 6, columns: 3, rows: 2 });
for (const [i, name] of [
  "bed-ledger",
  "bed-open-ledger",
  "bed-bread",
  "bed-label",
  "bed-stool",
  "bed-sprig",
].entries()) {
  const input = await sharp(source)
    .extract(parts[i])
    .resize(240, 232, { fit: "inside" })
    .png()
    .toBuffer();
  const size = await sharp(input).metadata();
  await sharp({ create: { width: 256, height: 256, channels: 4, background: "#00000000" } })
    .composite([{ input, left: Math.round((256 - size.width) / 2), top: 248 - size.height }])
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}-v1.webp`);
}
await copyFile(
  "assets/source/storybook/moss-beds-v1.png",
  "public/storybook-study/moss-beds-v1.png",
);
