import sharp from "sharp";

// Reuse the approved pixels without scaling: keep one image decoded throughout placement.
const frames = [
  ["leon-carry-v1", 1],
  ["leon-forage-v1", 1],
  ["leon-forage-v1", 1],
  ["leon-conversation-v1", 1],
];
const pixels = Buffer.alloc(768 * 192 * 4);
for (const [index, [name, frame]] of frames.entries()) {
  const cell = await sharp(`public/storybook-study/${name}.webp`)
    .extract({ left: frame * 192, top: 0, width: 192, height: 192 })
    .ensureAlpha()
    .raw()
    .toBuffer();
  for (let row = 0; row < 192; row++)
    cell.copy(pixels, (row * 768 + index * 192) * 4, row * 192 * 4, (row + 1) * 192 * 4);
}
await sharp(pixels, { raw: { width: 768, height: 192, channels: 4 } })
  .webp({ lossless: true })
  .toFile("public/storybook-study/leon-basket-place-v1.webp");
