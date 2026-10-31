import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

async function pack(source, offset) {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
  const calibration = offset
    ? parts.reduce((sum, part) => sum + part.height, 0) / 4
    : parts[0].height;
  const scale = 134 / calibration;
  const layers = [],
    metrics = [];
  for (const [index, part] of parts.entries()) {
    let sum = 0,
      count = 0;
    for (let y = part.top + Math.floor(part.height * 0.92); y < part.top + part.height; y++)
      for (let x = part.left; x < part.left + part.width; x++)
        if (data[(y * info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    if (!count) throw Error(`Missing foot in ${source}/${index}`);
    const width = Math.round(part.width * scale),
      height = Math.round(part.height * scale);
    const left = Math.round(96 - (sum / count - part.left) * scale),
      top = 176 - height;
    if (left < 3 || left + width > 189 || top < 3) throw Error(`Clipped ${source}/${index}`);
    layers.push({
      input: await sharp(source).extract(part).resize(width, height).png().toBuffer(),
      left: index * 192 + left,
      top: (offset ? 192 : 0) + top,
    });
    metrics.push({ frame: offset + index, source, scale, left, top, width, height, baseline: 176 });
  }
  return { layers, metrics };
}
const groups = await Promise.all([
  pack("assets/source/storybook/aria-forest-hand-v1.png", 0),
  pack("assets/source/storybook/aria-forest-walk-v1.png", 4),
]);
await sharp({ create: { width: 768, height: 384, channels: 4, background: "#00000000" } })
  .composite(groups.flatMap((group) => group.layers))
  .webp({ lossless: true })
  .toFile("public/storybook-study/aria-forest-handheld-v1.webp");
await writeFile(
  "public/storybook-study/aria-forest-handheld-v1-metrics.json",
  JSON.stringify(
    groups.flatMap((group) => group.metrics),
    null,
    2,
  ) + "\n",
);
