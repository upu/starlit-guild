import sharp from "sharp";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

// Keep the original transparent canvas and ground baseline used by the cart routes.
for (const name of ["loaded-cart", "return-cart"]) {
  const original = await sharp(`public/story-stage/${name}.webp`)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const source = `assets/source/storybook/${name}-v1.png`;
  const generated = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bounds = ({ data, info }) =>
    spriteBounds(data, info.width, info.height).sort((a, b) => b.area - a.area)[0];
  const target = bounds(original),
    input = bounds(generated);
  const pixels = await sharp(source)
    .extract({ left: input.left, top: input.top, width: input.width, height: input.height })
    .resize(target.width, target.height, {
      fit: "contain",
      position: "bottom",
      background: "#00000000",
    })
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
    .composite([{ input: pixels, left: target.left, top: target.top }])
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}-v1.webp`);
}
