import type { PartyPosition } from "./road-party-spacing.ts";

type Point = PartyPosition;
const travelTime = (a: Point, b: Point) => Math.hypot((b.x - a.x) / 280, (b.lane - a.lane) / 0.9);

function axisInterval(from: number, to: number, center: number, radius: number) {
  if (Math.abs(to - from) < 1e-10)
    return Math.abs(from - center) < radius ? [-Infinity, Infinity] : [Infinity, -Infinity];
  const ends = [(center - radius - from) / (to - from), (center + radius - from) / (to - from)];
  return [Math.min(...ends), Math.max(...ends)];
}

function crosses(a: Point, b: Point, obstacle: Point, gap: Point) {
  const x = axisInterval(a.x, b.x, obstacle.x, gap.x - 0.001);
  const y = axisInterval(a.lane, b.lane, obstacle.lane, gap.lane - 0.00001);
  return Math.max(0, x[0], y[0]) < Math.min(1, x[1], y[1]);
}

function routeCorners(blockers: Point[], gap: Point, target: Point) {
  return blockers
    .flatMap((b) =>
      [-1, 1].flatMap((x) => [
        { x: b.x + x * (gap.x + 0.02), lane: target.lane },
        { x: target.x, lane: b.lane + x * (gap.lane + 0.0002) },
        ...[-1, 1].map((lane) => ({
          x: b.x + x * (gap.x + 0.02),
          lane: b.lane + lane * (gap.lane + 0.0002),
        })),
      ]),
    )
    .filter((p) => p.x >= gap.x / 2 && p.x <= 560 - gap.x / 2 && p.lane >= 0.1 && p.lane <= 1.3)
    .filter((p) => !blockers.some((b) => crosses(p, p, b, gap)));
}

function shortestRoutes(nodes: Point[], blocked: (a: Point, b: Point) => boolean) {
  const cost = nodes.map(() => Infinity),
    previous = nodes.map(() => -1),
    visited = new Set<number>();
  cost[0] = 0;
  for (let step = 0; step < nodes.length; step++) {
    const next = cost
      .map((value, i) => ({ value, i }))
      .filter(({ i }) => !visited.has(i))
      .sort((a, b) => a.value - b.value)[0];
    if (!Number.isFinite(next.value)) break;
    visited.add(next.i);
    const reachable = [...nodes.entries()].filter(
      ([i, point]) => !visited.has(i) && !blocked(nodes[next.i], point),
    );
    for (const [i, point] of reachable) {
      const distance = next.value + routeCost(nodes[next.i], point, nodes[0], nodes[1]);
      if (distance >= cost[i]) continue;
      cost[i] = distance;
      previous[i] = next.i;
    }
  }
  return { cost, previous };
}

function routeCost(from: Point, to: Point, origin: Point, target: Point) {
  // Prefer opposite sides for opposing walkers. The small bias breaks
  // symmetric head-on detours without blocking the only available side.
  const side = Math.sign(target.x - origin.x);
  const detour = Math.max(0, ((from.lane + to.lane) / 2 - origin.lane) * side);
  return travelTime(from, to) * (1 + detour * 0.1);
}

/** At most four moving obstacles. Route around their ground footprints, not just the
 * first contact edge, so a cart worker can escape a cluster after combat. */
export function partyWaypoint(origin: Point, target: Point, blockers: Point[], gap: Point): Point {
  const blocked = (a: Point, b: Point) => blockers.some((p) => crosses(a, b, p, gap));
  if (!blocked(origin, target)) return target;
  const nodes = [origin, target, ...routeCorners(blockers, gap, target)];
  const { cost, previous } = shortestRoutes(nodes, blocked);
  // If the destination is still occupied, approach a reachable edge and wait
  // for that companion to leave. Do not walk into their reserved space.
  let end = Number.isFinite(cost[1])
    ? 1
    : (cost
        .map((value, i) => ({ i, score: travelTime(nodes[i], target) + value * 0.001 }))
        .filter(({ i, score }) => i > 1 && Number.isFinite(score))
        .sort((a, b) => a.score - b.score)
        .at(0)?.i ?? 0);
  while (previous[end] > 0) end = previous[end];
  return nodes[end];
}
