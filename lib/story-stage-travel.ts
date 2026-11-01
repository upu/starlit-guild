import type { StageActor } from "./story-stage-cues.ts";

export type StagePosition = {
  atlas?: "home" | "adventure" | "conversation" | "shawl";
  frame?: number;
  x: number;
  bottom?: number;
  left?: boolean;
  handDrop?: number;
  onChair?: boolean;
  mirrored?: boolean;
  depth?: number;
  route?: { key: string; remaining: { x: number; bottom: number }[] };
  wrist?: { x: number; y: number };
  lift?: number;
};
const distance = (a: StagePosition, b: StagePosition) =>
  Math.hypot(b.x - a.x, (((b.bottom ?? 14) - (a.bottom ?? 14)) * 2) / 3);
const pace = (actor: StageActor) =>
  actor.paceMsPerUnit && Number.isFinite(actor.paceMsPerUnit) && actor.paceMsPerUnit > 0
    ? actor.paceMsPerUnit
    : 34;

export function stageRoute(
  actor: Pick<StageActor, "x" | "bottom" | "via" | "lane">,
  origin: StagePosition,
  defaultBottom = 14,
) {
  const target = { x: actor.x, bottom: actor.bottom ?? defaultBottom };
  const start = { ...origin, bottom: origin.bottom ?? defaultBottom };
  const key = JSON.stringify([target.x, target.bottom, actor.via ?? null, actor.lane ?? null]);
  if (distance(start, target) < 0.1) return { key, points: [target] };
  if (origin.route?.key === key) return { key, points: [start, ...origin.route.remaining] };
  const via =
    actor.via ??
    (actor.lane === undefined
      ? []
      : [
          { x: start.x, bottom: actor.lane },
          { x: actor.x, bottom: actor.lane },
        ]);
  return { key, points: [start, ...via, target] };
}

export function actorJourney(actor: StageActor, origin: StagePosition) {
  return stageRoute(actor, origin).points;
}

export function journeyDuration(actor: StageActor, origin: StagePosition) {
  const points = actorJourney(actor, origin);
  return points
    .slice(1)
    .reduce((sum, point, i) => sum + distance(points[i], point) * pace(actor), 0);
}

export function sampleJourney(
  actor: StageActor,
  origin: StagePosition,
  elapsed: number,
  reduced: boolean,
): StagePosition & { moving: boolean; left: boolean } {
  const { key, points } = stageRoute(actor, origin);
  let remaining = Math.max(0, elapsed) / pace(actor);
  for (let i = 1; i < points.length && !reduced; i++) {
    const from = points[i - 1],
      to = points[i],
      length = distance(from, to);
    if (length > remaining) {
      const t = remaining / length;
      return {
        x: from.x + (to.x - from.x) * t,
        bottom: from.bottom + (to.bottom - from.bottom) * t,
        moving: true,
        left: Math.abs(to.x - from.x) > 0.1 ? to.x < from.x : (origin.left ?? actor.left),
        ...(actor.via || actor.lane !== undefined
          ? { route: { key, remaining: points.slice(i) } }
          : {}),
      };
    }
    remaining -= length;
  }
  return { x: actor.x, bottom: actor.bottom ?? 14, moving: false, left: actor.left };
}
