import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

export async function merchantService(root, name, raw, image) {
  if (name !== "merchant-poses") return { raw, image };
  const source = await readFile(new URL("assets/source/story-stage/merchant-service-v1.png", root));
  const { width, height } = await sharp(source).metadata();
  const ref = await readFrame(image, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(await sharp(ref.cell).extract(ref.box).png().toBuffer(), 0.25);
  const layers = [];
  for (let i = 0; i < 4; i++) {
    const frame = await readFrame(source, {
      left: ((i % 2) * width) / 2,
      top: (Math.floor(i / 2) * height) / 2,
      width: width / 2,
      height: height / 2,
    });
    if (
      frame.box.left <= 0 ||
      frame.box.top <= 0 ||
      frame.box.left + frame.box.width >= width / 2 ||
      frame.box.top + frame.box.height >= height / 2
    )
      throw new Error("Service pose is clipped");
    const pose = await registerHeroPose(frame, head.width, i === 1 ? 92 : 96);
    layers.push({ input: pose.input, left: i * 128 + pose.left, top: pose.top });
  }
  const original = await sharp(image).ensureAlpha().raw().toBuffer();
  const additions = await sharp({
    create: { width: 512, height: 128, channels: 4, background: "#00000000" },
  })
    .composite(layers)
    .raw()
    .toBuffer();
  return {
    raw: Buffer.concat([raw, source]),
    image: await sharp(Buffer.concat([original, additions]), {
      raw: { width: 512, height: 512, channels: 4 },
    })
      .webp({ lossless: true })
      .toBuffer(),
  };
}

export async function lindeProps(root, emit) {
  const raw = await readFile(new URL("assets/source/story-stage/linde-props-v1.png", root));
  const { width, height } = await sharp(raw).metadata();
  for (const [i, name] of ["dining-plate", "lunch-plate", "sealed-letter"].entries()) {
    const frame = await readFrame(raw, { left: (i * width) / 3, top: 0, width: width / 3, height });
    await emit(
      `prop-${name}`,
      raw,
      await sharp(frame.cell).extract(frame.box).resize(256).webp({ lossless: true }).toBuffer(),
    );
  }
}
