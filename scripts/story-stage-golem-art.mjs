import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, spriteBounds } from "./home-pixel-frames.mjs";

export async function golemClothAssets(root, emit) {
  const raw = await readFile(new URL("assets/source/story-stage/dragging-cloth-v2.png", root));
  const size = await sharp(raw).metadata();
  for (const [i, name] of ["packing-cloth", "dragging-cloth"].entries()) {
    const frame = await readFrame(raw, {
      left: (i * size.width) / 2,
      top: 0,
      width: size.width / 2,
      height: size.height,
    });
    const cloth = await sharp(frame.cell)
      .extract(frame.box)
      .resize({ width: 256 })
      .png()
      .toBuffer();
    const image = await sharp({
      create: { width: 256, height: 144, channels: 4, background: "#00000000" },
    })
      .composite([{ input: cloth, gravity: "south" }])
      .webp({ lossless: true })
      .toBuffer();
    await emit(`prop-${name}`, raw, image);
  }
  const wrap = await readFile(new URL("assets/source/story-stage/wrist-bandage-v1.png", root));
  await emit(
    "prop-wrist-bandage",
    wrap,
    await sharp(wrap)
      .extract(await spriteBounds(wrap))
      .resize({ width: 128 })
      .webp({ lossless: true })
      .toBuffer(),
  );
}
