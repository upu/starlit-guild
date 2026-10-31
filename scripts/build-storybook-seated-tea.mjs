import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";
for (const [name, sourceName, standing, firstRow] of [
  ["aria-tea-v1", "seated-tea-v2", 134, true],
  ["leon-tea-v1", "leon-tea-v1", 144, false],
  ["mira-tea-v1", "mira-tea-v1", 126, false],
]) {
  const src = `assets/source/storybook/${sourceName}.png`;
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height, {
    count: firstRow ? 12 : 4,
    columns: 4,
    rows: firstRow ? 3 : 1,
  }).slice(0, 4);
  if (parts.length !== 4) throw Error("Expected four tea poses");
  const scale = standing / parts[0].height,
    layers = [],
    metrics = [];
  for (const [index, p] of parts.entries()) {
    let sum = 0,
      count = 0;
    for (let y = p.top + Math.floor(p.height * 0.85); y < p.top + p.height; y++)
      for (let x = p.left; x < p.left + p.width; x++)
        if (data[(y * info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    const width = Math.round(p.width * scale),
      height = Math.round(p.height * scale),
      left = Math.round(96 - (sum / count - p.left) * scale),
      top = 176 - height;
    if (left < 0 || left + width > 192 || top < 0) throw Error("Clipped tea pose");
    const input = await sharp(src)
      .extract({ left: p.left, top: p.top, width: p.width, height: p.height })
      .resize(width, height)
      .png()
      .toBuffer();
    layers.push({ input, left: index * 192 + left, top });
    metrics.push({ width, height, left, top, scale });
  }
  await sharp({ create: { width: 768, height: 192, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  await writeFile(`public/storybook-study/${name}-metrics.json`, JSON.stringify(metrics, null, 2));
}
