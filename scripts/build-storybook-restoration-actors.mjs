import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

for (const spec of [
  { name: "keeper-restoration-v1", cell: 128, sole: 120, standing: 94, walk: [4, 5, 6, 7] },
  { name: "restoration-carrier-v1", cell: 128, sole: 120, standing: 94, walk: [1, 2, 3, 4] },
]) {
  const source = `assets/source/storybook/${spec.name}.png`;
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(data, info.width, info.height);
  if (parts.length !== 8) throw Error(`Expected eight poses: ${spec.name}`);
  const scale = spec.standing / parts[0].height;
  const layers = [],
    metrics = [];
  for (const [index, part] of parts.entries()) {
    let sum = 0,
      count = 0;
    const band = spec.walk.includes(index) ? 0.7 : 0.85;
    for (let y = part.top + Math.floor(part.height * band); y < part.top + part.height; y++) {
      for (let x = part.left; x < part.left + part.width; x++) {
        if (data[(y * info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
      }
    }
    const width = Math.round(part.width * scale),
      height = Math.round(part.height * scale);
    const left = Math.round(spec.cell / 2 - (sum / count - part.left) * scale);
    if (left < 0 || left + width > spec.cell || height > spec.sole)
      throw Error(`Clipped: ${spec.name}/${index}`);
    const input = await sharp(source)
      .extract({ left: part.left, top: part.top, width: part.width, height: part.height })
      .resize(width, height)
      .png()
      .toBuffer();
    layers.push({
      input,
      left: (index % 4) * spec.cell + left,
      top: Math.floor(index / 4) * spec.cell + spec.sole - height,
    });
    metrics.push({ width, height, left, top: spec.sole - height, scale });
  }
  await sharp({
    create: { width: spec.cell * 4, height: spec.cell * 2, channels: 4, background: "#00000000" },
  })
    .composite(layers)
    .webp({ lossless: true })
    .toFile(`public/storybook-study/${spec.name}.webp`);
  await writeFile(
    `public/storybook-study/${spec.name}-metrics.json`,
    JSON.stringify(metrics, null, 2),
  );
}
