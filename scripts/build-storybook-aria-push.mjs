import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

async function measure(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const part = spriteBounds(data, info.width, info.height, { count: 1, columns: 1, rows: 1 })[0];
  let left = info.width,
    right = 0;
  for (let y = part.top; y < part.top + part.height * 0.28; y++)
    for (let x = part.left; x < part.left + part.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
  return { part, head: (left + right) / 2, headWidth: right - left + 1 };
}

const layers = [],
  metrics = [];
for (let frame = 0; frame < 4; frame++) {
  const source = `assets/source/storybook/aria-push-${frame}-${frame === 2 ? "v3" : "v2"}.png`;
  const reference = await sharp("public/storybook-study/aria-walk-v1.webp")
    .extract({ left: frame * 192, top: 0, width: 192, height: 192 })
    .png()
    .toBuffer();
  const target = await measure(reference),
    pose = await measure(source);
  // Independently generated canvases are registered to the corresponding walk phase.
  const scale = target.part.height / pose.part.height;
  const { left, top, width, height } = pose.part;
  const w = Math.round(width * scale),
    h = Math.round(height * scale);
  const x = Math.round(target.head - (pose.head - left) * scale);
  if (x < 0 || x + w > 192 || h > 176) throw Error(`Push frame exceeds cell: ${frame}`);
  const input = await sharp(source)
    .extract({ left, top, width, height })
    .resize(w, h)
    .png()
    .toBuffer();
  layers.push({ input, left: frame * 192 + x, top: 176 - h });
  metrics.push({
    frame,
    scale,
    height: h,
    headWidth: pose.headWidth * scale,
    referenceHeadWidth: target.headWidth,
    left: x,
    baseline: 176,
  });
}
await sharp({ create: { width: 768, height: 192, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/aria-push-v3.webp");
await writeFile("public/storybook-study/aria-push-metrics.json", JSON.stringify(metrics, null, 2));
