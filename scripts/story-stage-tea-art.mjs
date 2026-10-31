import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { spriteBounds } from "./home-pixel-frames.mjs";

export async function teaPreparationAssets(root, emit) {
  const source = (name) => readFile(new URL(`assets/source/story-stage/${name}-v1.png`, root));
  const rock = await source("tea-rock");
  await emit(
    "prop-tea-rock",
    rock,
    await sharp(rock)
      .extract(await spriteBounds(rock))
      .resize({ width: 256 })
      .webp({ lossless: true })
      .toBuffer(),
  );
  const closed = await source("medicine-closed");
  const open = await readFile(new URL("public/story-stage/prop-medicine.webp", root));
  const size = await sharp(open).metadata();
  await emit(
    "prop-medicine-closed",
    Buffer.concat([closed, open]),
    await aligned(closed, size.width, size.height),
  );
  const tea = await source("tea-preparation");
  const cuts = [0, 856, 1720, 2172];
  const { height } = await sharp(tea).metadata();
  for (const [i, name] of ["teapot", "teapot-open", "empty-cup"].entries()) {
    const cell = await sharp(tea)
      .extract({ left: cuts[i], top: 0, width: cuts[i + 1] - cuts[i], height })
      .png()
      .toBuffer();
    // Equal pot canvases keep the body and base fixed when the lid changes.
    const image =
      i < 2
        ? await aligned(cell, 256, 202)
        : await sharp(cell)
            .extract(await spriteBounds(cell))
            .resize({ width: 192 })
            .webp({ lossless: true })
            .toBuffer();
    await emit(`prop-${name}`, tea, image);
  }
}

async function aligned(raw, width, height) {
  const trimmed = await sharp(raw)
    .extract(await spriteBounds(raw))
    .resize({ width })
    .png()
    .toBuffer();
  return sharp({ create: { width, height, channels: 4, background: "#00000000" } })
    .composite([{ input: trimmed, gravity: "south" }])
    .webp({ lossless: true })
    .toBuffer();
}
