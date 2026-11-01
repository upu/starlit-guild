import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { readFrame } from "./home-pixel-frames.mjs";
import { registerWorkPose } from "./story-stage-pose-frames.mjs";

async function stripFrames(raw, count, cuts) {
  const { width, height } = await sharp(raw).metadata();
  return Promise.all(
    Array.from({ length: count }, (_, i) => {
      const left = Math.floor((cuts?.[i] ?? i / count) * width);
      return readFrame(raw, {
        left,
        top: 0,
        width: Math.floor((cuts?.[i + 1] ?? (i + 1) / count) * width) - left,
        height,
      });
    }),
  );
}

export async function injuredHandFrames(root, head) {
  const raw = await readFile(new URL("assets/source/story-stage/finn-injured-hand-v1.png", root));
  // The catching fingertips extend a little beyond the first nominal quarter.
  // Slice through the actual transparent gutter, not through those fingertips.
  const frames = await stripFrames(raw, 4, [0, 0.28, 0.5, 0.75, 1]);
  for (const frame of frames) {
    const { width, height } = await sharp(frame.cell).metadata();
    const { left, top, width: inkWidth, height: inkHeight } = frame.box;
    if (left <= 0 || top <= 0 || left + inkWidth >= width || top + inkHeight >= height)
      throw new Error("Finn injury pose touches its source crop boundary");
  }
  return {
    raw,
    frames: await Promise.all(frames.map((f, i) => registerWorkPose(f, head, i ? 96 : undefined))),
  };
}

export async function nightHandAssets(root, emit) {
  const raw = await readFile(new URL("assets/source/story-stage/night-hand-props-v1.png", root));
  const frames = await stripFrames(raw, 2);
  for (const [i, name] of ["broken-fastener", "stained-cloth"].entries()) {
    const image = await sharp(frames[i].cell)
      .extract(frames[i].box)
      .resize(256, 256, { fit: "contain", position: "bottom", background: "#00000000" })
      .webp({ lossless: true })
      .toBuffer();
    await emit(`prop-${name}`, raw, image);
  }
}
