import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame } from "./home-pixel-frames.mjs";

export async function berneOpeningAssets(root, emit) {
  const background = await readFile(
    new URL("assets/source/story-stage/berne-overlook-v1.png", root),
  );
  await emit(
    "berne-overlook",
    background,
    await sharp(background).resize(960).webp({ lossless: true }).toBuffer(),
  );
  const raw = await readFile(new URL("assets/source/story-stage/shipping-receipt-v1.png", root));
  const { width, height } = await sharp(raw).metadata();
  const frames = await Promise.all(
    [0, 1].map((i) =>
      readFrame(raw, {
        left: (i * width) / 2,
        top: 0,
        width: width / 2,
        height,
      }),
    ),
  );
  // Both sides share the same crop, so turning the sheet cannot resize or shift it.
  const left = Math.min(...frames.map((f) => f.box.left));
  const top = Math.min(...frames.map((f) => f.box.top));
  const box = {
    left,
    top,
    width: Math.max(...frames.map((f) => f.box.left + f.box.width)) - left,
    height: Math.max(...frames.map((f) => f.box.top + f.box.height)) - top,
  };
  for (const [i, name] of ["receipt-front", "receipt-back"].entries()) {
    const image = await sharp(frames[i].cell)
      .extract(box)
      .resize(256, 256, { fit: "contain", background: "#00000000", position: "bottom" })
      .webp({ lossless: true })
      .toBuffer();
    await emit(`prop-${name}`, raw, image);
  }
}
