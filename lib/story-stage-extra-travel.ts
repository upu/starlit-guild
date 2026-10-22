import type { StageExtra } from "./story-stage-cues.ts";
import type { StagePosition } from "./story-stage-travel.ts";

export function extraTravelDuration(extra: StageExtra, origin: StagePosition) {
  return (
    Math.max(
      280,
      Math.hypot(extra.x - origin.x, (extra.bottom ?? 23) - (origin.bottom ?? 23)) * 34,
    ) / 0.6
  );
}

export function sampleExtraTravel(
  extra: StageExtra,
  origin: StagePosition,
  elapsed: number,
  reduced: boolean,
) {
  const progress = reduced
    ? 1
    : Math.min(1, Math.max(0, elapsed) / extraTravelDuration(extra, origin));
  const bottom = origin.bottom ?? 23;
  const moving =
    progress < 1 && Math.hypot(extra.x - origin.x, (extra.bottom ?? 23) - bottom) > 0.1;
  return {
    x: origin.x + (extra.x - origin.x) * progress,
    bottom: bottom + ((extra.bottom ?? 23) - bottom) * progress,
    left: moving ? extra.x < origin.x : !!extra.left,
    moving,
  };
}
