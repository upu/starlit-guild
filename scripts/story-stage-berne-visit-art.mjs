import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame } from "./home-pixel-frames.mjs";

export async function berneVisitAssets(root, emit) {
  for (const name of ["berne-paving", "berne-porch"]) {
    const raw = await readFile(new URL(`assets/source/story-stage/${name}-v1.png`, root));
    await emit(name, raw, await sharp(raw).resize(960).webp({ lossless: true }).toBuffer());
  }
  const raw = await readFile(new URL("assets/source/story-stage/berne-meal-props-v1.png", root));
  const { width, height } = await sharp(raw).metadata();
  const names = [
    "bread-roll",
    "bread-half",
    "medicine-packet",
    "lap-napkin",
    "old-wrapper",
    "serving-tray",
  ];
  for (const [i, name] of names.entries()) {
    const frame = await readFrame(raw, {
      left: ((i % 3) * width) / 3,
      top: (Math.floor(i / 3) * height) / 2,
      width: width / 3,
      height: height / 2,
    });
    const image = await sharp(frame.cell)
      .extract(frame.box)
      .resize(256, 256, { fit: "contain", background: "#00000000", position: "bottom" })
      .webp({ lossless: true })
      .toBuffer();
    await emit(`prop-${name}`, raw, image);
  }
}
