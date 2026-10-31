import {
  partyOverlap,
  type PartyObstacle,
  type PartyPosition,
  type PartyTarget,
} from "./road-party-spacing.ts";

/** A battle preview can start without a previous transport frame to walk from. */
export function brekkaInitialPosition(
  target: PartyTarget,
  obstacles: PartyObstacle[],
  gap: PartyPosition,
) {
  if (!target.avoidInitial || !obstacles.some((item) => partyOverlap(target, item, gap)))
    return target;
  const xs = [
    target.x,
    ...obstacles.flatMap((o) => [o.x - (o.clearance?.x ?? gap.x), o.x + (o.clearance?.x ?? gap.x)]),
  ];
  const lanes = [
    target.lane,
    ...obstacles.flatMap((o) => [
      o.lane - (o.clearance?.lane ?? gap.lane),
      o.lane + (o.clearance?.lane ?? gap.lane),
    ]),
  ];
  return (
    xs
      .flatMap((x) => lanes.map((lane) => ({ x, lane })))
      .filter((p) => p.x >= gap.x / 2 && p.x <= 560 - gap.x / 2 && p.lane >= 0.1 && p.lane <= 1.3)
      .filter((p) => !obstacles.some((item) => partyOverlap(p, item, gap)))
      .sort((a, b) => distance(a, target, gap) - distance(b, target, gap))[0] ?? target
  );
}

function distance(a: PartyPosition, b: PartyPosition, gap: PartyPosition) {
  return Math.abs(a.x - b.x) / gap.x + Math.abs(a.lane - b.lane) / gap.lane;
}
