import type { RoadViewport } from "./road-cart-layout.ts";
import type { Traveller } from "./road-view.ts";
import type { WaterwayActions } from "./road-waterway-contacts.ts";
import { housecallsLayout } from "./road-housecalls-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";

/** The return conversation uses the same yard with a slightly closer figure scale. */
export const STONE_RETURN_FIGURE_SCALE = 1.33;
export const stoneReturnAssets = {
  blue: "/story-stage/prop-candidate-blue.webp",
  violet: "/story-stage/prop-candidate-violet.webp",
  dull: "/story-stage/prop-candidate-dull.webp",
  chair: "/story-stage/prop-chair.webp",
  basket: "/story-stage/prop-basket.webp",
  bag: "/story-stage/prop-delivery-bag.webp",
  medicine: "/storybook-study/medicine-closed-v1.webp",
  miraSeat: "/storybook-study/mira-seat-v3.webp",
};

export function stoneReturnTarget(id: Traveller["id"]): [number, number] {
  const targets: Partial<Record<Traveller["id"], [number, number]>> = {
    aria: [458, 726],
    leon: [691, 623],
    mira: [856, 601],
    finn: [868, 734],
  };
  return targets[id] ?? [1110, 810];
}

/** Match the opening tableau of the return conversation, before Finn bends down. */
export function stoneReturnScene(scene: WaterwayActions, view: RoadViewport, masonAsset: string) {
  const l = housecallsLayout(view);
  scene.actors = [
    {
      id: "selection-mason",
      point: l.world(547, 505),
      size: l.figureRatio * STONE_RETURN_FIGURE_SCALE,
      pose: { asset: masonAsset, cell: 128, rows: 2, frame: 0, square: { foot: 120, height: 104 } },
    },
  ];
  scene.poses.mira = { asset: stoneReturnAssets.miraSeat, frame: 1 };
  const objects = [
    ["selection-stone-0", stoneReturnAssets.blue, 392, 741, 69],
    ["selection-stone-1", stoneReturnAssets.violet, 680, 741, 69],
    ["selection-stone-2", stoneReturnAssets.dull, 779, 741, 69],
    ["selection-chair", stoneReturnAssets.chair, 873, 586, 94],
    ["selection-basket", stoneReturnAssets.basket, 392, 800, 61],
    ["selection-bag", stoneReturnAssets.bag, 1067, 793, 77],
    ["selection-medicine", stoneReturnAssets.medicine, 1005, 650, 57],
  ] as const;
  for (const [id, asset, x, y, width] of objects) {
    const item = housecallProp(view, id, asset, l.world(x, y), width);
    if (id === "selection-chair") item.flipX = true;
    scene.props.push(item);
  }
}
