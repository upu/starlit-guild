import sharp from "sharp";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/forest-props-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 4, columns: 4, rows: 1 });
const names = ["sample-bowl", "moss-bowl", "moss-colony", "folded-shawl"];
for (const [i, part] of parts.entries()) {
  const { left, top, width, height } = part;
  await sharp(source)
    .extract({ left, top, width, height })
    .resize(256, 197, { fit: "contain", position: "bottom", background: "#00000000" })
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${names[i]}-v1.webp`);
}
