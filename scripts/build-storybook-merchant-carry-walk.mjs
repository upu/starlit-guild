import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

function headBounds(data, stride, part) {
  let left = stride;
  let right = 0;
  for (let y = part.top; y < part.top + part.height * 0.28; y++)
    for (let x = part.left; x < part.left + part.width; x++)
      if (data[(y * stride + x) * 4 + 3] > 128) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
  if (right < left) throw Error("Missing head");
  return { center: (left + right) / 2, width: right - left + 1 };
}

const source = "assets/source/storybook/merchant-carry-walk-v1.png";
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 4,
  columns: 4,
  rows: 1,
});
if (parts.length !== 4) throw Error("Expected four carrying steps");
const reference = await sharp("public/storybook-study/merchant-turn-carry-v2.webp")
  .extract({ left: 384, top: 0, width: 128, height: 128 })
  .ensureAlpha()
  .raw()
  .toBuffer();
const referencePart = spriteBounds(reference, 128, 128, { count: 1, rows: 1, columns: 1 })[0];
const head = headBounds(reference, 128, referencePart);
const scale = head.width / headBounds(raw.data, raw.info.width, parts[0]).width;
const layers = [];
const metrics = [];
for (const [frame, part] of parts.entries()) {
  const currentHead = headBounds(raw.data, raw.info.width, part);
  const width = Math.round(part.width * scale);
  const height = Math.round(part.height * scale);
  const left = Math.round(head.center - (currentHead.center - part.left) * scale);
  if (left < 1 || left + width >= 127 || height > 116)
    throw Error(`Carrying step ${frame} exceeds the padded cell`);
  layers.push({
    input: await sharp(source)
      .extract({ left: part.left, top: part.top, width: part.width, height: part.height })
      .resize(width, height)
      .png()
      .toBuffer(),
    left: frame * 128 + left,
    top: 120 - height,
  });
  metrics.push({ frame, width, height, left, baseline: 120, headWidth: currentHead.width * scale });
}
await sharp({ create: { width: 512, height: 128, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/merchant-carry-walk-v1.webp");
await writeFile(
  "public/storybook-study/merchant-carry-walk-v1-metrics.json",
  JSON.stringify({ referenceHeadWidth: head.width, scale, frames: metrics }, null, 2),
);
