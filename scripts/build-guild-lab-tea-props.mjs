import sharp from "sharp";
for (const [name, width, height] of [
  ["lab-table-v1", 391, 375],
  ["lab-cookie-plate-v1", 125, 100],
  ["lab-cookie-v1", 72, 64],
]) {
  await sharp(`assets/source/guild/${name}.png`)
    .trim({ threshold: 20 })
    .resize(width, height)
    .webp({ lossless: true })
    .toFile(`public/guild/${name}.webp`);
}
