import sharp from "sharp";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const [id, width, height] of [
  ["packing-table-v1", 384, 201],
  ["delivery-box-v1", 256, 122],
  ["delivery-box-v2", 256, 122],
  ["covered-box-v1", 256, 122],
  ["chair-v1", 144, 208],
  ["office-table-v1", 384, 128],
  ["office-table-v2", 384, 167],
  ["moss-jar-v1", 160, 200],
]) {
  if (process.argv[2] && process.argv[2] !== id) continue;
  const source = `assets/source/storybook/${id}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const part = spriteBounds(data, info.width, info.height).sort((a, b) => b.area - a.area)[0];
  const { left, top, width: w, height: h } = part;
  await sharp(source)
    .extract({ left, top, width: w, height: h })
    .resize(width, height, { fit: "contain", position: "bottom", background: "#00000000" })
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${id}.webp`);
}
