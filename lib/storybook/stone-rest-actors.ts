import type { StageActor, StageItem } from "../story-stage-cues.ts";

function finnHands(actor: StageActor, held?: StageItem): StageActor {
  const chair = held?.art === "chair";
  const point: [number, number] = chair ? [75, 60] : [79, 75];
  return {
    ...actor,
    x:
      actor.x === 36 && actor.bottom === 60
        ? 33.8
        : actor.x === 66 && actor.bottom === 44
          ? 67.8
          : actor.x,
    wristPoints: {
      ...actor.wristPoints,
      14: point,
      15: point,
      16: point,
      8: point,
      9: point,
      22: point,
      23: point,
    },
  };
}

export function stoneRestActor(actor: StageActor, items: StageItem[]): StageActor {
  const held = items.find((item) => item.actor === actor.id && !item.stored);
  actor = {
    ...actor,
    carry: !!held && !actor.seated && !actor.inspect && !actor.healing,
    carryWalkFrames: [8, 9, 22, 23],
  };
  if (actor.id === "finn") return finnHands(actor, held);
  if (actor.id === "mira")
    return {
      ...actor,
      wristPoints: {
        ...actor.wristPoints,
        24: [73, 88],
        25: [88, 83],
        26: [73, 88],
        27: [73, 88],
        28: [73, 88],
        29: [88, 83],
        30: [73, 88],
        31: [73, 88],
        46: [71, 95],
        47: [71, 95],
      },
    };
  if (actor.id === "leon" && held?.art === "kettle")
    return {
      ...actor,
      wristPoints: {
        ...actor.wristPoints,
        14: [75, 73],
        15: [75, 73],
        16: [75, 73],
        8: [75, 73],
        9: [75, 73],
        22: [75, 73],
        23: [75, 73],
        13: [88, 98],
      },
    };
  if (actor.id !== "aria") return actor;
  return {
    ...actor,
    x: actor.x === 34.6 ? 33.4375 : actor.x,
    ...(actor.x === 36 && actor.bottom === 25 ? { bottom: 23 } : {}),
    wristPoints: { ...actor.wristPoints, 13: [89, 112], 4: [86, 76] },
  };
}
