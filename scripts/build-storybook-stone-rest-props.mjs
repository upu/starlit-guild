import sharp from "sharp";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/stone-rest-props-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
if (parts.length !== 4) throw Error("Expected four stone rest props");
const names = ["covered-stone", "brazier", "heavy-cloth", "medicine-packet"];
for (const [index, part] of parts.entries()) {
  const canvasHeight = index % 2 ? 260 : 320;
  const scale = Math.min((index === 0 ? 236 : 224) / part.width, (canvasHeight - 24) / part.height);
  const width = Math.round(part.width * scale),
    height = Math.round(part.height * scale);
  const input = await sharp(source)
    .extract({ left: part.left, top: part.top, width: part.width, height: part.height })
    .resize(width, height)
    .png()
    .toBuffer();
  await sharp({
    create: { width: 256, height: canvasHeight, channels: 4, background: "#00000000" },
  })
    .composite([{ input, left: Math.round((256 - width) / 2), top: canvasHeight - 12 - height }])
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${names[index]}-v1.webp`);
}
