import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

async function read(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bounds = spriteBounds(data, info.width, info.height, { count: 1, rows: 1, columns: 1 })[0];
  let left = info.width,
    right = 0;
  for (let y = bounds.top; y < bounds.top + bounds.height * 0.28; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
  return { bounds, head: (left + right) / 2, headWidth: right - left + 1 };
}

const atlas = "public/storybook-study/aria-poses-v1.webp";
const originalCell = (frame) =>
  sharp(atlas)
    .extract({ left: (frame % 4) * 192, top: Math.floor(frame / 4) * 192, width: 192, height: 192 })
    .png()
    .toBuffer();
const reference = await read(await originalCell(0));
const contact = "assets/source/storybook/aria-contact-a-v2.png";
const scale = 134 / (await read(contact)).bounds.height;
const frames = [
  { input: "assets/source/storybook/aria-contact-a-v3.png", scale },
  { input: await originalCell(4), scale: 1 },
  { input: await originalCell(1), scale: 1 },
  { input: "assets/source/storybook/aria-pass-b-v2.png", scale },
];
const layers = [],
  metrics = [];
for (const [index, frame] of frames.entries()) {
  const { bounds, head, headWidth } = await read(frame.input);
  const { left, top, width, height } = bounds;
  const w = Math.round(width * frame.scale),
    h = Math.round(height * frame.scale);
  const x = Math.round(reference.head - (head - left) * frame.scale);
  if (x < 0 || x + w > 192 || h > 172) throw Error(`Walking pose exceeds cell: ${index}`);
  const input = await sharp(frame.input)
    .extract({ left, top, width, height })
    .resize(w, h)
    .png()
    .toBuffer();
  layers.push({ input, left: index * 192 + x, top: 176 - h });
  metrics.push({
    frame: index,
    scale: frame.scale,
    height: h,
    headWidth: headWidth * frame.scale,
    baseline: 176,
  });
}
await sharp({ create: { width: 768, height: 192, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/aria-walk-v1.webp");
await writeFile(
  "public/storybook-study/aria-walk-metrics.json",
  JSON.stringify({ referenceHeadWidth: reference.headWidth, frames: metrics }, null, 2),
);
