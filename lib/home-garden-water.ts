import { gardenFrame, residentHand, type ResidentId } from "./home-actor.ts";
// Pouring-pose spout centers measured in the original 768x512 cell.
// Offsets use the atlas crop/scale/sole registration; see the art regression test.
export const gardenSpouts = {
  leon: { source: [606, 318], x: 19.68387096774194, y: -16.167741935483875 },
  aria: { source: [618, 299], x: 20.431769722814494, y: -17.969083155650324 },
  mira: { source: [647, 305], x: 20.8099173553719, y: -18.640495867768593 },
  finn: { source: [638, 307], x: 18.455852156057496, y: -17.015400410677614 },
  lico: { source: [282, 293], x: -22.277070063694268, y: -17.96496815286624 },
};
export function gardenWater(id: ResidentId, time: number, reduced = false) {
  if (reduced || gardenFrame(time) !== 2) return [];
  const tip = gardenSpouts[id],
    sign = residentHand(id) === "left" ? -1 : 1;
  return [0, 1, 2].map((i) => {
    const t = ((((time % 600) + 600) % 600) / 600 + i / 3) % 1;
    return { x: tip.x + sign * t * 7, y: tip.y + 1 + t * 9 };
  });
}
