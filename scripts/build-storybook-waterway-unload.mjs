import sharp from "sharp";
import { copyFile, writeFile } from "node:fs/promises";
const root = "public/storybook-study/";
await copyFile("public/story-stage/prop-rope-coil.webp", root + "repair-rope-coil-v1.webp");
const ref = await sharp(root + "waterway-tool-cart-v1.webp")
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const raw = await sharp("assets/source/storybook/waterway-empty-tool-cart-v1.png")
  .resize(420, 280)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
function foot(image) {
  let last = 0;
  for (let y = 150; y < 280; y++)
    for (let x = 20; x < 190; x++) if (image.data[(y * 420 + x) * 4 + 3] >= 200) last = y;
  return last;
}
const dy = foot(ref) - foot(raw);
if (dy < 0 || dy > 12) throw new Error("Cart wheel registration drifts too far");
await sharp({ create: { width: 420, height: 280, channels: 4, background: "#00000000" } })
  .composite([
    {
      input: await sharp(raw.data, { raw: raw.info }).png().toBuffer(),
      left: 0,
      top: Math.max(0, dy),
    },
  ])
  .webp({ lossless: true })
  .toFile(root + "waterway-empty-tool-cart-v1.webp");
const poses = [
  ["merchant-turn-carry-v2", 0],
  ["merchant-placement-v2", 1],
  ["merchant-turn-carry-v2", 2],
  ["merchant-turn-carry-v2", 3],
  ["merchant-placement-v2", 2],
  ["merchant-placement-v2", 3],
  ["merchant-placement-v2", 0],
  ["merchant-placement-v2", 0],
];
const pixels = Buffer.alloc(512 * 256 * 4);
for (const [index, [name, frame]] of poses.entries()) {
  const cell = await sharp(root + name + ".webp")
    .extract({ left: frame * 128, top: 0, width: 128, height: 128 })
    .ensureAlpha()
    .raw()
    .toBuffer();
  for (let row = 0; row < 128; row++)
    cell.copy(
      pixels,
      ((Math.floor(index / 4) * 128 + row) * 512 + (index % 4) * 128) * 4,
      row * 128 * 4,
      (row + 1) * 128 * 4,
    );
}
await sharp(pixels, { raw: { width: 512, height: 256, channels: 4 } })
  .webp({ lossless: true })
  .toFile(root + "merchant-repair-unload-v1.webp");
await writeFile(
  root + "waterway-empty-tool-cart-v1-metrics.json",
  JSON.stringify(
    {
      width: 420,
      height: 280,
      referenceWheelBottom: foot(ref),
      generatedWheelBottom: foot(raw),
      shiftY: dy,
      poses,
    },
    null,
    2,
  ) + "\n",
);
console.log({ wheelBottom: foot(ref), dy, poses: poses.length });
