import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/well-props-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 3, columns: 3, rows: 1 });
if (parts.length !== 3) throw Error("Expected three well props");
const metrics = [];
for (const [i, part] of parts.entries()) {
  const scale = Math.min(240 / part.width, 236 / part.height),
    width = Math.round(part.width * scale),
    height = Math.round(part.height * scale);
  const input = await sharp(source)
    .extract({ left: part.left, top: part.top, width: part.width, height: part.height })
    .resize(width, height)
    .png()
    .toBuffer();
  const name = ["snag-rope", "iron-fastener", "garden-map"][i];
  await sharp({ create: { width: 256, height: 256, channels: 4, background: "#00000000" } })
    .composite([{ input, left: Math.round((256 - width) / 2), top: 248 - height }])
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}-v1.webp`);
  metrics.push({ name, width, height });
}
await writeFile(
  "public/storybook-study/well-props-v1-metrics.json",
  JSON.stringify(metrics, null, 2),
);
const cart = await sharp("assets/source/storybook/garden-handcart-v2.png")
  .trim({ threshold: 16 })
  .resize(496, 296, { fit: "inside" })
  .png()
  .toBuffer();
const { width, height } = await sharp(cart).metadata();
await sharp({ create: { width: 512, height: 320, channels: 4, background: "#00000000" } })
  .composite([{ input: cart, left: Math.round((512 - width) / 2), top: 308 - height }])
  .webp({ lossless: true })
  .toFile("public/storybook-study/garden-handcart-v2.webp");
