import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const [name, height, cell] of [
  ["lico-walk-ponytail-v2", 125, 192],
  ["finn-pull-v2", 148, 192],
  ["finn-battle-v1", 148, 256],
  ["lico-battle-v1", 128, 256],
]) {
  const sourceName = name === "lico-battle-v1" ? "lico-battle-ponytail-v2" : name;
  const source = `assets/source/storybook/${sourceName}.png`;
  const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
    count: 4,
    columns: 4,
    rows: 1,
  });
  const scale = height / parts[0].height;
  const layers = [],
    metrics = [];
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
      height = Math.round(p.height * scale);
    const left = Math.round(96 - (sum / count - p.left) * scale),
      top = 176 - height;
    if (left < 3 || left + width > cell - 3 || top < 4) throw Error(`Clipped ${name}/${frame}`);
    layers.push({
      input: await sharp(source).extract(p).resize(width, height).png().toBuffer(),
      left: frame * cell + left,
      top,
    });
    metrics.push({ frame, scale, width, height, left, top, baseline: 176 });
  }
  await sharp({ create: { width: cell * 4, height: 192, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  await writeFile(`public/storybook-study/${name}-metrics.json`, JSON.stringify(metrics, null, 2));
}
