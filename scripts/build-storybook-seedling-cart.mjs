import sharp from "sharp";

// Preserve the generated canvas: grip registration includes transparent margins.
await sharp("assets/source/storybook/seedling-cart-v1.png")
  .resize({ width: 512 })
  .webp({ lossless: true })
  .toFile("public/storybook-study/seedling-cart-v1.webp");
