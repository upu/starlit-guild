import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const [name, count] of [
  ["aria-forest-carry-stand-v1", 1],
  ["aria-forest-carry-walk-v1", 4],
]) {
  const source = `assets/source/storybook/${name}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
  const scale = 134 / parts[0].height;
  const layers = [],
    metrics = [];
  for (const [frame, part] of parts.slice(0, count).entries()) {
    let feet = 0,
      n = 0;
    for (let y = part.top + Math.floor(part.height * 0.9); y < part.top + part.height; y++)
      for (let x = part.left; x < part.left + part.width; x++)
        if (data[(y * info.width + x) * 4 + 3] > 128) {
          feet += x;
          n++;
        }
    if (!n) throw Error(`Missing feet in ${name} frame ${frame}`);
    const width = Math.round(part.width * scale),
      height = Math.round(part.height * scale);
    const left = Math.round(96 - (feet / n - part.left) * scale),
      top = 176 - height;
    if (left < 3 || left + width > 189 || top < 3) throw Error(`Clipped ${name} frame ${frame}`);
    layers.push({
      input: await sharp(source).extract(part).resize(width, height).png().toBuffer(),
      left: frame * 192 + left,
      top,
    });
    metrics.push({ frame, left, top, width, height, scale, baseline: 176 });
  }
  await sharp({ create: { width: count * 192, height: 192, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  await writeFile(
    `public/storybook-study/${name}-metrics.json`,
    JSON.stringify(metrics, null, 2) + "\n",
  );
}
