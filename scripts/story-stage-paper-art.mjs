import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

export async function paperPoses(root, name, raw, image) {
  if (!["aria", "leon", "mira", "finn", "lico"].some((id) => name === `${id}-poses`))
    return { raw, image };
  const original = await sharp(image).ensureAlpha().raw().toBuffer();
  const layers = [];
  if (name === "lico-poses") {
    const source = await readFile(new URL("assets/source/story-stage/lico-paper-v2.png", root));
    raw = Buffer.concat([raw, source]);
    const size = await sharp(source).metadata();
    const base = await readFrame(image, { left: 0, top: 0, width: 128, height: 128 });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    for (let i = 0; i < 4; i++) {
      const left = Math.round((i * size.width) / 4);
      const frame = await readFrame(source, {
        left,
        top: 0,
        width: Math.round(((i + 1) * size.width) / 4) - left,
        height: size.height,
      });
      const pose = await registerHeroPose(frame, head.width, 96);
      layers.push({ input: pose.input, left: i * 128 + pose.left, top: pose.top });
    }
  } else {
    layers.push({
      input: await sharp(image)
        .extract({ left: 0, top: 0, width: 512, height: 128 })
        .png()
        .toBuffer(),
      left: 0,
      top: 0,
    });
  }
  const row = await sharp({
    create: { width: 512, height: 128, channels: 4, background: "#00000000" },
  })
    .composite(layers)
    .raw()
    .toBuffer();
  return {
    raw,
    image: await sharp(Buffer.concat([original, row]), {
      raw: { width: 512, height: 2688, channels: 4 },
    })
      .webp({ lossless: true })
      .toBuffer(),
  };
}
