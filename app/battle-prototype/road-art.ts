import type { TravellerId } from "@/lib/scrolling-battle";

export const roadSheet = (id: TravellerId) => `/animations/road/${id}-v1.png`;
export const ROAD_EFFECTS = "/animations/road/effects-v2.png";

// Keep the generated pixels intact; variable rectangles preserve extended weapons.
export function roadFrame(id: TravellerId, pose: number) {
  const row = Math.floor(pose / 4),
    column = pose % 4;
  const tops = [0, 376, 738],
    bottoms = [376, 738, 1086];
  let left = column * 362,
    right = left + 362;
  if (id !== "aria" && row === 1 && column === 2) right = 1144;
  if (id !== "aria" && row === 1 && column === 3) left = 1144;
  const top = tops[row],
    height = bottoms[row] - top;
  return {
    left,
    top,
    width: right - left,
    height,
    originX: (column * 362 + 181 - left) / (right - left),
    originY: ([360, 726, 1064][row] - top) / height,
  };
}
