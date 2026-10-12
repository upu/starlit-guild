import { RPG_CAMERA_SCALE } from "./rpg-camera.ts";

// Share the elevated ground plane between figures, effects and pointer hit testing.
export const roadScale = (width: number, stage = "forest") =>
  RPG_CAMERA_SCALE * Math.min(1.1, width / (stage === "puppets" ? 800 : 560));
export const roadHeroSize = (width: number, height: number) =>
  RPG_CAMERA_SCALE * Math.min(90, width * 0.18, height * 0.34);
export const roadY = (lane: number, height: number) =>
  height * 0.62 + (lane - 0.68) * Math.min(240, height * 0.65) * RPG_CAMERA_SCALE;
export const roadX = (x: number, camera: number, width: number, stage = "forest") =>
  width * (stage === "puppets" ? 0.2 : 0.35) + (x - camera) * roadScale(width, stage);

// Painted scenes are not tileable. Pan within one oversized image, never wrap its edges.
export function roadBackdrop(
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number,
  progress: number,
) {
  // A portrait viewport must not magnify a house several times relative to the
  // actors. Keep the playable view near 3:2; a dim surround fills the spare height.
  const scale = Math.max((width * 1.15) / imageWidth, Math.min(height, width * 0.8) / imageHeight);
  const w = imageWidth * scale,
    h = imageHeight * scale;
  return {
    width: w,
    height: h,
    x: -(w - width) * Math.max(0, Math.min(1, progress)),
    y: h >= height ? (height - h) / 2 : height * 0.62 - h * 0.7,
  };
}
