import type { StageActor } from "./story-stage-cues.ts";

export type StagePosition = { x: number; bottom?: number; left?: boolean };
const distance = (a: StagePosition, b: StagePosition) =>
  Math.hypot(b.x - a.x, (((b.bottom ?? 14) - (a.bottom ?? 14)) * 2) / 3);

export function actorJourney(actor: StageActor, origin: StagePosition) {
  const target = { x: actor.x, bottom: actor.bottom ?? 14 };
  if (distance(origin, target) < 0.1) return [target];
  return actor.lane === undefined
    ? [origin, target]
    : [origin, { x: origin.x, bottom: actor.lane }, { x: actor.x, bottom: actor.lane }, target];
}

export function journeyDuration(actor: StageActor, origin: StagePosition) {
  const points = actorJourney(actor, origin);
  return points.slice(1).reduce((sum, point, i) => sum + distance(points[i], point) * 34, 0);
}

export function sampleJourney(
  actor: StageActor,
  origin: StagePosition,
  elapsed: number,
  reduced: boolean,
) {
  const points = actorJourney(actor, origin);
  let remaining = Math.max(0, elapsed) / 34;
  for (let i = 1; i < points.length && !reduced; i++) {
    const from = points[i - 1],
      to = points[i],
      length = distance(from, to);
    if (length > remaining) {
      const t = remaining / length;
      return {
        x: from.x + (to.x - from.x) * t,
        bottom: (from.bottom ?? 14) + ((to.bottom ?? 14) - (from.bottom ?? 14)) * t,
        moving: true,
        left: Math.abs(to.x - from.x) > 0.1 ? to.x < from.x : (origin.left ?? actor.left),
      };
    }
    remaining -= length;
  }
  return { x: actor.x, bottom: actor.bottom ?? 14, moving: false, left: actor.left };
}
