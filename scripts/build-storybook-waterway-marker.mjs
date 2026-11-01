import sharp from "sharp";

// Keep the isolated drawing and place its lowest visible pixels at the cell base.
const source = "assets/source/storybook/waterway-marker-v1.png";
const image = await sharp(source)
  .trim({ background: "#00000000", threshold: 20 })
  .resize(240, 240, { fit: "inside", kernel: "lanczos3" })
  .png()
  .toBuffer({ resolveWithObject: true });
await sharp({ create: { width: 256, height: 256, channels: 4, background: "#00000000" } })
  .composite([
    {
      input: image.data,
      left: Math.floor((256 - image.info.width) / 2),
      top: 256 - image.info.height,
    },
  ])
  .webp({ lossless: true })
  .toFile("public/storybook-study/waterway-marker-v1.webp");
