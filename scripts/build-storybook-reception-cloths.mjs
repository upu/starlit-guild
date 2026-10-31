import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/reception-cloths-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
if (parts.length !== 4) throw Error("Expected four survey props");
const names = ["spare-cloth-folded", "spare-cloth-spread", "spare-cloth-draped", "return-marker"];
const metrics = [];
for (const [index, part] of parts.entries()) {
  const scale = Math.min(240 / part.width, 236 / part.height);
  const width = Math.round(part.width * scale),
    height = Math.round(part.height * scale);
  const input = await sharp(source)
    .extract({ left: part.left, top: part.top, width: part.width, height: part.height })
    .resize(width, height)
    .png()
    .toBuffer();
  const left = Math.round((256 - width) / 2),
    top = 248 - height;
  await sharp({ create: { width: 256, height: 256, channels: 4, background: "#00000000" } })
    .composite([{ input, left, top }])
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${names[index]}-v1.webp`);
  metrics.push({ name: names[index], width, height, left, top });
}
await writeFile(
  "public/storybook-study/reception-cloths-v1-metrics.json",
  JSON.stringify(metrics, null, 2),
);
