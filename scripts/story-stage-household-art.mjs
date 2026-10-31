import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds, spriteBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

export async function reviewParentMotion(root, name, raw, image) {
  if (name !== "parent-poses") return { raw, image };
  const source = await readFile(new URL("assets/source/story-stage/parent-motion-v1.png", root));
  const size = await sharp(source).metadata();
  const reference = await readFrame(image, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(
    await sharp(reference.cell).extract(reference.box).png().toBuffer(),
    0.25,
  );
  const layers = [{ input: reference.cell, left: 0, top: 0 }];
  for (let i = 1; i < 8; i++) {
    const frame = await readFrame(source, {
      left: ((i % 4) * size.width) / 4,
      top: (Math.floor(i / 4) * size.height) / 2,
      width: size.width / 4,
      height: size.height / 2,
    });
    const f = await registerHeroPose(frame, head.width, 96);
    layers.push({
      input: f.input,
      left: (i % 4) * 128 + f.left,
      top: Math.floor(i / 4) * 128 + f.top,
    });
  }
  return {
    raw: Buffer.concat([raw, source]),
    image: await sharp({
      create: { width: 512, height: 256, channels: 4, background: "#00000000" },
    })
      .composite(layers)
      .webp({ lossless: true })
      .toBuffer(),
  };
}

export async function householdProps(root, emit) {
  const raw = await readFile(new URL("assets/source/story-stage/water-bucket-v1.png", root));
  const input = await sharp(raw)
    .extract(await spriteBounds(raw))
    .resize({ width: 192, height: 304, fit: "inside" })
    .png()
    .toBuffer();
  await emit(
    "prop-water-bucket",
    raw,
    await sharp({ create: { width: 192, height: 304, channels: 4, background: "#00000000" } })
      .composite([{ input, gravity: "south" }])
      .webp({ lossless: true })
      .toBuffer(),
  );
}
