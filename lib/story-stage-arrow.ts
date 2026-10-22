import type { StageArrow } from "./story-stage-cues.ts";

/** Coordinates describe the arrow tip, so contact never overshoots the target. */
export function sampleStageArrow(arrow: StageArrow, elapsed: number, reduced: boolean) {
  const age = elapsed - arrow.after;
  const t = Math.max(0, Math.min(1, age / arrow.duration));
  return {
    visible: !reduced && age >= 0 && age < arrow.duration,
    x: arrow.from.x + (arrow.to.x - arrow.from.x) * t,
    bottom: arrow.from.bottom + (arrow.to.bottom - arrow.from.bottom) * t,
    angle:
      (Math.atan2((arrow.from.bottom - arrow.to.bottom) / 1.5, arrow.to.x - arrow.from.x) * 180) /
      Math.PI,
  };
}
