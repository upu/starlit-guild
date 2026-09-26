import type { TravellerId } from "@/lib/road-view";

export const roadSheet = (id: TravellerId) =>
  id === "lico"
    ? "/characters/lico-v1.png"
    : `/animations/road/${id}-v${id === "mira" ? "2" : "1"}.webp`;
export const ROAD_SIGNPOST = "/animations/road/signpost-v2.webp";
export const finnFrames = [
  [26, 14, 260, 325],
  [349, 14, 250, 325],
  [662, 14, 249, 325],
  [979, 14, 256, 325],
  [24, 342, 259, 299],
  [324, 340, 281, 301],
  [620, 347, 384, 294],
  [986, 341, 247, 300],
  [48, 642, 225, 308],
  [328, 670, 275, 280],
  [328, 670, 275, 280],
  [639, 646, 291, 304],
  [13, 950, 298, 291],
  [333, 950, 287, 291],
  [641, 950, 280, 291],
  [960, 950, 277, 291],
];
// Tight native rectangles; casting holds its raised pose before returning to idle.
export const miraFrames = [
  [31, 43, 275, 282],
  [333, 40, 276, 283],
  [643, 39, 274, 286],
  [959, 38, 271, 285],
  [24, 353, 267, 283],
  [327, 344, 280, 294],
  [327, 344, 280, 294],
  [32, 653, 262, 284],
  [32, 653, 262, 284],
  [338, 679, 269, 255],
  [641, 675, 240, 251],
  [960, 667, 251, 267],
  [26, 950, 264, 274],
  [333, 950, 264, 273],
  [640, 955, 275, 264],
  [954, 954, 259, 265],
];
export const ROAD_EFFECTS = "/animations/road/effects-v2.webp";
export const ROAD_HERB = "/animations/road/herb-v2.webp";
export const ROAD_CARGO = "/animations/road/cargo-v1.webp";
export const ROAD_PUPPETS = "/animations/road/puppets-v1.webp";
export const ROAD_PUSH = "/animations/road/push-v1.webp";
export const ROAD_PULL = "/animations/road/pull-v1.webp";
export const ROAD_FINN_PULL = "/animations/road/finn-pull-v1.webp";
export const ROAD_PACKING = "/animations/road/packing-v1.webp";
export const ROAD_DESTINATION = "/animations/road/destination-v1.webp";
export const ROAD_WORKSITES = "/animations/road/worksites-v1.webp";
export const ROAD_BERNE_WORKSITES = "/animations/road/berne-worksites-v1.webp";
export const ROAD_LEDGER_DESK = "/animations/road/ledger-desk-v1.webp";
export const roadWalkSheet = (id: TravellerId) =>
  id === "finn" || id === "lico"
    ? roadSheet(id)
    : `/animations/road/${id}-walk-v${id === "mira" ? "3" : "2"}.webp`;

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
    [87, 57, 602, 589],
    [38, 57, 541, 592],
    [85, 33, 605, 560],
    [35, 31, 544, 565],
  ],
};
export function roadWalkFrame(id: TravellerId, pose: number) {
  if (id === "lico") return { originX: 0.5, originY: 1, scale: 0.9 / 1536 };
  if (id === "finn") return { originX: 0.5, originY: 1, scale: 0.9 / finnFrames[pose][3] };
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
