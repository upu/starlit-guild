import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/aria-forest-sample-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const bounds = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
const scale = 134 / bounds[0].height;
const layers = [],
  metrics = [];
for (const [frame, part] of bounds.entries()) {
  let feet = 0,
    count = 0;
  for (let y = part.top + Math.floor(part.height * 0.9); y < part.top + part.height; y++)
    for (let x = part.left; x < part.left + part.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        feet += x;
        count++;
      }
  if (!count) throw Error(`Missing foot in frame ${frame}`);
  const width = Math.round(part.width * scale),
    height = Math.round(part.height * scale);
  const left = Math.round(96 - (feet / count - part.left) * scale),
    top = 176 - height;
  if (left < 3 || left + width > 189 || top < 3) throw Error(`Clipped frame ${frame}`);
  layers.push({
    input: await sharp(source).extract(part).resize(width, height).png().toBuffer(),
    left: frame * 192 + left,
    top,
  });
  metrics.push({ frame, left, top, width, height, scale, baseline: 176 });
}
await sharp({ create: { width: 768, height: 192, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/aria-forest-sample-v1.webp");
await writeFile(
  "public/storybook-study/aria-forest-sample-v1-metrics.json",
  JSON.stringify(metrics, null, 2) + "\n",
);
await sharp("assets/source/storybook/moss-jar-open-v1.png")
  .resize(160, 200, { fit: "contain", background: "#00000000" })
  .webp({ lossless: true })
  .toFile("public/storybook-study/moss-jar-open-v1.webp");
