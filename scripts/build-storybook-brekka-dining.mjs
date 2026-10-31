import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";
for (const [name, cell, sole, heights] of [
  ["brekka-pair-drinks-v2", 192, 176, [134, 144]],
  ["brekka-adult-drinks-v1", 192, 176, [126, 148]],
  ["brekka-npc-drinks-v1", 128, 120, [94, 94]],
  ["brekka-leon-drinks-v1", 192, 176, [144]],
  ["brekka-worker-drinks-v1", 128, 120, [94]],
]) {
  const source = `assets/source/storybook/${name}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height, {
    count: heights.length * 4,
    columns: 4,
    rows: heights.length,
  });
  const metrics = [],
    layers = [];
  for (const [i, p] of parts.entries()) {
    const row = Math.floor(i / 4),
      scale = heights[row] / parts[row * 4].height;
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
    const left = Math.round(cell / 2 - (sum / count - p.left) * scale);
    if (left < 0 || left + width >= cell || height > sole) throw Error(`Clipped ${name}/${i}`);
    const input = await sharp(source).extract(p).resize(width, height).png().toBuffer();
    layers.push({ input, left: (i % 4) * cell + left, top: row * cell + sole - height });
    metrics.push({ width, height, left, top: sole - height, scale });
  }
  await sharp({
    create: {
      width: cell * 4,
      height: cell * heights.length,
      channels: 4,
      background: "#00000000",
    },
  })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  await writeFile(`public/storybook-study/${name}-metrics.json`, JSON.stringify(metrics, null, 2));
}
const source = "assets/source/storybook/brekka-drink-props-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 6, columns: 3, rows: 2 });
const names = [
    "ale-cup-empty",
    "ale-cup-full",
    "fruit-glass",
    "ale-jug",
    "bread-roll",
    "serving-tray",
  ],
  metrics = [];
for (const [i, p] of parts.entries()) {
  const scale =
    i < 2
      ? Math.min(240 / parts[0].width, 232 / parts[0].height)
      : Math.min(240 / p.width, 232 / p.height);
  const width = Math.round(p.width * scale),
    height = Math.round(p.height * scale),
    left = Math.round((256 - width) / 2),
    top = 248 - height;
  if (left < 0 || top < 0) throw Error(`Clipped ${names[i]}`);
  const input = await sharp(source).extract(p).resize(width, height).png().toBuffer();
  await sharp({ create: { width: 256, height: 256, channels: 4, background: "#00000000" } })
    .composite([{ input, left, top }])
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${names[i]}-v1.webp`);
  metrics.push({ name: names[i], width, height, left, top, scale });
}
await writeFile(
  "public/storybook-study/brekka-drink-props-v1-metrics.json",
  JSON.stringify(metrics, null, 2),
);
