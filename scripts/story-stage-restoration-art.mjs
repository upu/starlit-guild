import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

export async function restorationKeeper(root, name, raw, image) {
  if (name !== "keeper-poses") return { raw, image };
  const source = await readFile(
    new URL("assets/source/story-stage/keeper-restoration-v1.png", root),
  );
  const size = await sharp(source).metadata();
  const reference = await readFrame(image, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(
    await sharp(reference.cell).extract(reference.box).png().toBuffer(),
    0.25,
  );
  const layers = [];
  for (let i = 0; i < 8; i++) {
    const left = Math.floor(((i % 4) * size.width) / 4),
      top = Math.floor((Math.floor(i / 4) * size.height) / 2);
    const width = Math.floor((((i % 4) + 1) * size.width) / 4) - left;
    const height = Math.floor(((Math.floor(i / 4) + 1) * size.height) / 2) - top;
    const frame = await readFrame(source, { left, top, width, height });
    if (
      frame.box.left <= 0 ||
      frame.box.top <= 0 ||
      frame.box.left + frame.box.width >= width ||
      frame.box.top + frame.box.height >= height
    )
      throw new Error("Caretaker pose touches its source crop boundary");
    const pose = await registerHeroPose(frame, head.width, i === 4 || i === 5 ? undefined : 96);
    layers.push({
      input: pose.input,
      left: (i % 4) * 128 + pose.left,
      top: Math.floor(i / 4) * 128 + pose.top,
    });
  }
  const original = await sharp(image).ensureAlpha().raw().toBuffer();
  const additions = await sharp({
    create: { width: 512, height: 256, channels: 4, background: "#00000000" },
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

export async function restorationProps(root, emit) {
  const raw = await readFile(new URL("assets/source/story-stage/restoration-props-v1.png", root));
  const { width, height } = await sharp(raw).metadata();
  for (const [i, name] of ["work-fence", "joint-roots"].entries()) {
    const frame = await readFrame(raw, {
      left: Math.floor((i * width) / 2),
      top: 0,
      width: Math.floor(width / 2),
      height,
    });
    const image = await sharp(frame.cell)
      .extract(frame.box)
      .resize({ width: 256, height: 256, fit: "contain", background: "#00000000" })
      .webp({ lossless: true })
      .toBuffer();
    await emit(`prop-${name}`, raw, image);
  }
}
