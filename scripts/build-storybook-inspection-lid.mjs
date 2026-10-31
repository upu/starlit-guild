import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const root = "assets/source/storybook/";
const out = "public/storybook-study/";
const background = "drain-inspection-bare-v1";
const meta = await sharp(`${root}${background}.png`).metadata();
if (meta.width !== 1536 || meta.height !== 1024) throw Error("Keep the approved camera");
await sharp(`${root}${background}.png`)
  .png({ compressionLevel: 9 })
  .toFile(`${out}${background}.png`);
const name = "inspection-stone-lid-v1";
const raw = await sharp(`${root}${name}.png`)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const [rect] = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 1,
  columns: 1,
  rows: 1,
});
const width = 200,
  height = Math.round((rect.height * width) / rect.width);
await sharp(`${root}${name}.png`)
  .extract(rect)
  .resize(width, height, { kernel: "nearest" })
  .webp({ lossless: true })
  .toFile(`${out}${name}.webp`);
await writeFile(
  `${out}${name}-metrics.json`,
  JSON.stringify({ rect, width, height, aspectRatio: width / height }, null, 2) + "\n",
);
console.log({ rect, width, height });
