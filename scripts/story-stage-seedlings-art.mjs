import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds, spriteBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

export async function seedlingsPoses(root, name, raw, image) {
  if (name !== "merrill-poses") return { raw, image };
  const source = await readFile(
    new URL("assets/source/story-stage/merrill-seedlings-v2.png", root),
  );
  const metadata = await sharp(source).metadata();
  const base = await readFrame(image, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
  const original = await sharp(image).ensureAlpha().raw().toBuffer();
  const layers = [];
  for (let i = 0; i < 8; i++) {
    const col = i % 4,
      row = Math.floor(i / 4);
    const frame = await readFrame(source, {
      left: (col * metadata.width) / 4,
      top: (row * metadata.height) / 2,
      width: metadata.width / 4,
      height: metadata.height / 2,
    });
    const pose = await registerHeroPose(frame, head.width, i === 0 || i === 6 ? 68 : 96);
    layers.push({
      input: pose.input,
      left: col * 128 + pose.left,
      top: row * 128 + pose.top,
    });
  }
  const rows = await sharp({
    create: { width: 512, height: 256, channels: 4, background: "#00000000" },
  })
    .composite(layers)
    .raw()
    .toBuffer();
  return {
    raw: Buffer.concat([raw, source]),
    image: await sharp(Buffer.concat([original, rows]), {
      raw: { width: 512, height: 384, channels: 4 },
    })
      .webp({ lossless: true })
      .toBuffer(),
  };
}

export async function seedlingsProps(root, emit) {
  const source = await readFile(new URL("public/adventure-enemies/mushroom.webp", root));
  const image = await sharp(source)
    .extract(await spriteBounds(source))
    .resize(128, 128, { fit: "contain", background: "#00000000" })
    .webp({ lossless: true })
    .toBuffer();
  await emit("prop-korotake", source, image);
  const pot = await readFile(new URL("assets/source/story-stage/merrill-pot-v1.png", root));
  await emit(
    "prop-merrill-pot",
    pot,
    await sharp(pot)
      .extract(await spriteBounds(pot))
      .resize(256, 192, { fit: "contain", background: "#00000000" })
      .webp({ lossless: true })
      .toBuffer(),
  );
}
