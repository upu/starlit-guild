import type { ResidentId } from "./home-actor.ts";

// Right-hand wrist centers in the registered 128px cells (ground contact y=120).
// Unlike carried items, an applied dressing follows the arm through its walking swing.
// null means the far arm is behind the torso in this frame.
const walking = {
  aria: [[76, 80], [76, 80], null, null, null, null, null, [83, 75]],
  leon: [[76, 82], [76, 82], null, null, [76, 82], [76, 82], null, null],
  mira: [[79, 88], [79, 88], null, [83, 91], [81, 88], [81, 88], null, null],
};
const conversation: Record<string, Partial<Record<number, number[]>>> = {
  finn: {
    0: [78, 88],
    4: [83, 78],
    17: [94, 94],
    18: [70, 70],
    19: [58, 86],
    20: [93, 79],
  },
  aria: {
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
  },
  leon: {
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
export function stageWrist(id: ResidentId, atlas: string, frame: number) {
  const point = atlases[atlas]?.[id]?.[frame];
  return point ? { x: point[0], y: point[1] } : undefined;
}
