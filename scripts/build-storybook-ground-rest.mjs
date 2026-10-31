import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const metrics = {};
const sheets = [
  {
    source: "assets/source/storybook/ground-rest-v1.png",
    height: 767,
    characters: [
      ["aria", 134],
      ["leon", 144],
    ],
  },
  {
    source: "assets/source/storybook/ground-rest-mira-finn-v1.png",
    characters: [
      ["mira", 126],
      ["finn", 148],
    ],
  },
];
for (const sheet of sheets) {
  const source = sheet.source;
  let image = sharp(source);
  if (sheet.height) image = image.extract({ left: 0, top: 0, width: 1085, height: sheet.height });
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height, { count: 6, columns: 3, rows: 2 });
  if (parts.length !== 6) throw Error("Expected six separate ground-rest poses per accepted sheet");
  for (const [row, [id, standing]] of sheet.characters.entries()) {
    const poses = parts.slice(row * 3, row * 3 + 3);
    const scale = standing / poses[0].height;
    const layers = [];
    metrics[id] = [];
    for (const [index, pose] of poses.entries()) {
      let sum = 0,
        count = 0;
      for (let y = pose.top + Math.floor(pose.height * 0.85); y < pose.top + pose.height; y++) {
        for (let x = pose.left; x < pose.left + pose.width; x++) {
          if (data[(y * info.width + x) * 4 + 3] > 128) {
            sum += x;
            count++;
          }
        }
      }
      const width = Math.round(pose.width * scale),
        height = Math.round(pose.height * scale);
      const left = Math.round(96 - (sum / count - pose.left) * scale);
      if (left < 0 || left + width > 192 || height > 176)
        throw Error(`Ground pose clipped: ${id}/${index}`);
      const input = await sharp(source)
        .extract({ left: pose.left, top: pose.top, width: pose.width, height: pose.height })
        .resize(width, height)
        .png()
        .toBuffer();
      layers.push({ input, left: index * 192 + left, top: 176 - height });
      metrics[id].push({ scale, width, height, left, top: 176 - height });
    }
    await sharp({ create: { width: 576, height: 192, channels: 4, background: "#00000000" } })
      .composite(layers)
      .webp({ lossless: true })
      .toFile(`public/storybook-study/${id}-ground-rest-v1.webp`);
  }
}
await writeFile(
  "public/storybook-study/ground-rest-metrics.json",
  JSON.stringify(metrics, null, 2),
);
