import sharp from "sharp";
const source = "assets/source/guild/room-tiles-v1.png";
const { width, height } = await sharp(source).metadata();
const tiles = [];
for (let row = 0; row < 2; row++)
  for (let col = 0; col < 2; col++) {
    const input = await sharp(source)
      .extract({
        left: (col * width) / 2,
        top: (row * height) / 2,
        width: width / 2,
        height: height / 2,
      })
      .resize(128, 128)
      .extend({ top: 2, bottom: 2, left: 2, right: 2, extendWith: "copy" })
      .png()
      .toBuffer();
    tiles.push({ input, left: col * 132, top: row * 132 });
  }
await sharp({ create: { width: 264, height: 264, channels: 4, background: "#000" } })
  .composite(tiles)
  .webp({ lossless: true })
  .toFile("public/guild/room-tiles-v1.webp");
