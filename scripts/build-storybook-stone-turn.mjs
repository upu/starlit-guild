import sharp from "sharp";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

const source = "assets/source/storybook/tower-stone-side-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const [part] = spriteBounds(data, info.width, info.height, { count: 1, columns: 1, rows: 1 });
if (!part) throw Error("Missing stone side");
const width = 240,
  height = Math.round((part.height * width) / part.width);
if (height > 260) throw Error("Unexpected stone proportions");
const image = await sharp(source).extract(part).resize(width, height).png().toBuffer();
await sharp({ create: { width: 256, height: 320, channels: 4, background: "#00000000" } })
  .composite([{ input: image, left: 8, top: 312 - height }])
  .webp({ lossless: true })
  .toFile("public/storybook-study/tower-stone-side-v1.webp");
