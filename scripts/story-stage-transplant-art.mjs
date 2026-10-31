import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { spriteBounds } from "./home-pixel-frames.mjs";

export async function transplantBackground(root, emit) {
  const quill = await readFile(new URL("assets/source/story-stage/quill-v1.png", root));
  await emit(
    "prop-quill",
    quill,
    await sharp(quill)
      .extract(await spriteBounds(quill))
      .resize(130, 100, { fit: "contain", background: "#00000000" })
      .webp({ lossless: true })
      .toBuffer(),
  );
  const tower = await readFile(new URL("assets/source/story-stage/tower-records-v1.png", root));
  await emit(
    "tower-records",
    tower,
    await sharp(tower).resize(960, 640).webp({ lossless: true }).toBuffer(),
  );
  const slime = await readFile(new URL("public/adventure-enemies/slime.webp", root));
  await emit(
    "prop-slime",
    slime,
    await sharp(slime)
      .extract(await spriteBounds(slime))
      .resize(130, 100, { fit: "contain", background: "#00000000" })
      .webp({ lossless: true })
      .toBuffer(),
  );
  const raw = await readFile(new URL("assets/source/story-stage/transplant-path-v1.png", root));
  await emit(
    "transplant-path",
    raw,
    await sharp(raw).resize(960, 640).webp({ lossless: true }).toBuffer(),
  );
  const hoe = await readFile(new URL("assets/source/story-stage/farm-hoe-v1.png", root));
  await emit(
    "prop-farm-hoe",
    hoe,
    await sharp(hoe)
      .extract(await spriteBounds(hoe))
      .resize(48, 240, { fit: "fill", kernel: "nearest" })
      .webp({ lossless: true })
      .toBuffer(),
  );
  const rope = await readFile(new URL("assets/source/story-stage/rope-coil-v1.png", root));
  await emit(
    "prop-rope-coil",
    rope,
    await sharp(rope)
      .extract(await spriteBounds(rope))
      .resize(156, 120, { fit: "contain", background: "#00000000" })
      .webp({ lossless: true })
      .toBuffer(),
  );
}
