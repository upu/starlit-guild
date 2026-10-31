import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const [name, rows, cell] of [
  ["push", 2, 192],
  ["push-v2", 2, 192],
  ["battle", 1, 256],
  ["walk", 1, 192],
]) {
  if (process.argv[2] && process.argv[2] !== name) continue;
  const source = `assets/source/storybook/finn-night-${name === "push-v2" ? "push" : name}-v1.png`;
  const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
    count: 4 * rows,
    columns: 4,
    rows,
  });
  if (parts.length !== 4 * rows) throw Error(`Incomplete Finn ${name} atlas`);
  const scale = 148 / parts[0].height;
  const layers = [],
    metrics = [];
  let firstHead, pushHead;
  for (const [frame, part] of parts.entries()) {
    let sum = 0,
      count = 0;
    for (let y = part.top + Math.floor(part.height * 0.9); y < part.top + part.height; y++)
      for (let x = part.left; x < part.left + part.width; x++)
        if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    if (!count) throw Error(`Missing feet in ${name}/${frame}`);
    // Every pushing pose is standing; the source's two rows were drawn at
    // slightly different sizes. Keep the idle frame and normalize the rest.
    const frameScale = name === "push-v2" && frame > 0 ? 145 / part.height : scale;
    const width = Math.round(part.width * frameScale),
      height = Math.round(part.height * frameScale);
    let headSum = 0,
      headCount = 0;
    for (let y = part.top; y < part.top + Math.floor(part.height * 0.3); y++)
      for (let x = part.left; x < part.left + part.width; x++)
        if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
          headSum += x;
          headCount++;
        }
    if (!headCount) throw Error(`Missing head in ${name}/${frame}`);
    const head = (headSum / headCount - part.left) * frameScale;
    const left = Math.round(
        name === "walk" && frame > 0
          ? firstHead - head
          : name === "push-v2" && frame > 1
            ? pushHead - head
            : 96 - (sum / count - part.left) * frameScale,
      ),
      top = 176 - height;
    if (frame === 0) firstHead = left + head;
    if (name === "push-v2" && frame === 1) pushHead = left + head;
    if (left < 3 || left + width > cell - 3 || top < 4) throw Error(`Clipped ${name}/${frame}`);
    layers.push({
      input: await sharp(source).extract(part).resize(width, height).png().toBuffer(),
      left: (frame % 4) * cell + left,
      top: Math.floor(frame / 4) * 192 + top,
    });
    metrics.push({
      frame,
      scale: frameScale,
      left,
      top,
      width,
      height,
      baseline: 176,
      headX: left + head,
    });
  }
  await sharp({
    create: { width: cell * 4, height: 192 * rows, channels: 4, background: "#00000000" },
  })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(
      `public/storybook-study/finn-night-${name === "push-v2" ? "push-v2" : `${name}-v1`}.webp`,
    );
  await writeFile(
    `public/storybook-study/finn-night-${name === "push-v2" ? "push-v2" : `${name}-v1`}-metrics.json`,
    JSON.stringify(metrics, null, 2) + "\n",
  );
  console.log(
    name,
    metrics.map(({ height }) => height),
  );
}
