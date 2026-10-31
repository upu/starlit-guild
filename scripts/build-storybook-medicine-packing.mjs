import sharp from "sharp";
import { copyFile, writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";
for (const [name, sourceName] of [
  ["aria-table-packing-v1", "aria-table-packing-v1"],
  ["packing-merchant-v1", "merchant-service-v1"],
  ["aria-packing-turn-v1", "aria-packing-turn-v1"],
  ["leon-packing-turn-v1", "leon-packing-turn-v1"],
]) {
  const source = `assets/source/storybook/${sourceName}.png`;
  const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const boxes = spriteBounds(raw.data, raw.info.width, raw.info.height, {
    count: 4,
    columns: 4,
    rows: 1,
  });
  if (boxes.length !== 4) throw Error("Missing packing pose");
  const scale = 134 / boxes[0].height,
    layers = [],
    metrics = [];
  for (const [frame, bounds] of boxes.entries()) {
    let sum = 0,
      count = 0;
    for (let y = bounds.top + Math.floor(bounds.height * 0.9); y < bounds.top + bounds.height; y++)
      for (let x = bounds.left; x < bounds.left + bounds.width; x++)
        if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    const width = Math.round(bounds.width * scale),
      height = Math.round(bounds.height * scale),
      left = Math.round(96 - (sum / count - bounds.left) * scale),
      top = 176 - height;
    if (!count || left < 3 || left + width > 253 || top < 4) throw Error(`Clipped ${frame}`);
    layers.push({
      input: await sharp(source).extract(bounds).resize(width, height).png().toBuffer(),
      left: frame * 256 + left,
      top,
    });
    metrics.push({ frame, width, height, left, top, scale, baseline: 176 });
  }
  await sharp({ create: { width: 1024, height: 192, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  await writeFile(
    `public/storybook-study/${name}-metrics.json`,
    JSON.stringify(metrics, null, 2) + "\n",
  );
  console.log(name, metrics);
}
await copyFile(
  "assets/source/storybook/medicine-shop-yard-v1.png",
  "public/storybook-study/medicine-shop-yard-v1.png",
);
// Identical lower pixels mask a parcel as it passes through the open bag's mouth.
const bagFile = "public/storybook-study/honey-bag-open-v1.webp";
const bag = await sharp(bagFile).metadata();
await sharp(bagFile)
  .extract({ left: 0, top: 110, width: bag.width, height: bag.height - 110 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/packing-bag-front-v1.webp");
