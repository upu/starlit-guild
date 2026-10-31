import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const [name, rows] of [
  ["leon-carry-walk-v1", 1],
  ["waterway-worker-handoff-v1", 2],
]) {
  const source = `assets/source/storybook/${name}.png`;
  const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const boxes = spriteBounds(raw.data, raw.info.width, raw.info.height, {
    count: 4 * rows,
    columns: 4,
    rows,
  });
  if (boxes.length !== 4 * rows) throw Error(`Incomplete ${name}`);
  const scale = 134 / boxes[0].height,
    layers = [],
    metrics = [];
  for (const [frame, box] of boxes.entries()) {
    let sum = 0,
      count = 0;
    const kneeling = rows === 2 && [1, 2].includes(frame);
    const startX = box.left + (kneeling ? Math.floor(box.width * 0.55) : 0);
    for (let y = box.top + Math.floor(box.height * 0.9); y < box.top + box.height; y++)
      for (let x = startX; x < box.left + box.width; x++)
        if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    if (!count) throw Error(`No boots ${name}/${frame}`);
    const width = Math.round(box.width * scale),
      height = Math.round(box.height * scale);
    const left = Math.round(96 - (sum / count - box.left) * scale),
      top = 176 - height;
    if (left < 3 || left + width > 253 || top < 4) throw Error(`Clipped ${name}/${frame}`);
    layers.push({
      input: await sharp(source).extract(box).resize(width, height).png().toBuffer(),
      left: (frame % 4) * 256 + left,
      top: Math.floor(frame / 4) * 192 + top,
    });
    metrics.push({ frame, width, height, left, top, scale, baseline: 176 });
  }
  await sharp({ create: { width: 1024, height: 192 * rows, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  await writeFile(
    `public/storybook-study/${name}-metrics.json`,
    JSON.stringify(metrics, null, 2) + "\n",
  );
}
for (const name of ["waterway-repair-stone-v1", "waterway-basket-filled-v1"])
  await sharp(`assets/source/storybook/${name}.png`)
    .trim()
    .resize({ width: 256 })
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
console.log("Waterway handoff sprites registered with common scale and full silhouettes.");
