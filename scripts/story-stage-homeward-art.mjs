import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { spriteBounds } from "./home-pixel-frames.mjs";

export async function reviewWorkerHat(root, name, raw, image) {
  if (name !== "worker-poses") return { raw, image };
  const source = await readFile(new URL("assets/source/story-stage/worker-hat-v1.png", root));
  // The raised hat is not the head. Register the hair span (624..944) and
  // body (crown y=274, soles y=956) separately; keep the hat inside the cell.
  const pose = await sharp(source)
    .extract({ left: 491, top: 190, width: 453, height: 766 })
    .resize(74, 108, { fit: "fill" })
    .png()
    .toBuffer();
  const original = await sharp(image).ensureAlpha().raw().toBuffer();
  const row = await sharp({
    create: { width: 512, height: 128, channels: 4, background: "#00000000" },
  })
    .composite([{ input: pose, left: 16, top: 12 }])
    .raw()
    .toBuffer();
  return {
    raw: Buffer.concat([raw, source]),
    image: await sharp(Buffer.concat([original, row]), {
      raw: { width: 512, height: 512, channels: 4 },
    })
      .webp({ lossless: true })
      .toBuffer(),
  };
}

export async function homewardProps(root, emit) {
  const raw = await readFile(new URL("assets/source/story-stage/empty-bottles-v1.png", root));
  const image = await sharp(raw)
    .extract(await spriteBounds(raw))
    .resize(256, 256, { fit: "contain", background: "#00000000", position: "bottom" })
    .webp({ lossless: true })
    .toBuffer();
  await emit("prop-empty-bottles", raw, image);
}
