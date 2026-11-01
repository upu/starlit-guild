import sharp from "sharp";
const source = "assets/source/storybook/rest-rocks-v1.png";
const { width, height } = await sharp(source).metadata();
const cell = Math.floor(width / 2);
for (const [index, name] of ["seat-rock", "tea-rock"].entries()) {
  const crop = await sharp(source)
    .extract({ left: index * cell, top: 0, width: cell, height })
    .png()
    .toBuffer();
  await sharp(crop)
    .trim()
    .resize(256, 197, { fit: "contain", position: "bottom", background: "#00000000" })
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}-v1.webp`);
}
