import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadLook } from "./chapter-road-presentation.ts";
import type { RoadBattle } from "./road-view.ts";
import { roadHeroSize, roadDepth, roadX } from "./road-layout.ts";
import { waterwayLayout } from "./road-waterway-layout.ts";

export type MossSourcePoint = { x: number; y: number };
export const mossHatchOffset = (node: number) => (node >= 9 ? { x: 30, y: -135 } : { x: 0, y: 0 });
export const mossHatchClosed = (index: number): MossSourcePoint => ({
  x: 1120 + index * 30,
  y: 676 - index * 135,
});
export const mossHatchPark: MossSourcePoint = { x: 1200, y: 811 };
export const keeperPalms = [
  [96, 176],
  [37, 166],
  [60, 119],
  [57, 112],
  [64, 112],
  [61, 112],
  [66, 112],
  [62, 112],
];
export const keeperHand = (foot: MossSourcePoint, frame: number): MossSourcePoint => ({
  x: foot.x + (keeperPalms[frame][0] - 96) / 1.085,
  y: foot.y + (keeperPalms[frame][1] - 176) / 1.085,
});
export const keeperLanternPalms = [
  [40, 163],
  [40, 140],
  [46, 121],
  [50, 114],
] as const;
export const keeperLanternHand = (foot: MossSourcePoint, frame: number): MossSourcePoint => ({
  x: foot.x + (keeperLanternPalms[frame][0] - 96) / 1.085,
  y: foot.y + (keeperLanternPalms[frame][1] - 176) / 1.085,
});
const keeperWalkPalms = [
  [67, 124],
  [68, 124],
  [65, 125],
  [67, 124],
];
export const keeperWalkHand = (
  foot: MossSourcePoint,
  frame: number,
  facing: 1 | -1,
): MossSourcePoint => ({
  x: foot.x + ((keeperWalkPalms[frame][0] - 96) * facing) / 1.085,
  y: foot.y + (keeperWalkPalms[frame][1] - 176) / 1.085,
});
export const keeperLid = (foot: MossSourcePoint, frame: number): MossSourcePoint => {
  const hand = keeperHand(foot, frame);
  return { x: hand.x - 76, y: hand.y };
};
export const keeperGrabFoot = (lid: MossSourcePoint): MossSourcePoint => ({
  x: lid.x + 76 + (96 - 37) / 1.085,
  y: lid.y + (176 - 166) / 1.085,
});
export const keeperInspectFoot = (): MossSourcePoint => {
  const foot = keeperGrabFoot(mossHatchClosed(1));
  return { x: foot.x - 20, y: foot.y - 35 };
};
export const mossLanternPark = () => keeperLanternHand(keeperGrabFoot(mossHatchPark), 0);
export const mossSourceSize = (pixels: number, view: RoadViewport) =>
  (pixels * waterwayLayout(view.width, view.height).backdrop.width) /
  1536 /
  roadHeroSize(view.width, view.height);

/** Reserve the two inspection mouths; the normal road has no such fixed holes. */
export function mossHatchObstacles(look: RoadLook, view: RoadViewport, state: RoadBattle) {
  if (!look.waterway || look.quest !== "tower-moss-removal") return [];
  const layout = waterwayLayout(view.width, view.height),
    scale = layout.backdrop.width / 1536;
  const holes = (state.waterwayActions?.holes ?? []).map((index) => {
    const point = layout.world(1120 + index * 30, 620 - index * 135);
    return {
      x: (roadX(point.x, 0, view.width) / view.width) * 560,
      lane: point.lane,
      clearance: {
        x: ((125 * scale) / view.width) * 560,
        lane: (70 * scale) / roadDepth(view.width, view.height),
      },
    };
  });
  const worker = state.waterwayActions?.worker;
  if (!worker || !state.enemies.some((enemy) => enemy.hp > 0)) return holes;
  const size = roadHeroSize(view.width, view.height);
  return [
    ...holes,
    {
      x: (roadX(worker.point.x, state.distance, view.width, state.stage) / view.width) * 560,
      lane: worker.point.lane,
      clearance: {
        x: ((size * 0.62) / view.width) * 560,
        lane: (size * 1.05) / roadDepth(view.width, view.height),
      },
      // Leon must remain at his basket long enough to set it down.
      ignore: ["leon" as const],
    },
  ];
}
