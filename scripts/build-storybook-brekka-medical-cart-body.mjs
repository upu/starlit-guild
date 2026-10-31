import sharp from "sharp";

// Match the original 420 x 280 cart canvas, handle grips and wheel baseline.
await sharp("assets/source/storybook/brekka-medical-cart-body-v1.png")
  .resize(420, 280, { fit: "fill" })
  .webp({ lossless: true })
  .toFile("public/storybook-study/brekka-medical-cart-body-v1.webp");
