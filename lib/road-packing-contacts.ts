import { fixedRoadLayout } from "./road-fixed-layout.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { WaterwayProp } from "./road-waterway-contacts.ts";
import { medicinePackingAssets as assets, packingSourceSize } from "./road-medicine-packing.ts";
import { packingBagAsset } from "./road-packing-finish.ts";
export type PackingHero = "aria" | "leon";
export const packingBags = { aria: { x: 760, y: 800 }, leon: { x: 1150, y: 795 } };
export const packingMouth = (id: PackingHero) => ({
  x: packingBags[id].x + (id === "aria" ? -18 : 15),
  y: packingBags[id].y - 35,
});
export const packingLowerPalm = (id: PackingHero) => (id === "aria" ? [121, 159] : [144, 172]);
export const packingCarryPalms = {
  aria: [
    [119, 120],
    [109, 115],
    [107, 118],
    [113, 117],
    [118, 117],
  ],
  leon: [
    [134, 105],
    [126, 105],
    [135, 107],
    [124, 105],
    [129, 106],
  ],
};
export const packingTurnPalms = {
  aria: [
    [120, 110],
    [113, 112],
    [96, 113],
    [72, 110],
  ],
  leon: [
    [128, 111],
    [113, 111],
    [98, 111],
    [68, 111],
  ],
};
export function packingProp(
  view: RoadViewport,
  id: string,
  asset: string,
  point: { x: number; y: number },
  width: number,
  depth: number,
): WaterwayProp {
  const layout = fixedRoadLayout(view.width, view.height);
  return {
    id,
    asset,
    point: layout.world(point.x, point.y),
    size: packingSourceSize(width, view),
    depth: layout.world(point.x, depth).lane,
  };
}
export function packingBagProps(view: RoadViewport, id: PackingHero, frame = 0) {
  const p = packingBags[id],
    layout = fixedRoadLayout(view.width, view.height);
  const back = packingProp(view, `packing-bag-${id}`, packingBagAsset(frame), p, 70, p.y);
  const front = packingProp(view, `packing-bag-front-${id}`, assets.bagFront, p, 70, p.y);
  if (frame > 0) return [{ ...back, depth: layout.world(p.x, p.y).lane + 0.01 }];
  return [
    { ...back, depth: layout.world(p.x, p.y).lane - 0.01 },
    { ...front, depth: layout.world(p.x, p.y).lane + 0.01 },
  ];
}
