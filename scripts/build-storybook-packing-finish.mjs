import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";
const records = [];
async function parts(source, count, rows) {
  const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const boxes = spriteBounds(raw.data, raw.info.width, raw.info.height, {
    count,
    columns: 4,
    rows,
  });
  if (boxes.length !== count) throw Error(`Missing frames ${source}`);
  return boxes;
}
async function pack(source, box, scale, name) {
  const width = Math.round(box.width * scale),
    height = Math.round(box.height * scale),
    left = Math.round((256 - width) / 2),
    top = 248 - height;
  if (left < 2 || top < 2) throw Error(`Clipped ${name}`);
  await sharp({ create: { width: 256, height: 256, channels: 4, background: "#00000000" } })
    .composite([
      { input: await sharp(source).extract(box).resize(width, height).png().toBuffer(), left, top },
    ])
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  records.push({ name, width, height, left, top, scale, baseline: 248 });
}
const wrap = "assets/source/storybook/packing-wrap-cycle-v1.png",
  boxes = await parts(wrap, 8, 2),
  scale = 192 / Math.max(boxes[0].width, boxes[4].width);
for (const [index, box] of boxes.entries())
  await pack(wrap, box, scale, `packing-wrap-${index < 4 ? "medicine" : "honey"}-${index % 4}-v1`);
const bag = "assets/source/storybook/packing-bag-close-v1.png",
  lids = await parts(bag, 4, 1),
  bagScale = 250 / Math.max(...lids.map((b) => b.width));
for (const [index, box] of lids.entries())
  await pack(bag, box, bagScale, `packing-bag-close-${index}-v1`);
const open = "public/storybook-study/packing-bag-close-0-v1.webp";
await sharp(open)
  .extract({ left: 0, top: 124, width: 256, height: 132 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/packing-bag-lip-v2.webp");
await writeFile(
  "public/storybook-study/packing-finish-metrics.json",
  JSON.stringify(records, null, 2) + "\n",
);
console.log(records);
