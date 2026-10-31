import type { RoadViewport } from "./road-cart-layout.ts";
import type { Traveller } from "./road-view.ts";
import type { WaterwayActions } from "./road-waterway-contacts.ts";
import { foundationLayout } from "./road-housecalls-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";
import { roadDepth } from "./road-layout.ts";

/** Match the revealed stonework and cast at the start of the return conversation. */
export const FOUNDATION_RETURN_SCALE = 1.33;
export const foundationReturnAssets = {
  open: "/storybook-study/berne-foundation-open-v2.png",
  notes: "/storybook-study/leon-groove-plan-v1.webp",
  basket: "/storybook-study/basket-v1.webp",
  bag: "/story-stage/prop-delivery-bag.webp",
  medicine: "/storybook-study/medicine-closed-v1.webp",
  tools: "/story-stage/prop-tools.webp",
};
export const foundationGear = [
  ["foundation-basket", foundationReturnAssets.basket, 415, 720, 61],
  ["foundation-bag", foundationReturnAssets.bag, 1210, 750, 78],
  ["foundation-medicine", foundationReturnAssets.medicine, 400, 530, 58],
  ["foundation-tools", foundationReturnAssets.tools, 300, 565, 55],
] as const;

export function foundationGearObstacles(view: RoadViewport) {
  const l = foundationLayout(view);
  return foundationGear.map(([, , x, y]) => ({
    x: (l.project(x, y).x / view.width) * 560,
    lane: l.world(x, y).lane,
    clearance: {
      x: ((45 * l.scale) / view.width) * 560,
      lane: (38 * l.scale) / roadDepth(view.width, view.height),
    },
  }));
}

export function foundationReturnTarget(id: Traveller["id"]): [number, number] {
  const targets: Partial<Record<Traveller["id"], [number, number]>> = {
    aria: [475, 730],
    leon: [866, 552],
    mira: [458, 514],
    finn: [1078, 720],
  };
  return targets[id] ?? [1200, 850];
}

export function foundationReturnScene(
  scene: WaterwayActions,
  view: RoadViewport,
  mason: string,
  keeper: string,
  leonAvailable: boolean,
) {
  const l = foundationLayout(view);
  scene.actors = [
    {
      id: "foundation-mason",
      point: l.world(691, 627),
      size: l.figureRatio * FOUNDATION_RETURN_SCALE,
      pose: { asset: mason, cell: 128, rows: 2, frame: 5, square: { foot: 120, height: 104 } },
    },
    {
      id: "foundation-keeper",
      point: l.world(1037, 506),
      size: l.figureRatio * FOUNDATION_RETURN_SCALE,
      pose: { asset: keeper, cell: 128, rows: 1, frame: 0, square: { foot: 120, height: 104 } },
    },
  ];
  if (leonAvailable) scene.poses.leon = { asset: foundationReturnAssets.notes, frame: 1 };
  foundationReturnGear(scene, view);
}

/** The party's belongings stay on the same ground throughout the investigation. */
export function foundationReturnGear(scene: WaterwayActions, view: RoadViewport) {
  const l = foundationLayout(view);
  for (const [id, asset, x, y, width] of foundationGear)
    scene.props.push(housecallProp(view, id, asset, l.world(x, y), width, l.scale));
}
