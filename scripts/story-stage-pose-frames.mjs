import sharp from "sharp";
import { readFrame, headBounds, spriteBounds } from "./home-pixel-frames.mjs";

// Work poses keep the walking head scale, rather than stretching a crouch to standing height.
export async function workPoseFrames(id, adventure, home, carry) {
  const base = await readFrame(home, { left: 0, top: 0, width: 128, height: 128 });
  const baseHead = await headBounds(
    await sharp(base.cell).extract(base.box).png().toBuffer(),
    0.25,
  );
  const frames = [];
  for (const index of [22, 23]) {
    const frame = await readFrame(adventure, {
      left: (index % 4) * 192,
      top: Math.floor(index / 4) * 192,
      width: 192,
      height: 192,
    });
    frames.push(await registerWorkPose(frame, baseHead.width));
  }
  const meta = await sharp(carry).metadata();
  for (const col of [0, 1]) {
    const frame = await readFrame(carry, {
      left: col * (meta.width / 2),
      top: (id === "aria" ? 0 : 1) * (meta.height / 2),
      width: meta.width / 2,
      height: meta.height / 2,
    });
    frames.push(await registerWorkPose(frame, baseHead.width));
  }
  return frames;
}

async function registerWorkPose(frame, headWidth) {
  const crop = await sharp(frame.cell).extract(frame.box).png().toBuffer();
  const head = await headBounds(crop, 0.25);
  const scale = headWidth / head.width;
  const width = Math.round(frame.box.width * scale),
    height = Math.round(frame.box.height * scale);
  const resized = await sharp(crop).resize(width, height).png().toBuffer();
  const bounds = await spriteBounds(resized);
  const deliveredHead = await headBounds(
    await sharp(resized).extract(bounds).png().toBuffer(),
    0.25,
  );
  const left = Math.round(64 - bounds.left - deliveredHead.left - deliveredHead.width / 2);
  const top = 120 - bounds.top - bounds.height;
  if (left < 2 || top < 2 || left + width > 126 || top + height > 126)
    throw Error("Work pose exceeds padded cell");
  return { input: resized, left, top };
}
