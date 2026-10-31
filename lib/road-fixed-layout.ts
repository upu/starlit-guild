import { roadDepth, roadHeroSize, roadScale, roadX } from "./road-layout.ts";
/** Shared1536x1024 oblique ground registered to body size, with a narrower phone crop. */
export function fixedRoadLayout(width: number, height: number) {
  const figureScale = (roadHeroSize(width, height) * 0.9) / 144,
    sourceScale = figureScale * 1.085;
  const backdrop = {
    width: 1536 * sourceScale,
    height: 1024 * sourceScale,
    x: Math.min(0, (width - 1536 * sourceScale) * 0.7),
    y:
      height > width
        ? Math.max(0, height * 0.62 - 635 * sourceScale)
        : Math.min(0, height * 0.7 - 635 * sourceScale),
  };
  const project = (x: number, y: number) => ({
    x: backdrop.x + x * sourceScale,
    y: backdrop.y + y * sourceScale,
  });
  const world = (x: number, y: number) => {
    const p = project(x, y);
    return {
      x: (p.x - roadX(0, 0, width)) / roadScale(width),
      lane: 0.68 + (p.y - height * 0.62) / roadDepth(width, height),
    };
  };
  return { backdrop, project, world, figureScale, sourceScale };
}
