import type { RoadViewport } from "./road-cart-layout.ts";
import { roadDepth, roadHeroSize, roadScale, roadX } from "./road-layout.ts";

export function brekkaVisitPortraitBackdrop(view: RoadViewport) {
  const scale = Math.max(view.width / 1024, view.height / 1536);
  return {
    x: (view.width - 1024 * scale) / 2,
    y: (view.height - 1536 * scale) / 2,
    width: 1024 * scale,
    height: 1536 * scale,
  };
}

/** Both images share the same logical yard and object coordinates. */
export function brekkaLedgerLayout(view: RoadViewport, portrait = view.height > view.width) {
  const imageWidth = portrait ? 1024 : 1536;
  const imageHeight = portrait ? 1536 : 1024;
  const scale = portrait
    ? Math.max(view.width / imageWidth, view.height / imageHeight)
    : Math.min(view.width / imageWidth, view.height / imageHeight);
  const backdrop = {
    x: (view.width - imageWidth * scale) / 2,
    y: (view.height - imageHeight * scale) / 2,
    width: imageWidth * scale,
    height: imageHeight * scale,
  };
  const project = (x: number, y: number) => ({
    x: backdrop.x + (portrait ? 512 + (x - 768) * 0.85 : x) * scale,
    y: backdrop.y + (portrait ? 690 + (y - 645) * 1.3 : y) * scale,
  });
  const unproject = (x: number, y: number) => ({
    x: portrait ? 768 + ((x - backdrop.x) / scale - 512) / 0.85 : (x - backdrop.x) / scale,
    y: portrait ? 645 + ((y - backdrop.y) / scale - 690) / 1.3 : (y - backdrop.y) / scale,
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
