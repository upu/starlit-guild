import type { ResidentId } from "./home-actor.ts";

// Right-hand wrist centers in the registered 128px cells (ground contact y=120).
// Unlike carried items, an applied dressing follows the arm through its walking swing.
// null means the far arm is behind the torso in this frame.
const walking = {
  finn: [[75, 85], [76, 85], [76, 87], null, [47, 80], [51, 84], null, null],
  aria: [[76, 80], [76, 80], null, null, null, null, null, [83, 75]],
  leon: [[76, 82], [76, 82], null, null, [76, 82], [76, 82], null, null],
  mira: [[79, 88], [79, 88], null, [83, 91], [81, 88], [81, 88], null, null],
};
const conversation: Record<string, Partial<Record<number, number[]>>> = {
  finn: {
    56: [70, 84],
    57: [67, 69],
    58: [92, 74],
    0: [78, 88],
    1: [84, 68],
    2: [72, 76],
    3: [71, 71],
    4: [83, 78],
    5: [84, 71],
    17: [94, 94],
    18: [70, 70],
    19: [58, 86],
    20: [93, 79],
  },
  aria: {
    56: [72, 80],
    57: [74, 64],
    58: [94, 72],
    0: [76, 82],
    1: [81, 63],
    2: [72, 71],
    3: [72, 69],
    4: [83, 65],
    5: [81, 64],
    8: [79, 76],
    9: [79, 76],
    22: [79, 76],
    23: [79, 76],
    13: [78, 109],
    14: [75, 76],
    15: [75, 76],
    16: [75, 76],
    52: [87, 55],
    53: [86, 65],
  },
  leon: {
    56: [72, 82],
    57: [72, 64],
    58: [94, 72],
    0: [76, 83],
    3: [73, 73],
    4: [81, 70],
    6: [68, 96],
    7: [68, 96],
    8: [81, 71],
    9: [81, 71],
    22: [81, 71],
    23: [81, 71],
    14: [76, 77],
    15: [76, 77],
    16: [76, 77],
    13: [77, 108],
    21: [76, 95],
    44: [77, 78],
    45: [88, 71],
  },
  mira: {
    13: [84, 112],
    60: [91, 82],
    61: [105, 78],
    62: [94, 65],
    63: [75, 74],
    56: [70, 85],
    57: [71, 73],
    58: [94, 80],
    0: [77, 87],
    3: [74, 79],
    4: [81, 77],
    5: [75, 71],
    10: [76, 105],
    8: [77, 81],
    9: [77, 81],
    14: [76, 82],
    15: [76, 82],
    16: [76, 82],
    24: [78, 89],
    25: [82, 83],
    26: [88, 82],
    27: [78, 89],
  },
};
type Points = Partial<Record<number, number[] | null>>;
const atlases: Partial<Record<string, Partial<Record<ResidentId, Points>>>> = {
  home: walking,
  conversation,
  // Adventure cells are 192px, drawn at left=-32/top=-56 in the common 128px cell.
  adventure: { aria: { 11: [117 - 32, 133 - 56], 13: [108 - 32, 150 - 56] } },
};
// Chair sprites include both facings. Return right-facing coordinates because
// the attachment painter mirrors coordinates with the displayed owner.
const chairHands: Partial<Record<ResidentId, number[][]>> = {
  aria: [
    [76, 89],
    [81, 78],
    [85, 80],
    [76, 89],
  ],
  leon: [
    [79, 91],
    [80, 82],
    [89, 77],
    [79, 91],
  ],
  mira: [
    [78, 89],
    [82, 83],
    [88, 82],
    [78, 89],
  ],
  finn: [
    [79, 92],
    [81, 86],
    [86, 83],
    [79, 92],
  ],
};
export function stageWrist(id: ResidentId, atlas: string, frame: number) {
  const point =
    atlas === "conversation" && frame >= 24 && frame < 32
      ? chairHands[id]?.[(frame - 24) % 4]
      : atlases[atlas]?.[id]?.[frame];
  return point ? { x: point[0], y: point[1] } : undefined;
}
