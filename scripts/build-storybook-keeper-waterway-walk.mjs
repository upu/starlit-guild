import sharp from "sharp";

// The existing 256×192 work cells anchor the head around x=96 and feet at y=176.
// A 182px square maps the 134px figure to the 94px standing height, with the
// head around x=64 and feet at y=120 in the 128px conversation cell.
const source = "public/storybook-study/keeper-hatch-walk-v1.webp";
const layers = [];
for (let frame = 0; frame < 4; frame++) {
  layers.push({
    input: await sharp(source)
      .extract({ left: frame * 256 + 5, top: 5, width: 182, height: 182 })
      .resize(128, 128, { kernel: "nearest" })
      .png()
      .toBuffer(),
    left: frame * 128,
    top: 0,
  });
}
await sharp({ create: { width: 512, height: 128, channels: 4, background: "#00000000" } })
  .composite(layers)
  .webp({ lossless: true })
  .toFile("public/storybook-study/keeper-waterway-walk-v1.webp");
