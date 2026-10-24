import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame } from "./home-pixel-frames.mjs";
import { registerWorkPose } from "./story-stage-pose-frames.mjs";

export async function bridgeFrames(root, id, head) {
  if (id !== "finn" && id !== "mira") return null;
  const name = id === "finn" ? "finn-parcel-pat-v1" : "mira-river-look-v1";
  const raw = await readFile(new URL(`assets/source/story-stage/${name}.png`, root));
  const { width, height } = await sharp(raw).metadata();
  const indices = id === "finn" ? [32, 33] : [17];
  const frames = [];
  for (let i = 0; i < indices.length; i++) {
    const left = Math.floor((i * width) / indices.length);
    const w = Math.floor(((i + 1) * width) / indices.length) - left;
    const frame = await readFrame(raw, { left, top: 0, width: w, height });
    if (
      frame.box.left <= 0 ||
      frame.box.left + frame.box.width >= w ||
      frame.box.top <= 0 ||
      frame.box.top + frame.box.height >= height
    )
      throw new Error(`${name} touches its source crop boundary`);
    frames.push({ index: indices[i], pose: await registerWorkPose(frame, head, 96) });
  }
  return { raw, frames };
}

export async function bridgeProps(root, emit) {
  const raw = await readFile(new URL("assets/source/story-stage/empty-garden-pot-v1.png", root));
  const { width, height } = await sharp(raw).metadata();
  const frame = await readFrame(raw, { left: 0, top: 0, width, height });
  // Match the clay vessel inside the existing 256px flower-filled pot cell.
  const pot = await sharp(frame.cell)
    .extract(frame.box)
    .resize(186, 160, { fit: "fill" })
    .png()
    .toBuffer();
  const image = await sharp({
    create: { width: 256, height: 256, channels: 4, background: "#00000000" },
  })
    .composite([{ input: pot, left: 35, top: 96 }])
    .webp({ lossless: true })
    .toBuffer();
  await emit("prop-empty-garden-pot", raw, image);
}
