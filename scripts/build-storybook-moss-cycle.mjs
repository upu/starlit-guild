import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const [name, rows] of [
  ["aria-moss-cycle-v1", 2],
  ["waterway-worker-basket-walk-v1", 1],
]) {
  const source = `assets/source/storybook/${name}.png`;
  const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const boxes = spriteBounds(raw.data, raw.info.width, raw.info.height, {
    count: rows * 4,
    columns: 4,
    rows,
  });
  if (boxes.length !== rows * 4) throw Error(`Missing cells: ${name}`);
  const scale = 134 / boxes[0].height,
    layers = [],
    metrics = [];
  for (const [frame, box] of boxes.entries()) {
    let sum = 0,
      count = 0;
    for (let y = box.top + Math.floor(box.height * 0.9); y < box.top + box.height; y++)
      for (let x = box.left; x < box.left + box.width * (rows === 2 ? 0.65 : 1); x++)
        if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    if (!count) throw Error(`No boot anchor: ${name}/${frame}`);
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
    metrics.push({ frame, left, top, width, height, scale, baseline: 176 });
  }
  await sharp({ create: { width: 1024, height: rows * 192, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  await writeFile(
    `public/storybook-study/${name}-metrics.json`,
    JSON.stringify(metrics, null, 2) + "\n",
  );
}
await sharp("assets/source/storybook/waterway-moss-basket-v1.png")
  .trim()
  .resize({ width: 256 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/waterway-moss-basket-v1.webp");
await sharp("assets/source/storybook/handcart-raised-v1.png")
  .trim()
  .resize({ width: 512 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/waterway-moss-cart-v1.webp");
