import { roadHeroSize, roadY } from "./road-layout.ts";
import type { Traveller } from "./road-view.ts";
import { partyWaypoint } from "./road-party-path.ts";

export type PartyPosition = { x: number; lane: number };
export type PartyObstacle = PartyPosition & {
  clearance?: PartyPosition;
  ignore?: Traveller["id"][];
};
export type PartyTarget = PartyPosition & {
  avoidInitial?: boolean;
  minLane?: number;
  maxLane?: number;
  id: Traveller["id"];
  facing: 1 | -1;
  fixed: boolean;
  anchored?: boolean;
  cartGrip?: boolean;
  avoidEscort?: boolean;
  wideLane?: boolean;
};
type Clearance = PartyPosition;

export function partyBlockers(
  positions: Map<string, PartyPosition>,
  target: PartyTarget,
  gap: Clearance,
  obstacles: PartyObstacle[],
) {
  return [
    ...[...positions]
      .filter(([id]) => id !== target.id)
      .map(([, p]) =>
        target.avoidEscort ? { ...p, clearance: { x: gap.x * 1.3, lane: gap.lane * 1.8 } } : p,
      ),
    ...obstacles.filter((obstacle) => !obstacle.ignore?.includes(target.id)),
  ];
}

// Screen-normalized x matches RoadMotion's continuity cache. Include the HP bar
// below the boots so a back-row bar cannot cover the next character's face.
export function partyClearance(width: number, height: number): Clearance {
  const size = roadHeroSize(width, height);
  return {
    x: ((size * 0.64 + 3) / width) * 560,
    lane: (size * 0.9 + 12) / (roadY(1, height, width) - roadY(0, height, width)),
  };
}

// Walking actors may pass behind each other. Reserve their ground footprint,
// while the larger clearance above keeps settled faces and HP bars readable.
export function partyFootClearance(width: number, height: number): Clearance {
  const size = roadHeroSize(width, height);
  return {
    x: ((size * 0.45 + 3) / width) * 560,
    lane: (size * 0.22 + 3) / (roadY(1, height, width) - roadY(0, height, width)),
  };
}

export function partyOverlap(a: PartyPosition, b: PartyObstacle, fallback: Clearance) {
  const gap = b.clearance ?? fallback;
  return Math.abs(a.x - b.x) < gap.x - 0.001 && Math.abs(a.lane - b.lane) < gap.lane - 0.00001;
}

export function spacedPartyTargets(targets: PartyTarget[], gap: Clearance) {
  const priority = ["leon", "finn", "aria", "mira", "lico"];
  const ordered = targets.toSorted(
    (a, b) =>
      Number(!!b.anchored) - Number(!!a.anchored) ||
      Number(b.fixed) - Number(a.fixed) ||
      priority.indexOf(a.id) - priority.indexOf(b.id),
  );
  const placed: PartyTarget[] = [];
  for (const target of ordered) {
    placed.push(freeTarget(target, targets, placed, gap));
  }
  return placed;
}

function freeTarget(
  target: PartyTarget,
  targets: PartyTarget[],
  placed: PartyTarget[],
  gap: Clearance,
) {
  const margin = gap.x / 2;
  const base = { ...target, x: Math.max(margin, Math.min(560 - margin, target.x)) };
  const front =
    target.facing > 0 ? Math.max(...targets.map((t) => t.x)) : Math.min(...targets.map((t) => t.x));
  // Support characters may use an adjacent row, but not move past the front
  // fighter toward an enemy merely to make space.
  return (
    targetCandidates(base, targets.length, gap, placed)
      .filter(({ p }) => inRoad(p, gap) && (p.x - front) * target.facing <= 0.001)
      .filter(({ p }) => !placed.some((other) => partyOverlap(p, other, gap)))
      .sort((a, b) => a.cost - b.cost)[0]?.p ?? base
  );
}

function inRoad(
  p: PartyPosition & { wideLane?: boolean; minLane?: number; maxLane?: number },
  gap: Clearance,
) {
  return (
    p.x >= gap.x / 2 &&
    p.x <= 560 - gap.x / 2 &&
    (p.wideLane || (p.lane >= (p.minLane ?? 0.1) && p.lane <= (p.maxLane ?? 1.3)))
  );
}

function targetCandidates(base: PartyTarget, count: number, gap: Clearance, placed: PartyTarget[]) {
  const candidates = [];
  // Include the actual edges of occupied spaces. A grid anchored to each
  // character can miss an empty slot between companions after a resize.
  const xs = [
    ...Array.from({ length: count * 2 + 1 }, (_, i) => base.x + (i - count) * gap.x),
    ...placed.flatMap((p) => [p.x - gap.x, p.x + gap.x]),
  ];
  const lanes = [
    ...[-2, -1, 0, 1, 2].map((row) => base.lane + row * gap.lane),
    ...placed.flatMap((p) => [p.lane - gap.lane, p.lane + gap.lane]),
  ];
  for (const lane of lanes)
    for (const x of xs) {
      const p = {
        ...base,
        x: Math.max(gap.x / 2, Math.min(560 - gap.x / 2, x)),
        // Narrow viewports have fewer ground rows. Also try the road edges:
        // a full row step can overshoot a usable edge and falsely report no room.
        lane: base.wideLane
          ? lane
          : Math.max(base.minLane ?? 0.1, Math.min(base.maxLane ?? 1.3, lane)),
      };
      const rowDistance = Math.abs(p.lane - base.lane) / gap.lane;
      const columnDistance = Math.abs(p.x - base.x) / gap.x;
      const forward = (p.x - base.x) * base.facing > 0 ? 1 : 0;
      candidates.push({ p, cost: columnDistance + rowDistance * 1.8 + forward });
    }
  return candidates;
}

function overlapArea(p: PartyPosition, blockers: PartyObstacle[], gap: Clearance) {
  return blockers.reduce(
    (sum, other) =>
      sum +
      Math.max(0, 1 - Math.abs(p.x - other.x) / (other.clearance ?? gap).x) *
        Math.max(0, 1 - Math.abs(p.lane - other.lane) / (other.clearance ?? gap).lane),
    0,
  );
}

// A viewport change can enlarge the clearance around existing positions.
// Walk out of that overlap instead of freezing or snapping to the new layout.
function separateStep(
  origin: PartyPosition,
  wanted: PartyPosition,
  blockers: PartyObstacle[],
  gap: Clearance,
  dt: number,
  target: PartyTarget,
) {
  const candidates = [wanted, origin];
  for (const sign of [-1, 1]) {
    candidates.push({ ...origin, x: origin.x + sign * 280 * dt });
    candidates.push({ ...origin, lane: origin.lane + sign * 0.9 * dt });
  }
  const clear = blockers.filter((b) => !partyOverlap(origin, b, gap));
  return (
    candidates
      .filter(
        (p) =>
          inRoad(
            { ...p, wideLane: target.wideLane, minLane: target.minLane, maxLane: target.maxLane },
            gap,
          ) && !clear.some((b) => partyOverlap(p, b, gap)),
      )
      .sort((a, b) => overlapArea(a, blockers, gap) - overlapArea(b, blockers, gap))[0] ?? origin
  );
}

/** Slide around a teammate instead of interpolating straight through them. */
export function avoidPartyStep(
  origin: PartyPosition,
  wanted: PartyPosition,
  target: PartyTarget,
  blockers: PartyObstacle[],
  gap: Clearance,
  dt: number,
) {
  if (blockers.some((blocker) => partyOverlap(origin, blocker, gap)))
    return separateStep(origin, wanted, blockers, gap, dt, target);
  const waypoint = partyWaypoint(origin, target, blockers, gap);
  const dx = waypoint.x - origin.x,
    dy = waypoint.lane - origin.lane;
  const duration = Math.max(Math.abs(dx) / 280, Math.abs(dy) / 0.9, 0.001);
  const fraction = Math.min(1 - Math.exp(-dt / 0.1), dt / duration);
  const next = { x: origin.x + dx * fraction, lane: origin.lane + dy * fraction };
  return blockers.some((blocker) => partyOverlap(next, blocker, gap)) ? origin : next;
}
