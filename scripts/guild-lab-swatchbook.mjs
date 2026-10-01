import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { labCharacters } from "../lib/guild-lab-characters.ts";

export async function swatchbook(character, output, asset) {
  const { art } = labCharacters[character];
  const columns = 5,
    cell = 320,
    rows = Math.ceil(art.frames.length / columns);
  const background = Buffer.alloc(columns * cell * rows * cell * 4);
  for (let y = 0; y < rows * cell; y++)
    for (let x = 0; x < columns * cell; x++) {
      const p = (y * columns * cell + x) * 4;
      background.fill(((x >> 4) + (y >> 4)) % 2 ? 220 : 245, p, p + 3);
      background[p + 3] = 255;
    }
  const layers = [];
  for (const [i, [left, top, width, height]] of art.frames.entries()) {
    const image = await sharp(asset ?? `public${art.asset}`)
      .extract({ left, top, width, height })
      .resize(280, 280, { fit: "inside" })
      .png()
      .toBuffer({ resolveWithObject: true });
    const x = (i % columns) * cell,
      y = Math.floor(i / columns) * cell;
    layers.push({
      input: image.data,
      left: x + Math.round((cell - image.info.width) / 2),
      top: y + 30,
    });
    const name = art.master.parts.find((p) => p.frame === i)?.name ?? `frame ${i}`;
    layers.push({
      input: Buffer.from(
        `<svg width="320" height="28"><text x="8" y="22" font-size="18">${i}: ${name}</text></svg>`,
      ),
      left: x,
      top: y,
    });
  }
  await sharp(background, { raw: { width: columns * cell, height: rows * cell, channels: 4 } })
    .composite(layers)
    .png()
    .toFile(output);
}
if (process.argv[1].endsWith("guild-lab-swatchbook.mjs")) {
  const out = process.argv[2] ?? "work/lab-sixteenth-after";
  mkdirSync(out, { recursive: true });
  for (const id of ["leon", "aria"]) await swatchbook(id, `${out}/${id}-parts.png`);
}
