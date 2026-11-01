import sharp from "sharp";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/brekka-medical-cart-v1.png";
const reference = "public/storybook-study/loaded-cart-v1.webp";
const input = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const original = await sharp(reference).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const largest = ({ data, info }) =>
  spriteBounds(data, info.width, info.height).sort((a, b) => b.area - a.area)[0];
const from = largest(input),
  to = largest(original);
const pixels = await sharp(source)
  .extract({ left: from.left, top: from.top, width: from.width, height: from.height })
  .resize(to.width, to.height, { fit: "contain", position: "bottom", background: "#00000000" })
  .png()
  .toBuffer();
await sharp({
  create: {
    width: original.info.width,
    height: original.info.height,
    channels: 4,
    background: "#00000000",
  },
})
  .composite([{ input: pixels, left: to.left, top: to.top }])
  .webp({ lossless: true })
  .toFile("public/storybook-study/brekka-medical-cart-v1.webp");
