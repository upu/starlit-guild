import sharp from "sharp";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/town-return-props-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 2, columns: 2, rows: 1 });
if (parts.length !== 2) throw Error("Missing return prop");
for (const [i, name] of ["delivery-receipts-v1", "empty-delivery-wrap-v1"].entries())
  await sharp(source)
    .extract(parts[i])
    .resize({ width: 256 })
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
