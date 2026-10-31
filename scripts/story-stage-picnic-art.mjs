import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame } from "./home-pixel-frames.mjs";

export async function picnicAssets(root, emit) {
  const background = await readFile(new URL("assets/source/story-stage/picnic-hill-v1.png", root));
  await emit(
    "picnic-hill",
    background,
    await sharp(background).resize(960).webp({ lossless: true }).toBuffer(),
  );
  const raw = await readFile(new URL("assets/source/story-stage/picnic-props-v1.png", root));
  const size = await sharp(raw).metadata();
  for (const [i, name] of [
    "walnut-cake",
    "honey-cake",
    "travel-flask",
    "flask-cup",
    "twine",
    "cake-parcel",
  ].entries()) {
    const f = await readFrame(raw, {
      left: ((i % 3) * size.width) / 3,
      top: (Math.floor(i / 3) * size.height) / 2,
      width: size.width / 3,
      height: size.height / 2,
    });
    const image = await sharp(f.cell)
      .extract(f.box)
      .resize(256, 256, { fit: "contain", background: "#00000000", position: "bottom" })
      .webp({ lossless: true })
      .toBuffer();
    await emit(`prop-${name}`, raw, image);
  }
}
