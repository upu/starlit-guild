import sharp from "sharp";

// Preserve the source canvas, tray and crossbar for the shared grips.
await sharp("assets/source/storybook/founding-cart-body-v1.png")
  .resize(512, 320, { fit: "fill" })
  .webp({ lossless: true })
  .toFile("public/storybook-study/founding-cart-body-v1.webp");
