import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/worker-push-road-v2.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
const scale = 94 / parts[0].height;
const layers = [],
  metrics = [];
let referenceHead;
for (const [frame, p] of parts.entries()) {
  let sx = 0,
    sy = 0,
    count = 0;
  // Alternating boots must not move the torso sideways. Keep one sole planted;
  // the small vertical weight shift does not change the body scale.
  for (let y = p.top; y < p.top + Math.floor(p.height * 0.3); y++)
    for (let x = p.left; x < p.left + p.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        sx += x;
        sy += y;
        count++;
      }
  const head = { x: sx / count - p.left, y: sy / count - p.top };
  referenceHead ??= { x: 54, y: 26 + head.y * scale };
  const width = Math.round(p.width * scale),
    height = Math.round(p.height * scale);
  const left = Math.round(referenceHead.x - head.x * scale),
    top = 120 - height;
  if (left < 2 || left + width > 126 || top < 4 || top + height > 121)
    throw Error(`Clipped push frame ${frame}`);
  layers.push({
    input: await sharp(source).extract(p).resize(width, height).png().toBuffer(),
    left: frame * 128 + left,
    top,
  });
  metrics.push({
    frame,
    scale,
    width,
    height,
    left,
    top,
    baseline: top + height,
    head: { x: referenceHead.x, y: top + head.y * scale },
  });
}
await sharp({ create: { width: 512, height: 128, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/worker-push-road-v1.webp");
await writeFile(
  "public/storybook-study/worker-push-road-v1-metrics.json",
  JSON.stringify(metrics, null, 2),
);
