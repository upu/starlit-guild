import type { TravellerId } from "@/lib/scrolling-battle";

export const roadSheet = (id: TravellerId) => `/animations/road/${id}-v1.png`;
export const ROAD_EFFECTS = "/animations/road/effects-v2.png";
export const ROAD_HERB = "/animations/road/herb-v2.png";
export const ROAD_CARGO = "/animations/road/cargo-v1.png";
export const ROAD_PUPPETS = "/animations/road/puppets-v1.png";
export const ROAD_PUSH = "/animations/road/push-v1.png";
export const ROAD_WORKSITES = "/animations/road/worksites-v1.png";
export const roadWalkSheet = (id: TravellerId) => `/animations/road/${id}-walk-v2.png`;

// The generator varies the transparent margins. Align the feet and visible height,
// rather than letting alternate rows jump vertically during playback.
const walkBounds = {
  aria: [
    [116, 89, 566, 597],
    [65, 89, 493, 602],
    [114, 43, 575, 541],
    [76, 40, 499, 544],
  ],
  leon: [
    [83, 83, 549, 621],
    [55, 82, 509, 623],
    [109, 46, 550, 572],
    [68, 47, 509, 571],
  ],
  mira: [
    [87, 58, 601, 588],
    [38, 58, 540, 591],
    [85, 35, 604, 559],
    [36, 33, 543, 564],
  ],
};
export function roadWalkFrame(id: TravellerId, pose: number) {
  const [left, top, right, bottom] = walkBounds[id][pose];
  return { originX: (left + right) / 2 / 627, originY: bottom / 627, scale: 0.9 / (bottom - top) };
}

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
