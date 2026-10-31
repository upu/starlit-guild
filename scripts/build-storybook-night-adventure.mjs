import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

async function pack(source, cellWidth, targetHeight, frameOffset = 0) {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
  const calibration =
    frameOffset === 4 ? parts.reduce((n, p) => n + p.height, 0) / 4 : parts[0].height;
  const scale = targetHeight / calibration,
    layers = [],
    metrics = [];
  for (const [index, p] of parts.entries()) {
    let sum = 0,
      count = 0;
    for (let y = p.top + Math.floor(p.height * 0.92); y < p.top + p.height; y++)
      for (let x = p.left; x < p.left + p.width; x++)
        if (data[(y * info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    if (!count) throw Error("Missing foot");
    const width = Math.round(p.width * scale),
      height = Math.round(p.height * scale),
      left = Math.round(96 - (sum / count - p.left) * scale),
      top = 176 - height,
      frame = frameOffset + index;
    if (left < 3 || left + width > cellWidth - 3 || top < 3)
      throw Error(`Clipped ${source}/${index}`);
    layers.push({
      input: await sharp(source).extract(p).resize(width, height).png().toBuffer(),
      left: (index % 4) * cellWidth + left,
      top: Math.floor(frame / 4) * 192 + top,
    });
    metrics.push({ frame, source, scale, left, top, width, height, baseline: 176 });
  }
  return { layers, metrics };
}
const action = await pack("assets/source/storybook/aria-night-hand-v2.png", 192, 134),
  walk = await pack("assets/source/storybook/aria-night-walk-v2.png", 192, 134, 4),
  battle = await pack("assets/source/storybook/aria-night-battle-v1.png", 256, 134);
for (const [name, width, height, groups] of [
  ["aria-night-handheld-v1", 768, 384, [action, walk]],
  ["aria-night-battle-v1", 1024, 192, [battle]],
]) {
  await sharp({ create: { width, height, channels: 4, background: "#00000000" } })
    .composite(groups.flatMap((g) => g.layers))
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  await writeFile(
    `public/storybook-study/${name}-metrics.json`,
    JSON.stringify(
      groups.flatMap((g) => g.metrics),
      null,
      2,
    ) + "\n",
  );
}
await sharp("assets/source/storybook/night-lantern-v1.png")
  .trim()
  .resize({ height: 248 })
  .extend({ top: 4, bottom: 4, left: 4, right: 4, background: "#00000000" })
  .webp({ lossless: true })
  .toFile("public/storybook-study/night-lantern-v1.webp");
console.log("Night shawl hand/walk/battle and travel lantern packed.");
