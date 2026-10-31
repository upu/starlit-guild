import sharp from "sharp";
import { copyFile, writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const metrics = [];
for (const [id, standing] of [
  ["aria", 134],
  ["leon", 144],
]) {
  const source = `assets/source/storybook/${id}-lunch-v1.png`;
  const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
    count: 8,
    columns: 4,
    rows: 2,
  });
  const scale = standing / parts[0].height,
    layers = [],
    poses = [];
  for (const [frame, p] of parts.entries()) {
    let sum = 0,
      count = 0;
    for (let y = p.top + Math.floor(p.height * 0.9); y < p.top + p.height; y++)
      for (let x = p.left; x < p.left + p.width; x++)
        if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    const width = Math.round(p.width * scale),
      height = Math.round(p.height * scale),
      left = Math.round(96 - (sum / count - p.left) * scale),
      top = 176 - height;
    if (left < 3 || left + width > 189 || top < 3) throw Error(`Clipped lunch pose ${id}/${frame}`);
    layers.push({
      input: await sharp(source).extract(p).resize(width, height).png().toBuffer(),
      left: (frame % 4) * 192 + left,
      top: Math.floor(frame / 4) * 192 + top,
    });
    poses.push({ frame, width, height, left, top, scale, baseline: 176 });
  }
  await sharp({ create: { width: 768, height: 384, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${id}-lunch-v1.webp`);
  await writeFile(
    `public/storybook-study/${id}-lunch-v1-metrics.json`,
    JSON.stringify(poses, null, 2),
  );
}
async function objects(name, columns, rows, names) {
  const source = `assets/source/storybook/${name}.png`;
  const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
    count: columns * rows,
    columns,
    rows,
  });
  if (parts.length !== columns * rows) throw Error(`Incomplete ${name}`);
  for (const [i, output] of names.entries()) {
    if (!output) continue;
    const p = parts[i],
      scale = Math.min(240 / p.width, 232 / p.height);
    const width = Math.round(p.width * scale),
      height = Math.round(p.height * scale);
    const image = await sharp(source).extract(p).resize(width, height).png().toBuffer();
    await sharp({ create: { width: 256, height: 256, channels: 4, background: "#00000000" } })
      .composite([{ input: image, left: Math.round((256 - width) / 2), top: 248 - height }])
      .webp({ lossless: true })
      .toFile(`public/storybook-study/${output}.webp`);
    metrics.push({ name: output, source, bounds: p, width, height, scale });
  }
}
await objects("lunch-and-receipt-props-v1", 4, 2, [
  "lunch-honey-cake-v1",
  "lunch-honey-cake-bitten-v1",
  "lunch-walnut-cake-v1",
  "lunch-cake-parcel-v1",
  "lunch-bread-v1",
  "lunch-twine-v1",
]);
await objects("berne-shipping-paper-v1", 2, 1, [
  "berne-shipping-front-v1",
  "berne-shipping-back-v1",
]);
const source = "assets/source/storybook/overlook-props-v1.png";
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 3,
  columns: 3,
  rows: 1,
});
await sharp(source)
  .extract(parts[2])
  .resize({ width: 384 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/berne-rest-ledge-v1.webp");
for (const name of ["picnic-hill-v1", "berne-overlook-v1"])
  await copyFile(`assets/source/storybook/${name}.png`, `public/storybook-study/${name}.png`);
await writeFile(
  "public/storybook-study/lunch-overlook-prop-metrics.json",
  JSON.stringify(metrics, null, 2),
);
