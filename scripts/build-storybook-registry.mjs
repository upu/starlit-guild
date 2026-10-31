import sharp from "sharp";
import { copyFile, writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const who of ["keeper", "merchant"]) {
  const name = `${who}-registry-v1`,
    source = `assets/source/storybook/${name}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height, { count: 8, columns: 4, rows: 2 });
  const scale = 94 / parts[0].height,
    layers = [],
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
    const left = Math.round(64 - (sum / count - p.left) * scale),
      top = 120 - height;
    if (left < 0 || left + width >= 128 || top < 0) throw Error(`Clipped ${name}/${i}`);
    layers.push({
      input: await sharp(source).extract(p).resize(width, height).png().toBuffer(),
      left: (i % 4) * 128 + left,
      top: Math.floor(i / 4) * 128 + top,
    });
    metrics.push({ width, height, left, top, scale });
  }
  await sharp({ create: { width: 512, height: 256, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  await writeFile(`public/storybook-study/${name}-metrics.json`, JSON.stringify(metrics, null, 2));
}
await copyFile(
  "assets/source/storybook/tower-registry-v1.png",
  "public/storybook-study/tower-registry-v1.png",
);
