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

export async function registerWorkPose(frame, headWidth, standingHeight) {
  const crop = await sharp(frame.cell).extract(frame.box).png().toBuffer();
  const head = await headBounds(crop, 0.25);
  const scale = headWidth / head.width;
  let width = Math.round(frame.box.width * scale);
  const height = standingHeight ?? Math.round(frame.box.height * scale);
  let resized = await sharp(crop).resize(width, height).png().toBuffer();
  let bounds = await spriteBounds(resized);
  let deliveredHead = await headBounds(await sharp(resized).extract(bounds).png().toBuffer(), 0.25);
  // Resampling and a changed standing aspect can change the measured hair edge.
  // Correct the delivered head width, rather than trusting the source rectangle.
  if (standingHeight && Math.abs(deliveredHead.width - headWidth) > 1) {
    width = Math.round((width * headWidth) / deliveredHead.width);
    resized = await sharp(crop).resize(width, height).png().toBuffer();
    bounds = await spriteBounds(resized);
    deliveredHead = await headBounds(await sharp(resized).extract(bounds).png().toBuffer(), 0.25);
  }
  const left = Math.round(64 - bounds.left - deliveredHead.left - deliveredHead.width / 2);
  const top = 120 - bounds.top - bounds.height;
  if (left < 2 || top < 2 || left + width > 126 || top + height > 126)
    throw Error("Work pose exceeds padded cell");
  return { input: resized, left, top };
}
