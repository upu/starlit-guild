import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

// Hair silhouette is never a scale reference: all poses retain one body scale.
for (const [kind, rows, standingHeight] of [
  ["conversation", 1, 128],
  ["work", 1, 128],
  ["walk", 1, 125],
  ["moss-study", 3, 128],
  ["notebook-walk", 2, 128],
  ["field-records", 2, 128],
]) {
  const name = `lico-${kind}-ponytail-v1`;
  const source = `assets/source/storybook/${name}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height, { count: rows * 4, columns: 4, rows });
  if (parts.length !== rows * 4) throw Error(`Incomplete atlas: ${name}`);
  const scale = standingHeight / parts[0].height;
  const layers = [],
    metrics = [];
  for (const [frame, p] of parts.entries()) {
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
    if (!count) throw Error(`Missing sandals: ${name}/${frame}`);
    const left = Math.round(96 - (sum / count - p.left) * scale),
      top = 176 - height;
    if (left < 2 || left + width > 190 || top < 4) throw Error(`Clipped pose: ${name}/${frame}`);
    const input = await sharp(source).extract(p).resize(width, height).png().toBuffer();
    layers.push({ input, left: (frame % 4) * 192 + left, top: Math.floor(frame / 4) * 192 + top });
    metrics.push({ frame, scale, width, height, left, top, baseline: 176 });
  }
  await sharp({ create: { width: 768, height: rows * 192, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  await writeFile(`public/storybook-study/${name}-metrics.json`, JSON.stringify(metrics, null, 2));
  console.log(
    name,
    metrics.map((p) => p.height),
  );
}
