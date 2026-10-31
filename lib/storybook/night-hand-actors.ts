import type { StageActor, StageItem } from "../story-stage-cues.ts";

export function nightHandActor(
  actor: StageActor,
  items: StageItem[],
  bridge: boolean,
  patting = false,
): StageActor {
  if (actor.id === "finn") return finnHands(actor, bridge);
  if (actor.id === "mira") return miraHands(actor, items, bridge, patting);
  if (actor.id !== "aria") return actor;
  return {
    ...actor,
    ...(actor.x === 94 ? { x: 90 } : {}),
    carryWalkFrames: [8, 9, 22, 23],
    wristPoints: {
      ...actor.wristPoints,
      14: [86, 76],
      15: [86, 76],
      16: [86, 76],
      8: [86, 76],
      9: [86, 76],
      22: [86, 76],
      23: [86, 76],
    },
  };
}

function finnHands(actor: StageActor, bridge: boolean): StageActor {
  return {
    ...actor,
    ...(bridge ? { bottom: 38.8 } : {}),
    left: false,
    wristPoints: {
      ...actor.wristPoints,
      17: [94, 85],
      18: [93, 82],
      19: [93, 82],
      20: [95, 79],
      32: [80, 80],
      33: [80, 80],
    },
  };
}

function miraHands(
  actor: StageActor,
  items: StageItem[],
  bridge: boolean,
  patting: boolean,
): StageActor {
  const holding = items.some(
    (item) => item.id === "palm-cloth" && item.actor === "mira" && !item.stored,
  );
  const checking = bridge && actor.x === 66;
  const approaching = !bridge && actor.x === 55;
  return {
    ...actor,
    ...(approaching ? { x: 54.4, bottom: 33.2 } : {}),
    ...(checking ? { x: patting ? 63.25 : 65.7, bottom: 37.2, visit: "touch" as const } : {}),
    carry: holding,
    wristPoints: { ...actor.wristPoints, 4: [94, 74], 14: [86, 73], 60: [86, 73] },
  };
}
