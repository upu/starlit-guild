import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds, rowCuts } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

export async function mossCarePoses(root, name, raw, image) {
  if (!["aria", "leon", "mira", "finn", "lico"].some((id) => name === `${id}-poses`))
    return { raw, image };
  const original = await sharp(image).ensureAlpha().raw().toBuffer();
  let row;
  if (name === "lico-poses") {
    const source = await readFile(new URL("assets/source/story-stage/lico-moss-care-v1.png", root));
    raw = Buffer.concat([raw, source]);
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
      const pose = await registerHeroPose(frame, head.width, i < 2 ? 96 : 64, {
        headFraction: i < 2 ? 0.25 : 0.375,
      });
      layers.push({ input: pose.input, left: i * 128 + pose.left, top: pose.top });
    }
    row = await sharp({ create: { width: 512, height: 128, channels: 4, background: "#00000000" } })
      .composite(layers)
      .raw()
      .toBuffer();
  } else
    row = await sharp(image)
      .extract({ left: 0, top: 0, width: 512, height: 128 })
      .ensureAlpha()
      .raw()
      .toBuffer();
  return {
    raw,
    image: await sharp(Buffer.concat([original, row]), {
      raw: { width: 512, height: 2816, channels: 4 },
    })
      .webp({ lossless: true })
      .toBuffer(),
  };
}
