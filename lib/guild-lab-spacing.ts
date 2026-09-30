import { labCharacters } from "./guild-lab-characters.ts";
import { LAB_ACTOR_SCALE, labStations, type LabMode, type Point } from "./guild-lab-model.ts";

// Leave at least 1.2 painted head widths between feet, including in transit.
export const LAB_PAIR_MIN_DISTANCE = Math.ceil(
  Math.max(
    ...Object.values(labCharacters).map(
      ({ art }) =>
        (art.frames[0][2] / art.frames[0][3]) * art.head.displayHeight * LAB_ACTOR_SCALE * 1.2,
    ),
  ),
);

export function labPairDestination(
  mode: LabMode,
  index: number,
  request: number,
  right: boolean,
): Point {
  const walkingX = right ? [656, 580] : [112, 188];
  const targets: Record<LabMode, readonly Point[]> = {
    tea: [labStations.tea, labStations.ariaTea],
    work: [labStations.work, { x: 420, y: 228 }],
    detour:
      request % 2
        ? [{ x: 412, y: 260 }, labStations.ariaDetour]
        : [labStations.tea, { x: 174, y: 198 }],
    walk: [
      { x: walkingX[0], y: 416 },
      { x: walkingX[1], y: 448 },
    ],
  };
  return targets[mode][index];
}

export function labKeepDistance<T extends Point & { moving: boolean }>(
  positions: readonly [T, T],
): [T, T] {
  const [a, b] = positions;
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const distance = Math.hypot(dx, dy);
  if (distance >= LAB_PAIR_MIN_DISTANCE) return [{ ...a }, { ...b }];
  const nx = distance > 0.001 ? dx / distance : 1;
  const ny = distance > 0.001 ? dy / distance : 0;
  const correction = LAB_PAIR_MIN_DISTANCE - distance;
  // An actor already waiting at a station stays there. Two moving actors share
  // the clearance. Separate aisle routes make this a small corner correction.
  const share = a.moving && !b.moving ? 1 : !a.moving && b.moving ? 0 : 0.5;
  return [
    { ...a, x: a.x - nx * correction * share, y: a.y - ny * correction * share },
    { ...b, x: b.x + nx * correction * (1 - share), y: b.y + ny * correction * (1 - share) },
  ];
}
