import { gardenFrame, residentHand, type ResidentId } from "./home-actor.ts";
import type { Cell, Furniture, RoomSite } from "./home-room-layout.ts";

// Root centers measured on prop-7 (155x63), decor-4 (205x122), decor-5 (200x100).
// Drawing and watering both use these anchors, including the crop's growth scale.
export function gardenPlantings(plot: Furniture, growth: number, site: RoomSite) {
  const moss = site === "brekka",
    mature = growth >= 0.7;
  const width = moss ? 22 + growth * 18 : 30;
  const art = moss
    ? {
        texture: "decor-5",
        size: [200, 100],
        roots: [
          [44, 81],
          [157, 81],
        ],
      }
    : mature
      ? {
          texture: "decor-4",
          size: [205, 122],
          roots: [
            [49, 97],
            [167, 94],
          ],
        }
      : {
          texture: "prop-7",
          size: [155, 63],
          roots: [
            [24, 48],
            [129, 48],
          ],
        };
  return [0, 1].map((i) => {
    const x = (plot.x + 1.2 + i * 1.6) * 24,
      y = (plot.y + 2) * 24 - 29;
    const [rx, ry] = art.roots[i];
    return {
      texture: art.texture,
      width,
      x,
      y,
      root: {
        x: x + (rx / art.size[0] - 0.5) * width,
        y: y + ((ry - art.size[1]) * width) / art.size[0],
      },
    };
  });
}
export const gardenRoot = (plants: ReturnType<typeof gardenPlantings>, id: ResidentId) =>
  plants[residentHand(id) === "left" ? 1 : 0].root;
// Pouring-pose spout centers measured in the original 768x512 cell.
// Offsets use the atlas crop/scale/sole registration; see the art regression test.
export const gardenSpouts = {
  leon: { source: [606, 318], x: 19.68387096774194, y: -16.167741935483875 },
  aria: { source: [618, 299], x: 20.431769722814494, y: -17.969083155650324 },
  mira: { source: [647, 305], x: 20.8099173553719, y: -18.640495867768593 },
  finn: { source: [638, 307], x: 18.455852156057496, y: -17.015400410677614 },
  lico: { source: [282, 293], x: -22.277070063694268, y: -17.96496815286624 },
};
export function gardenWaterPoint(id: ResidentId, target: Cell, t: number) {
  const tip = gardenSpouts[id];
  return { x: tip.x + (target.x - tip.x) * t, y: tip.y + (target.y - tip.y) * t * t };
}
export function gardenWetness(time: number, reduced = false) {
  const t = ((time % 2400) + 2400) % 2400;
  return reduced || t < 1200 ? 0 : Math.min(1, (2400 - t) / 600);
}
export function gardenWater(id: ResidentId, time: number, target: Cell, reduced = false) {
  if (reduced || gardenFrame(time) !== 2) return [];
  return [0, 1, 2, 3, 4, 5].map((i) => {
    const t = ((((time % 600) + 600) % 600) / 600 + i / 6) % 1;
    return gardenWaterPoint(id, target, t);
  });
}
