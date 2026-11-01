import type { Traveller } from "./road-view.ts";
import { roadDepth, roadHeroSize, roadScale, roadFigureDepth } from "./road-layout.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";

export type WaterwayPoint = { x: number; lane: number };
export type WaterwayPose = {
  asset: string;
  frame: number;
  cell?: number;
  rows?: number;
  square?: { foot: number; height: number };
};
export type WaterwayProp = {
  /** Permanent paving details stay between the backdrop and every person. */
  layer?: "ground";
  flipX?: boolean;
  origin?: { x: number; y: number };
  id?: string;
  asset: string;
  point: WaterwayPoint;
  size: number;
  depth: number;
  angle?: number;
  alpha?: number;
  verticalScale?: number;
  groundShadow?: number;
};
export function waterwayPropDepth(prop: WaterwayProp, view: RoadViewport, look?: RoadLook) {
  return prop.layer === "ground"
    ? 2 + prop.depth * 0.1
    : roadFigureDepth(prop.depth, view, look) + 0.02;
}
export type WaterwayActions = {
  priorityHero?: Traveller["id"];
  poses: Partial<Record<Traveller["id"], WaterwayPose>>;
  props: WaterwayProp[];
  debrisHidden: boolean;
  closeContact: boolean;
  holes?: number[];
  worker?: {
    point: WaterwayPoint;
    pose: WaterwayPose;
    facing?: 1 | -1;
    size?: number;
    alpha?: number;
  };
  actors?: {
    id: string;
    point: WaterwayPoint;
    pose: WaterwayPose;
    facing?: 1 | -1;
    size?: number;
    alpha?: number;
  }[];
};
export const waterwayActionAssets = {
  sawLower: "/storybook-study/waterway-worker-saw-lower-v1.webp",
  saw: "/storybook-study/waterway-saw-v1.webp",
  basket: "/storybook-study/basket-v1.webp",
  filled: "/storybook-study/waterway-basket-filled-v1.webp",
  stone: "/storybook-study/waterway-repair-stone-v1.webp",
  worker: "/storybook-study/waterway-worker-handoff-v1.webp",
  carryWalk: "/storybook-study/leon-carry-walk-v1.webp",
  carry: "/storybook-study/leon-carry-v1.webp",
  carryTurn: "/storybook-study/leon-basket-turn-v1.webp",
  leonWork: "/storybook-study/leon-work-v1.webp",
  ariaWork: "/storybook-study/aria-work-v1.webp",
};
export const waterwayPalms = {
  ariaPick: [136, 151],
  ariaDeposit: [125, 137],
  leonKneel: [128, 132],
  leonCarry: [134, 105],
  workerReceive: [62, 111],
  workerPlace: [38, 164],
  carryWalk: [
    [126, 105],
    [135, 107],
    [124, 105],
    [129, 106],
  ],
} as const;

export function waterwayPalm(
  foot: WaterwayPoint,
  palm: readonly number[],
  facing: number,
  view: RoadViewport,
): WaterwayPoint {
  const figure = (roadHeroSize(view.width, view.height) * 0.9) / 144;
  return {
    x: foot.x + ((palm[0] - 96) * figure * facing) / roadScale(view.width),
    lane: foot.lane + ((palm[1] - 176) * figure) / roadDepth(view.width, view.height),
  };
}
export function waterwayFoot(
  point: WaterwayPoint,
  palm: readonly number[],
  facing: number,
  view: RoadViewport,
) {
  const offset = waterwayPalm({ x: 0, lane: 0 }, palm, facing, view);
  return { x: point.x - offset.x, lane: point.lane - offset.lane };
}
export function waterwayAt(hero: WaterwayPoint, target: WaterwayPoint, view: RoadViewport) {
  return (
    Math.abs(hero.x - target.x) * roadScale(view.width) < 2 &&
    Math.abs(hero.lane - target.lane) < 0.02
  );
}
export function waterwayMix(from: WaterwayPoint, to: WaterwayPoint, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  return { x: from.x + (to.x - from.x) * p, lane: from.lane + (to.lane - from.lane) * p };
}
