import type { Traveller } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type {
  WaterwayPoint,
  WaterwayActions,
  WaterwayPose,
  WaterwayProp,
} from "./road-waterway-contacts.ts";
import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";
import {
  housecallsAssets as assets,
  housecallsLayout,
  housecallDoors,
} from "./road-housecalls-layout.ts";
export function housecallPalm(
  hero: Traveller,
  view: RoadViewport,
  stride: number,
  figureSize = housecallsLayout(view).figureSize,
) {
  const p = hero.id === "aria" ? [118, 117] : leonPalm(hero.walking, stride);
  const size = (figureSize * 0.9) / 144;
  return {
    x: hero.x + ((p[0] - 96) * size * hero.facing) / roadScale(view.width),
    lane: hero.lane + ((p[1] - 176) * size) / roadDepth(view.width, view.height),
  };
}
function leonPalm(walking: boolean, stride: number) {
  return walking
    ? [
        [126, 105],
        [135, 107],
        [124, 105],
        [129, 106],
      ][stride]
    : [134, 105];
}
export function housecallCarryPose(hero: Traveller, pickup: boolean, stride: number): WaterwayPose {
  if (pickup) return { asset: hero.id === "aria" ? assets.ariaLower : assets.leonLower, frame: 0 };
  if (hero.id === "aria")
    return { asset: assets.ariaCarry, frame: hero.walking ? 1 + stride : 0, rows: 2 };
  return {
    asset: hero.walking ? assets.leonWalk : assets.leonCarry,
    frame: hero.walking ? stride : 0,
    cell: 256,
  };
}
export function housecallProp(
  view: RoadViewport,
  id: string,
  asset: string,
  point: WaterwayPoint,
  width: number,
  scale = housecallsLayout(view).scale,
): WaterwayProp {
  return {
    id,
    asset,
    point,
    size: (width * scale) / roadHeroSize(view.width, view.height),
    depth: point.lane + 0.01,
  };
}
export function housecallResidents(scene: WaterwayActions, view: RoadViewport, node: number) {
  const l = housecallsLayout(view);
  scene.actors = housecallDoors.map((d, i) => ({
    id: `resident-${String(i)}`,
    point: l.world(d.x, d.y),
    size: l.figureRatio,
    pose: {
      asset: i === 1 ? assets.cook : assets.parent,
      cell: 128,
      rows: 2,
      frame: Math.floor(node / 5) === i ? 1 : 0,
      square: { foot: 120, height: 104 },
    },
  }));
}
