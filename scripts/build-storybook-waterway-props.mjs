import sharp from "sharp";

const source = "assets/source/storybook/waterway-props-v1.png";
const { width, height } = await sharp(source).metadata();
const cell = Math.floor(width / 2);
// Tools are deliberately disconnected; retain every object inside the authored cell.
for (let i = 0; i < 2; i++) {
  const crop = await sharp(source)
    .extract({ left: i * cell, top: 0, width: cell, height })
    .png()
    .toBuffer();
  await sharp(crop)
    .trim()
    .resize(256, 197, { fit: "contain", position: "bottom", background: "#00000000" })
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${i === 0 ? "tools" : "basket"}-v1.webp`);
}
