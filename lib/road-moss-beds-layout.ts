import type { RoadViewport } from "./road-cart-layout.ts";
import { roadDepth, roadHeroSize, roadScale, roadX } from "./road-layout.ts";
import { SEEDLING_SCENE_SCALE } from "./seedling-scene-scale.ts";

// Match the dialogue cast to each painting's ground scale. The portrait is a
// recomposition, so its figure-to-image ratio differs from the wide original.
export const fieldCastScale = (portrait: boolean) => (portrait ? 1.312 : 1.536);
export const seedlingCastScale = (portrait: boolean) =>
  fieldCastScale(portrait) * SEEDLING_SCENE_SCALE;

/** Project the two paintings and the figures onto the same ground plane. */
export function mossBedsLayout(view: RoadViewport) {
  const portrait = view.height > view.width;
  const imageWidth = portrait ? 1024 : 1536;
  const imageHeight = portrait ? 1536 : 1024;
  const imageScale = portrait
    ? Math.max(view.width / imageWidth, view.height / imageHeight) * 1.18
    : Math.min(view.width / imageWidth, view.height / imageHeight);
  const backdrop = {
    x: (view.width - imageWidth * imageScale) / 2,
    y: portrait ? 0 : (view.height - imageHeight * imageScale) / 2,
    width: imageWidth * imageScale,
    height: imageHeight * imageScale,
  };
  const project = (x: number, y: number) => ({
    x: backdrop.x + x * imageScale,
    y: backdrop.y + y * imageScale,
  });
  const world = (x: number, y: number) => {
    const point = project(x, y);
    return {
      x: (point.x - roadX(0, 0, view.width)) / roadScale(view.width),
      lane: 0.68 + (point.y - view.height * 0.62) / roadDepth(view.width, view.height),
    };
  };
  const scale = imageScale * (portrait ? 0.78 : 1);
  const figureSize = 144 * scale;
  return {
    portrait,
    scale,
    backdrop,
    project,
    world,
    figureSize,
    figureRatio: figureSize / roadHeroSize(view.width, view.height),
  };
}
