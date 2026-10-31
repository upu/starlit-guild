import sharp from "sharp";

// Match the standing creature's 220 px visible width and 248 px foot baseline.
const source = "assets/source/storybook/korotake-rest-v1.png";
const trimmed = await sharp(source)
  .trim()
  .resize({ width: 220 })
  .png()
  .toBuffer({ resolveWithObject: true });
const top = 248 - trimmed.info.height;
if (top < 2 || trimmed.info.height >= 220) throw Error("Unexpected resting mushroom bounds");
await sharp({ create: { width: 256, height: 256, channels: 4, background: "#00000000" } })
  .composite([{ input: trimmed.data, left: 18, top }])
  .webp({ lossless: true })
  .toFile("public/storybook-study/korotake-rest-v1.webp");
console.log({
  width: trimmed.info.width,
  height: trimmed.info.height,
  left: 18,
  top,
  baseline: 248,
});
