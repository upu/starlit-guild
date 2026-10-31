import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { spriteBounds } from "./storybook-sprite-bounds.mjs";

// Keep one scale for each complete atlas; hair width never controls body size.
sharp.cache(false);
const record = JSON.parse(
  await readFile("docs/art-generation/storybook-lico-slim-hair-20261027.json", "utf8"),
);
for (const { name, source } of record.accepted) {
  const output = `public/storybook-study/lico-${name}.webp`;
  const original = await sharp(output).metadata();
  const rows = original.height / 192;
  const cellWidth = original.width / 4;
  const raw = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const parts = spriteBounds(raw.data, raw.info.width, raw.info.height, {
    count: 4 * rows,
    columns: 4,
    rows,
  });
  if (parts.length !== 4 * rows) throw Error(`Incomplete atlas: ${name}`);
  const standingHeight = name.startsWith("walk") ? 125 : 128;
  const scale = standingHeight / parts[0].height;
  const layers = [],
    metrics = [];
  for (const [frame, bounds] of parts.entries()) {
    let sum = 0,
      count = 0;
    for (let y = bounds.top + Math.floor(bounds.height * 0.9); y < bounds.top + bounds.height; y++)
      for (let x = bounds.left; x < bounds.left + bounds.width; x++)
        if (raw.data[(y * raw.info.width + x) * 4 + 3] > 128) {
          sum += x;
          count++;
        }
    if (!count) throw Error(`Missing feet: ${name}/${frame}`);
    const width = Math.round(bounds.width * scale),
      height = Math.round(bounds.height * scale);
    const left = Math.round(96 - (sum / count - bounds.left) * scale),
      top = 176 - height;
    if (left < 3 || left + width > cellWidth - 3 || top < 4)
      throw Error(`Clipped: ${name}/${frame}`);
    layers.push({
      input: await sharp(source).extract(bounds).resize(width, height).png().toBuffer(),
      left: (frame % 4) * cellWidth + left,
      top: Math.floor(frame / 4) * 192 + top,
    });
    metrics.push({ frame, scale, width, height, left, top, baseline: 176 });
  }
  await writeFile(
    output,
    await sharp({
      create: {
        width: original.width,
        height: original.height,
        channels: 4,
        background: "#00000000",
      },
    })
      .composite(layers)
      .webp({ lossless: true })
      .toBuffer(),
  );
  await writeFile(
    output.replace(".webp", "-metrics.json"),
    JSON.stringify(metrics, null, 2) + "\n",
  );
  console.log(
    name,
    metrics.map(({ height }) => height),
  );
}
