import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame, headBounds } from "./home-pixel-frames.mjs";
import { registerHeroPose } from "./hero-pose-registration.mjs";

async function cells(raw, columns) {
  const { width, height } = await sharp(raw).metadata();
  return Promise.all(
    Array.from({ length: columns }, (_, i) => {
      const left = Math.floor((i * width) / columns);
      return readFrame(raw, {
        left,
        top: 0,
        width: Math.floor(((i + 1) * width) / columns) - left,
        height,
      });
    }),
  );
}
export async function surveyCook(root, raw, image) {
  const source = await readFile(new URL("assets/source/story-stage/cook-survey-v1.png", root));
  const reference = await readFrame(image, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(
    await sharp(reference.cell).extract(reference.box).png().toBuffer(),
    0.25,
  );
  const frames = await cells(source, 4),
    layers = [];
  for (const [i, frame] of frames.entries()) {
    const f = await registerHeroPose(frame, head.width, reference.box.height);
    layers.push({ input: f.input, left: i * 128 + f.left, top: f.top });
  }
  const original = await sharp(image).ensureAlpha().raw().toBuffer();
  const added = await sharp({
    create: { width: 512, height: 128, channels: 4, background: "#00000000" },
  })
    .composite(layers)
    .raw()
    .toBuffer();
  return {
    raw: Buffer.concat([raw, source]),
    image: await sharp(Buffer.concat([original, added]), {
      raw: { width: 512, height: 512, channels: 4 },
    })
      .webp({ lossless: true })
      .toBuffer(),
  };
}
export async function surveyAssets(root, emit) {
  for (const [sourceName, names] of [
    ["survey-pot", ["survey-pot", "pot-lid"]],
    ["survey-gear", ["tool-rucksack", "scrubbing-rag"]],
    ["garden-props", ["garden-pot", "work-gloves"]],
  ]) {
    const raw = await readFile(new URL(`assets/source/story-stage/${sourceName}-v1.png`, root));
    const parts = await cells(raw, 2);
    for (const [i, name] of names.entries()) {
      const height = name === "pot-lid" ? 128 : name === "scrubbing-rag" ? 192 : 256;
      const f = parts[i];
      const image = await sharp(f.cell)
        .extract(f.box)
        .resize(256, height, { fit: "contain", position: "bottom", background: "#00000000" })
        .webp({ lossless: true })
        .toBuffer();
      await emit(`prop-${name}`, raw, image);
    }
  }
  const gate = await readFile(new URL("assets/source/story-stage/manor-gate-v1.png", root));
  await emit("manor-gate", gate, await sharp(gate).resize(960).webp({ lossless: true }).toBuffer());
  const paths = await readFile(new URL("assets/source/story-stage/manor-back-paths-v1.png", root));
  await emit(
    "manor-back-paths",
    paths,
    await sharp(paths).resize(960).webp({ lossless: true }).toBuffer(),
  );
}
