import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, spriteBounds } from "./home-pixel-frames.mjs";

export async function walnutAssets(root, emit) {
  const bg = await readFile(new URL("assets/source/story-stage/roadside-rest-v1.png", root));
  await emit("roadside-rest", bg, await sharp(bg).resize(960).webp({ lossless: true }).toBuffer());
  const raw = await readFile(
    new URL("assets/source/story-stage/walnut-tasting-props-v1.png", root),
  );
  const { width, height } = await sharp(raw).metadata();
  const names = [
    "walnut-light",
    "walnut-medium",
    "walnut-dark",
    "walnut-light-half",
    "walnut-medium-half",
    "walnut-dark-half",
    "walnut-underside",
    "walnut-piece",
  ];
  for (const [i, name] of names.entries()) {
    const x = i % 3,
      y = Math.floor(i / 3),
      left = Math.round((x * width) / 3),
      top = Math.round((y * height) / 3);
    const f = await readFrame(raw, {
      left,
      top,
      width: Math.round(((x + 1) * width) / 3) - left,
      height: Math.round(((y + 1) * height) / 3) - top,
    });
    const image = await sharp(f.cell)
      .extract(f.box)
      .resize(256, 256, { fit: "contain", background: "#00000000", position: "bottom" })
      .webp({ lossless: true })
      .toBuffer();
    await emit(`prop-${name}`, raw, image);
  }
  const bench = await readFile(new URL("assets/source/story-stage/roadside-bench-v1.png", root));
  await emit(
    "prop-low-bench",
    bench,
    await sharp(bench)
      .extract(await spriteBounds(bench))
      .resize(384, 128, { fit: "contain", background: "#00000000", position: "bottom" })
      .webp({ lossless: true })
      .toBuffer(),
  );
}
