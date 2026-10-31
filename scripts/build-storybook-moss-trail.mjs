import sharp from "sharp";
import { writeFile, copyFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";
for (const [name, cell, sole, standing, rows] of [
  ["mira-all-nighter-v1", 192, 176, 126, 1],
  ["brekka-cart-driver-v1", 128, 120, 94, 2],
]) {
  const source = `assets/source/storybook/${name}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height, { count: 4 * rows, columns: 4, rows });
  const scale = standing / parts[0].height,
    layers = [],
    metrics = [];
  for (const [i, p] of parts.entries()) {
    const width = Math.round(p.width * scale),
      height = Math.round(p.height * scale);
    let sum = 0,
      count = 0;
    for (let y = p.top + Math.floor(p.height * 0.85); y < p.top + p.height; y++)
      for (let x = p.left; x < p.left + p.width; x++)
        if (data[(y * info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    const left = Math.round(cell / 2 - (sum / count - p.left) * scale),
      top = sole - height;
    if (left < 0 || left + width >= cell || top < 0) throw Error(`Clipped ${name}/${i}`);
    const input = await sharp(source).extract(p).resize(width, height).png().toBuffer();
    layers.push({ input, left: (i % 4) * cell + left, top: Math.floor(i / 4) * cell + top });
    metrics.push({ width, height, left, top, scale });
  }
  await sharp({
    create: { width: cell * 4, height: cell * rows, channels: 4, background: "#00000000" },
  })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${name}.webp`);
  await writeFile(`public/storybook-study/${name}-metrics.json`, JSON.stringify(metrics, null, 2));
}
const source = "assets/source/storybook/brekka-basket-cart-v1.png";
const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const parts = spriteBounds(data, info.width, info.height, { count: 2, columns: 2, rows: 1 });
const cart = parts[0],
  wheel = parts[1],
  scale = 490 / cart.width;
await sharp({ create: { width: 512, height: 384, channels: 4, background: "#00000000" } })
  .composite([
    {
      input: await sharp(source)
        .extract(cart)
        .resize(490, Math.round(cart.height * scale))
        .png()
        .toBuffer(),
      left: 11,
      top: 20,
    },
  ])
  .webp({ lossless: true })
  .toFile("public/storybook-study/brekka-basket-cart-v1.webp");
await sharp(source)
  .extract(wheel)
  .resize(256, 256, { fit: "fill" })
  .webp({ lossless: true })
  .toFile("public/storybook-study/brekka-cart-wheel-v1.webp");
await writeFile(
  "public/storybook-study/brekka-basket-cart-v1-metrics.json",
  JSON.stringify({ cart, wheel, scale, left: 11, top: 20 }, null, 2),
);
for (const name of ["brekka-foyer-v1", "brekka-alley-v1"])
  await copyFile(`assets/source/storybook/${name}.png`, `public/storybook-study/${name}.png`);
const scrap = await sharp("assets/source/storybook/wheel-moss-scrap-v1.png")
  .trim()
  .resize(240, 232, { fit: "inside" })
  .png()
  .toBuffer();
const size = await sharp(scrap).metadata();
await sharp({ create: { width: 256, height: 256, channels: 4, background: "#00000000" } })
  .composite([{ input: scrap, left: Math.round((256 - size.width) / 2), top: 248 - size.height }])
  .webp({ lossless: true })
  .toFile("public/storybook-study/wheel-moss-scrap-v1.webp");
