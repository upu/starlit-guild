import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds, rowCuts } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

export async function doctorBagPoses(root, name, raw, image) {
  if (name !== "doctor-poses") return { raw, image };
  const source = await readFile(new URL("assets/source/story-stage/doctor-bag-v1.png", root));
  const size = await sharp(source).metadata();
  const cuts = await rowCuts(source, 2);
  const base = await readFrame(image, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
  const layers = [];
  for (let i = 0; i < 4; i++) {
    const left = Math.round(((i % 2) * size.width) / 2),
      top = cuts[Math.floor(i / 2)];
    const frame = await readFrame(source, {
      left,
      top,
      width: Math.round((((i % 2) + 1) * size.width) / 2) - left,
      height: cuts[Math.floor(i / 2) + 1] - top,
    });
    const pose = await registerHeroPose(frame, head.width, 96);
    layers.push({ input: pose.input, left: i * 128 + pose.left, top: pose.top });
  }
  const row = await sharp({
    create: { width: 512, height: 128, channels: 4, background: "#00000000" },
  })
    .composite(layers)
    .raw()
    .toBuffer();
  const original = await sharp(image).ensureAlpha().raw().toBuffer();
  return {
    raw: Buffer.concat([raw, source]),
    image: await sharp(Buffer.concat([original, row]), {
      raw: { width: 512, height: 384, channels: 4 },
    })
      .webp({ lossless: true })
      .toBuffer(),
  };
}
