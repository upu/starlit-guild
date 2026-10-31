import sharp from "sharp";

// Keep the original 512x288 canvas and handles aligned with the existing grips.
await sharp("assets/source/storybook/seedling-cart-body-v2.png")
  .resize(512, 288, { fit: "fill" })
  .webp({ lossless: true })
  .toFile("public/storybook-study/seedling-cart-body-v2.webp");
