import type { StageExtra } from "./story-stage-cues.ts";
import { stageExtraFrame } from "./story-stage-figure.ts";

// Centers of the visible near hand in each registered 128px cell.
const hands: Partial<Record<StageExtra["id"], Partial<Record<number, [number, number]>>>> = {
  cook: {
    4: [35, 84],
    5: [61, 83],
    6: [36, 83],
    7: [61, 83],
    11: [43, 88],
    12: [28, 76],
  },
  worker: {
    16: [38, 71],
    17: [43, 64],
    18: [24, 81],
    1: [37, 72],
    4: [44, 78],
    5: [43, 78],
    6: [44, 78],
    7: [43, 78],
    10: [46, 109],
    11: [44, 79],
    13: [34, 62],
    14: [39, 79],
  },
  merchant: {
    16: [91, 80],
    17: [78, 79],
    18: [78, 79],
    19: [78, 79],
    1: [35, 74],
    8: [90, 83],
    9: [90, 83],
    10: [89, 84],
    11: [88, 82],
    12: [35, 80],
    13: [34, 99],
    14: [34, 62],
    15: [35, 83],
  },
  keeper: {
    8: [55, 86],
    9: [43, 79],
    10: [42, 83],
    11: [43, 79],
    14: [55, 79],
    15: [33, 78],
  },
};
export function stageExtraWrist(extra: StageExtra, moving: boolean, elapsed: number) {
  const point = hands[extra.id]?.[stageExtraFrame(extra, moving, elapsed)];
  if (!point) return undefined;
  // Worker art faces left; normalize travel to the right-facing attachment convention.
  return { x: extra.id === "worker" && moving ? 128 - point[0] : point[0], y: point[1] };
}
