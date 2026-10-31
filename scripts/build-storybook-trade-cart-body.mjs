import sharp from "sharp";

// Preserve the canvas used by the existing character grips and ground baseline.
for (const name of ["loaded", "return"]) {
  await sharp(`assets/source/storybook/${name}-cart-body-v2.png`)
    .resize(420, 280, { fit: "fill" })
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}-cart-body-v2.webp`);
}
