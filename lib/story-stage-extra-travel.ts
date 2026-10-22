import type { StageExtra } from "./story-stage-cues.ts";
import type { StagePosition } from "./story-stage-travel.ts";

const distance = (a: StagePosition, b: StagePosition) =>
  Math.hypot(b.x - a.x, (((b.bottom ?? 23) - (a.bottom ?? 23)) * 2) / 3);
const route = (extra: StageExtra, origin: StagePosition) => [
  origin,
  ...(extra.via ?? []),
  { x: extra.x, bottom: extra.bottom ?? 23 },
];
export function extraTravelDuration(extra: StageExtra, origin: StagePosition) {
  const points = route(extra, origin);
  return (
    Math.max(
      280,
      points.slice(1).reduce((total, point, i) => total + distance(points[i], point) * 34, 0),
    ) / 0.6
  );
}
export function sampleExtraTravel(
  extra: StageExtra,
  origin: StagePosition,
  elapsed: number,
  reduced: boolean,
) {
  const points = route(extra, origin);
  let remaining = (Math.max(0, elapsed) * 0.6) / 34;
  for (let i = 1; i < points.length && !reduced; i++) {
    const from = points[i - 1],
      to = points[i],
      length = distance(from, to);
    if (length > remaining) {
      const t = remaining / length;
      return {
        x: from.x + (to.x - from.x) * t,
        bottom: (from.bottom ?? 23) + ((to.bottom ?? 23) - (from.bottom ?? 23)) * t,
        left: to.x < from.x,
        moving: true,
      };
    }
    remaining -= length;
  }
  return { x: extra.x, bottom: extra.bottom ?? 23, left: !!extra.left, moving: false };
}
