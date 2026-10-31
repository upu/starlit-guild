import sharp from "sharp";
const source = "assets/source/storybook/foundation-roots-v1.png";
await sharp(source)
  .trim({ background: "#00000000", threshold: 12 })
  .resize({ width: 256 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/foundation-roots-v1.webp");
