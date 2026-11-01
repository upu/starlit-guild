import type { RoadViewport } from "./road-cart-layout.ts";
import { roadDepth, roadHeroSize, roadScale, roadX } from "./road-layout.ts";

export const lanternRoadAssets = {
  bank: "/storybook-study/lantern-road-landscape-v1.png",
  portrait: "/storybook-study/lantern-road-portrait-v1.png",
  porter: "/storybook-study/worker-road-v1.webp",
  lantern: "/storybook-study/stone-lantern-closed-sooty-v1.webp",
  grass: "/storybook-study/roadside-grass-v1.webp",
  ariaWork: "/storybook-study/lantern-heroes-v1.webp",
  ariaWeed: "/storybook-study/aria-weed-v1.webp",
} as const;

/** Logical coordinates stay shared across the two compositions. */
export function lanternRoadLayout(view: RoadViewport, portrait = view.height > view.width) {
  const sourceWidth = portrait ? 1024 : 1536;
  const sourceHeight = portrait ? 1536 : 1024;
  const scale = Math.max(view.width / sourceWidth, view.height / sourceHeight);
  const backdrop = {
    x: (view.width - sourceWidth * scale) / 2,
    y: (view.height - sourceHeight * scale) / 2,
    width: sourceWidth * scale,
    height: sourceHeight * scale,
  };
  const project = (x: number, y: number) => ({
    x: backdrop.x + (portrait ? 512 + (x - 768) * 0.74 : x) * scale,
    y: backdrop.y + (portrait ? 600 + (y - 500) * 1.4 : y) * scale,
  });
  const unproject = (x: number, y: number) => ({
    x: portrait ? 768 + ((x - backdrop.x) / scale - 512) / 0.74 : (x - backdrop.x) / scale,
    y: portrait ? 500 + ((y - backdrop.y) / scale - 600) / 1.4 : (y - backdrop.y) / scale,
  });
  const world = (x: number, y: number) => {
    const p = project(x, y);
    return {
      x: (p.x - roadX(0, 0, view.width)) / roadScale(view.width),
      lane: 0.68 + (p.y - view.height * 0.62) / roadDepth(view.width, view.height),
    };
  };
  const figureSize = 144 * scale;
  return {
    backdrop,
    scale,
    project,
    unproject,
    world,
    figureSize,
    figureRatio: figureSize / roadHeroSize(view.width, view.height),
  };
}
