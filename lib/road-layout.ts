// Share the compact ground plane between figures, effects and pointer hit testing.
export const roadY = (lane: number, height: number) =>
  height * 0.7 + (lane - 0.68) * Math.min(240, height * 0.65);
export const roadX = (x: number, camera: number, width: number, stage = "forest") =>
  width * (stage === "puppets" ? 0.2 : 0.35) +
  (x - camera) * Math.min(1.1, width / (stage === "puppets" ? 600 : 560));

// Painted scenes are not tileable. Pan within one oversized image, never wrap its edges.
export function roadBackdrop(
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number,
  progress: number,
) {
  const scale = Math.max((width * 1.25) / imageWidth, height / imageHeight);
  const w = imageWidth * scale,
    h = imageHeight * scale;
  return {
    width: w,
    height: h,
    x: -(w - width) * Math.max(0, Math.min(1, progress)),
    y: (height - h) / 2,
  };
}
