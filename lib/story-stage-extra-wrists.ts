import type { StageExtra } from "./story-stage-cues.ts";
import { stageExtraFrame } from "./story-stage-figure.ts";

// Centers of the visible near hand in the registered 128px cook cells.
const cookHands: Partial<Record<number, [number, number]>> = {
  4: [35, 84],
  5: [61, 83],
  6: [36, 83],
  7: [61, 83],
  11: [43, 88],
  12: [28, 76],
};

export function stageExtraWrist(extra: StageExtra, moving: boolean, elapsed: number) {
  const point = extra.id === "cook" && cookHands[stageExtraFrame(extra, moving, elapsed)];
  return point ? { x: point[0], y: point[1] } : undefined;
}
