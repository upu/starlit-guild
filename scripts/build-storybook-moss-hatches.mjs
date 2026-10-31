import sharp from "sharp";
import { copyFile, writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/keeper-hatch-v1.png";
const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const boxes = spriteBounds(raw.data, raw.info.width, raw.info.height, {
  count: 8,
  columns: 4,
  rows: 2,
});
if (boxes.length !== 8) throw Error("Missing keeper pose");
const scale = 134 / boxes[0].height,
  layers = [],
  metrics = [];
for (const [frame, box] of boxes.entries()) {
  let sum = 0,
    count = 0;
  // Only boots: the kneeling keeper's fingertips can be equally low on the left.
  const startX = box.left + (frame === 1 ? box.width * 0.55 : 0);
  for (let y = box.top + Math.floor(box.height * 0.9); y < box.top + box.height; y++)
    for (let x = Math.ceil(startX); x < box.left + box.width; x++)
      if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
        sum += x;
        count++;
      }
  if (!count) throw Error(`No boots: ${frame}`);
  const width = Math.round(box.width * scale),
    height = Math.round(box.height * scale);
  const left = Math.round(96 - (sum / count - box.left) * scale),
    top = 176 - height;
  if (left < 3 || left + width > 253 || top < 4) throw Error(`Clipped keeper ${frame}`);
  layers.push({
    input: await sharp(source).extract(box).resize(width, height).png().toBuffer(),
    left: (frame % 4) * 256 + left,
    top: Math.floor(frame / 4) * 192 + top,
  });
  metrics.push({ frame, width, height, left, top, scale, baseline: 176 });
}
await sharp({ create: { width: 1024, height: 384, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/keeper-hatch-v1.webp");
await writeFile(
  "public/storybook-study/keeper-hatch-v1-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
const parts = "assets/source/storybook/waterway-hatch-parts-v2.png";
const pixels = await sharp(parts).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const bounds = spriteBounds(pixels.data, pixels.info.width, pixels.info.height, {
  count: 2,
  columns: 2,
  rows: 1,
});
if (bounds.length !== 2) throw Error("Missing hatch frame or cover");
for (const [index, name] of ["rim", "lid"].entries())
  await sharp(parts)
    .extract(bounds[index])
    .resize({ width: 512 })
    .webp({ lossless: true })
    .toFile(`public/storybook-study/waterway-hatch-${name}-v1.webp`);
await copyFile(
  "assets/source/storybook/drain-inspection-bank-v1.png",
  "public/storybook-study/drain-inspection-bank-v1.png",
);
for (const walkName of ["keeper-hatch-walk-v1", "aria-moss-walk-v2"]) {
  const walkSource = `assets/source/storybook/${walkName}.png`;
  const walking = await sharp(walkSource).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const steps = spriteBounds(walking.data, walking.info.width, walking.info.height, {
    count: 4,
    columns: 4,
    rows: 1,
  });
  if (steps.length !== 4) throw Error("Missing empty-handed walking pose");
  const walkScale = 134 / steps[0].height,
    walkLayers = [],
    walkMetrics = [];
  for (const [frame, box] of steps.entries()) {
    let sum = 0,
      count = 0;
    for (let y = box.top + Math.floor(box.height * 0.9); y < box.top + box.height; y++)
      for (let x = box.left; x < box.left + box.width; x++)
        if (walking.data[(y * walking.info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    const width = Math.round(box.width * walkScale),
      height = Math.round(box.height * walkScale);
    const left = Math.round(96 - (sum / count - box.left) * walkScale),
      top = 176 - height;
    if (!count || left < 3 || left + width > 253 || top < 4)
      throw Error(`Clipped keeper walk ${frame}`);
    walkMetrics.push({ frame, width, height, left, top, scale: walkScale, baseline: 176 });
    walkLayers.push({
      input: await sharp(walkSource).extract(box).resize(width, height).png().toBuffer(),
      left: frame * 256 + left,
      top,
    });
  }
  await sharp({ create: { width: 1024, height: 192, channels: 4, background: "#00000000" } })
    .composite(walkLayers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${walkName}.webp`);
  await writeFile(
    `public/storybook-study/${walkName}-metrics.json`,
    JSON.stringify(walkMetrics, null, 2) + "\n",
  );
}
