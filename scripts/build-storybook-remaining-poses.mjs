import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

async function sourceParts(name, columns, rows) {
  const file = `assets/source/storybook/${name}.png`;
  const raw = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
    count: columns * rows,
    columns,
    rows,
  });
  if (parts.length !== columns * rows) throw Error(`Missing poses: ${name}`);
  return { file, raw, parts };
}

function footCenter(raw, bounds) {
  let sum = 0,
    count = 0;
  for (let y = bounds.top + Math.floor(bounds.height * 0.9); y < bounds.top + bounds.height; y++)
    for (let x = bounds.left; x < bounds.left + bounds.width; x++)
      if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
        sum += x - bounds.left;
        count++;
      }
  if (!count) throw Error("Missing ground contact");
  return sum / count;
}

async function registeredPose(source, index, scale) {
  const bounds = source.parts[index],
    width = Math.round(bounds.width * scale),
    height = Math.round(bounds.height * scale),
    left = Math.round(96 - footCenter(source.raw, bounds) * scale),
    top = 176 - height;
  if (left < 3 || left + width > 189 || top < 3) throw Error(`Clipped ${source.file}:${index}`);
  return {
    image: await sharp(source.file).extract(bounds).resize(width, height).png().toBuffer(),
    metrics: {
      source: source.file,
      sourceFrame: index,
      scale,
      width,
      height,
      left,
      top,
      baseline: 176,
    },
  };
}

async function fixedPose(file, frame) {
  return {
    image: await sharp(file)
      .extract({ left: frame * 192, top: 0, width: 192, height: 192 })
      .png()
      .toBuffer(),
    metrics: {
      source: file,
      sourceFrame: frame,
      scale: 1,
      width: 192,
      height: 192,
      left: 0,
      top: 0,
      baseline: 176,
      pixelExact: true,
    },
  };
}

async function saveStrip(name, frames) {
  const output = `public/storybook-study/${name}.webp`;
  // Copy registered pixels directly; alpha compositing rounds translucent edges.
  const width = frames.length * 192;
  const pixels = Buffer.alloc(width * 192 * 4);
  for (const [index, frame] of frames.entries()) {
    const raw = await sharp(frame.image).ensureAlpha().raw().toBuffer();
    const m = frame.metrics;
    for (let y = 0; y < m.height; y++)
      pixels.set(
        raw.subarray(y * m.width * 4, (y + 1) * m.width * 4),
        ((m.top + y) * width + index * 192 + m.left) * 4,
      );
  }
  await sharp(pixels, { raw: { width, height: 192, channels: 4 } })
    .webp({ lossless: true })
    .toFile(output);
  const sha256 = createHash("sha256")
    .update(await readFile(output))
    .digest("hex");
  await writeFile(
    `public/storybook-study/${name}-metrics.json`,
    JSON.stringify({ sha256, frames: frames.map((f) => f.metrics) }, null, 2) + "\n",
  );
  console.log(
    name,
    frames.map((f) => f.metrics.height),
    sha256,
  );
}

const bed = await sourceParts("mira-bed-v2", 3, 2),
  bedScale = 126 / bed.parts[0].height;
await saveStrip("mira-bed-v2", [
  await fixedPose("public/storybook-study/mira-conversation-v1.webp", 0),
  await registeredPose(bed, 1, bedScale),
  await fixedPose("public/storybook-study/mira-seat-v3.webp", 1),
  await registeredPose(bed, 3, bedScale),
  await registeredPose(bed, 4, bedScale),
]);
const shoulder = await sourceParts("aria-shoulder-v1", 4, 1),
  shoulderScale = 134 / shoulder.parts[0].height;
await saveStrip(
  "aria-shoulder-v1",
  await Promise.all([0, 1, 2, 3].map((i) => registeredPose(shoulder, i, shoulderScale))),
);
// The generator put the standing reference in source cell 2, after the two pushes.
const push = await sourceParts("leon-push-v1", 4, 1),
  pushScale = 144 / push.parts[2].height;
await saveStrip(
  "leon-push-v1",
  await Promise.all([2, 0, 1, 3].map((i) => registeredPose(push, i, pushScale))),
);
