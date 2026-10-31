import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const metrics = {};
for (const [id, row, targetHeight] of [
  ["aria", 0, 134],
  ["leon", 1, 144],
  ["mira", 0, 126],
]) {
  const source = `assets/source/storybook/${id === "mira" ? "mira-perch" : "perch-trio"}-v1.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height, {
    count: id === "mira" ? 4 : 12,
    columns: 4,
    rows: id === "mira" ? 1 : 3,
  }).slice(row * 4, row * 4 + 4);
  const scale = targetHeight / parts[0].height;
  const layers = [];
  metrics[id] = [];
  for (const [index, part] of parts.entries()) {
    const width = Math.round(part.width * scale),
      height = Math.round(part.height * scale);
    let sum = 0,
      count = 0;
    for (let y = part.top + Math.floor(part.height * 0.88); y < part.top + part.height; y++) {
      for (let x = part.left; x < part.left + part.width; x++) {
        if (data[(y * info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
      }
    }
    const left = Math.round(96 - (sum / count - part.left) * scale);
    if (left < 0 || left + width > 192 || height > 176)
      throw Error(`Clipped perch: ${id}/${index}`);
    const input = await sharp(source)
      .extract({ left: part.left, top: part.top, width: part.width, height: part.height })
      .resize(width, height)
      .png()
      .toBuffer();
    layers.push({ input, left: index * 192 + left, top: 176 - height });
    metrics[id].push({ width, height, left, top: 176 - height, scale });
  }
  await sharp({ create: { width: 768, height: 192, channels: 4, background: "#00000000" } })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${id}-perch-v1.webp`);
}
await writeFile("public/storybook-study/perch-metrics.json", JSON.stringify(metrics, null, 2));
