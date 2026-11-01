import sharp from "sharp";

// Use the same canvas and origin as the previous tool cart and its hand grips.
const generated = await sharp("assets/source/storybook/waterway-tool-cart-body-v1.png")
  .resize(420, 280, { fit: "fill" })
  .ensureAlpha()
  .raw()
  .toBuffer();
// Preserve the original shafts and grip points; the generated near shaft was
// shorter than the original even though the cargo remained recognizable.
const shafts = await sharp("public/storybook-study/waterway-tool-cart-v1.webp")
  .ensureAlpha()
  .raw()
  .toBuffer();
for (let y = 0; y < 280; y++) {
  const from = (y * 420 + 310) * 4;
  shafts.copy(generated, from, from, (y + 1) * 420 * 4);
}
await sharp(generated, { raw: { width: 420, height: 280, channels: 4 } })
  .webp({ lossless: true })
  .toFile("public/storybook-study/waterway-tool-cart-body-v1.webp");
