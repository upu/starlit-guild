import sharp from "sharp";
import { copyFile, writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const [id, standing] of [
  ["aria", 134],
  ["leon", 144],
]) {
  const source = `assets/source/storybook/${id}-forage-v1.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bounds = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
  if (bounds.length !== 4) throw Error(`Missing forage pose ${id}`);
  const scale = standing / bounds[0].height,
    layers = [],
    metrics = [];
  for (const [frame, p] of bounds.entries()) {
    let feet = 0,
      count = 0;
    for (let y = p.top + Math.floor(p.height * 0.9); y < p.top + p.height; y++)
      for (let x = p.left; x < p.left + p.width; x++)
        if (data[(y * info.width + x) * 4 + 3] > 128) {
          feet += x;
          count++;
        }
    const width = Math.round(p.width * scale),
      height = Math.round(p.height * scale),
      left = Math.round(96 - (feet / count - p.left) * scale),
      top = 176 - height;
    if (left < 3 || left + width > 189 || top < 3) throw Error(`Clipped ${id}/${frame}`);
    layers.push({
      input: await sharp(source).extract(p).resize(width, height).png().toBuffer(),
      left: frame * 192 + left,
      top,
    });
    metrics.push({ frame, left, top, width, height, scale, baseline: 176 });
  }
  await sharp({ create: { width: 768, height: 192, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${id}-forage-v1.webp`);
  await writeFile(
    `public/storybook-study/${id}-forage-v1-metrics.json`,
    JSON.stringify(metrics, null, 2) + "\n",
  );
}
await copyFile(
  "assets/source/storybook/forest-lane-loop-v1.png",
  "public/storybook-study/forest-lane-loop-v1.png",
);
await copyFile(
  "assets/source/storybook/forest-moon-lane-loop-v1.png",
  "public/storybook-study/forest-moon-lane-loop-v1.png",
);
const herb = "assets/source/storybook/forage-herb-v1.png";
const raw = await sharp(herb).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const [patch] = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 1,
  columns: 1,
  rows: 1,
});
await sharp(herb)
  .extract(patch)
  .resize({ width: 256 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/forage-herb-v1.webp");
