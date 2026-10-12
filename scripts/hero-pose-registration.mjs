import sharp from "sharp";
import { headBounds, spriteBounds } from "./home-pixel-frames.mjs";

export async function registerHeroPose(
  frame,
  headWidth,
  standingHeight,
  { cell = 128, foot = 120 } = {},
) {
  const crop = await sharp(frame.cell).extract(frame.box).png().toBuffer();
  const head = await headBounds(crop, 0.25);
  const scale = headWidth / head.width;
  let width = Math.round(frame.box.width * scale);
  const height = standingHeight ?? Math.round(frame.box.height * scale);
  // Both axes are registered explicitly. Sharp's default `cover` would crop
  // crowns and soles when the requested standing height changes the aspect.
  let resized = await sharp(crop).resize(width, height, { fit: "fill" }).png().toBuffer();
  let bounds = await spriteBounds(resized);
  let deliveredHead = await headBounds(await sharp(resized).extract(bounds).png().toBuffer(), 0.25);
  // Resampling and a changed standing aspect can change the measured hair edge.
  // Correct the delivered head width, rather than trusting the source rectangle.
  if (standingHeight && Math.abs(deliveredHead.width - headWidth) > 1) {
    width = Math.round((width * headWidth) / deliveredHead.width);
    resized = await sharp(crop).resize(width, height, { fit: "fill" }).png().toBuffer();
    bounds = await spriteBounds(resized);
    deliveredHead = await headBounds(await sharp(resized).extract(bounds).png().toBuffer(), 0.25);
  }
  const left = Math.round(cell / 2 - bounds.left - deliveredHead.left - deliveredHead.width / 2);
  const top = foot - bounds.top - bounds.height;
  if (left < 2 || top < 2 || left + width > cell - 2 || top + height > cell - 2)
    throw Error("Work pose exceeds padded cell");
  return { input: resized, left, top };
}
