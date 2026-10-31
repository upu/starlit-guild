import sharp from "sharp";

// Reuse the approved conversation painting. Only pack it to the enemy contract.
const input = await sharp("public/storybook-study/slime-v1.webp")
  .trim({ threshold: 1 })
  .resize({ height: 384 })
  .png()
  .toBuffer();
const { width } = await sharp(input).metadata();
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: "#00000000" } })
  .composite([{ input, left: Math.round((1024 - width) / 2), top: 576 }])
  .webp({ lossless: true })
  .toFile("public/storybook-study/slime-road-v1.webp");
