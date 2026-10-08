import { adventureHeroArt } from "./adventure-hero-art.ts";
import { isolateSprite } from "./sprite-silhouette.ts";

// Same texture-pixel pitch as the heroes, independent of screen/DPR density.
export function enemySampleSize(width: number, height: number, heroHeight: number) {
  const h = Math.max(1, Math.round((height * adventureHeroArt.height) / heroHeight));
  return { width: Math.max(1, Math.round((width * h) / height)), height: h };
}

export type PixelRect = { x: number; y: number; width: number; height: number };
export function samplePixelFrame(
  source: CanvasImageSource,
  rect: PixelRect,
  size: { width: number; height: number },
  isolate = false,
) {
  let image = source,
    crop = rect;
  if (isolate) {
    const native = drawSample(image, crop, { width: crop.width, height: crop.height });
    isolateSprite(native);
    image = native;
    crop = { x: 0, y: 0, width: native.width, height: native.height };
  }
  while (crop.width > size.width * 2 || crop.height > size.height * 2) {
    const next = drawSample(image, crop, {
      width: Math.ceil(crop.width / 2),
      height: Math.ceil(crop.height / 2),
    });
    image = next;
    crop = { x: 0, y: 0, width: next.width, height: next.height };
  }
  return drawSample(image, crop, size);
}

function drawSample(
  source: CanvasImageSource,
  crop: PixelRect,
  size: { width: number; height: number },
) {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw Error("ドット絵の縮小処理を準備できませんでした。");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(source, crop.x, crop.y, crop.width, crop.height, 0, 0, size.width, size.height);
  return canvas;
}
