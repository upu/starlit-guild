import sharp from "sharp";
const source = "assets/source/storybook/signposts-v1.png";
const { width, height } = await sharp(source).metadata();
const cell = Math.floor(width / 2);
for (const [index, name] of ["signpost", "signpost-portable"].entries()) {
  const crop = await sharp(source)
    .extract({ left: index * cell, top: 0, width: cell, height })
    .png()
    .toBuffer();
  const trimmed = await sharp(crop).trim().png().toBuffer();
  const meta = await sharp(trimmed).metadata();
  const w = 240,
    h = Math.round((meta.height * w) / meta.width);
  if (h > 320) throw Error(`Signpost clipped: ${name}`);
  const input = await sharp(trimmed).resize(w, h).png().toBuffer();
  await sharp({ create: { width: 256, height: 320, channels: 4, background: "#00000000" } })
    .composite([{ input, left: 8, top: 320 - h }])
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}-v1.webp`);
}
