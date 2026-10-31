import sharp from "sharp";
import { writeFile } from "node:fs/promises";

const source = "assets/source/storybook/road-effects-v2.png";
const meta = await sharp(source).metadata();
const layers = [],
  metrics = [];
for (let frame = 0; frame < 4; frame++) {
  const left = Math.round((frame * meta.width) / 4),
    right = Math.round(((frame + 1) * meta.width) / 4);
  // Keep disconnected glints in their authored cell; component detection would
  // discard their smaller separate stars and leaf flecks.
  const cell = await sharp(source)
    .extract({ left, top: 0, width: right - left, height: meta.height })
    .png()
    .toBuffer();
  const trimmed = await sharp(cell).trim({ threshold: 1 }).png().toBuffer();
  const size = [192, 166, 116, 108][frame];
  const { data, info } = await sharp(trimmed)
    .resize({ width: size, height: size, fit: "inside" })
    .png()
    .toBuffer({ resolveWithObject: true });
  layers.push({
    input: data,
    left: frame * 256 + Math.round((256 - info.width) / 2),
    top: Math.round((256 - info.height) / 2),
  });
  metrics.push({ frame, width: info.width, height: info.height, cell: 256 });
}
await sharp({ create: { width: 1024, height: 256, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/road-effects-v1.webp");
await writeFile(
  "public/storybook-study/road-effects-v1-metrics.json",
  JSON.stringify(metrics, null, 2),
);
