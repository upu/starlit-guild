import type { StageActor, StageExtra, StageItem } from "../story-stage-cues.ts";

export function receptionDisplayActor(actor: StageActor, items: StageItem[]): StageActor {
  const held = items.find((item) => item.actor === actor.id && !item.stored);
  if (actor.id === "finn") return finnCloth(actor, held);
  if (actor.id === "aria")
    return {
      ...actor,
      carry: !!held,
      wristPoints: { ...actor.wristPoints, 14: [86, 76], 15: [86, 76], 16: [86, 76] },
    };
  if (actor.id !== "leon") return actor;
  return {
    ...actor,
    carry: !!held,
    carryWalkFrames: [8, 9, 22, 23],
    wristPoints: {
      ...actor.wristPoints,
      14: [82, 72],
      15: [82, 72],
      16: [82, 72],
      8: [89, 70],
      9: [89, 70],
      22: [89, 70],
      23: [89, 70],
    },
  };
}

function clothPose(held: StageItem): StageActor["pose"] {
  if (held.art === "cart-drape") return "tease";
  return held.art === "light-cloth" ? "think" : "idle";
}

function finnCloth(actor: StageActor, held?: StageItem): StageActor {
  const pushing = actor.x === 67 && actor.bottom === 12;
  const point: [number, number] = pushing ? [97, 76] : [80, 74];
  return {
    ...actor,
    ...(pushing ? { x: 65.2, bottom: 4.5 } : {}),
    ...(actor.x === 44 && actor.bottom === 5 ? { x: 39.8 } : {}),
    nameAbove: (actor.x === 44 && actor.bottom === 5) || actor.nameAbove,
    carry: !!held || actor.carry,
    reachOver: held?.art === "cart-drape" ? "reception-cart" : undefined,
    pose: held ? clothPose(held) : actor.pose,
    carryWalkFrames: [8, 9, 22, 23],
    wristPoints: {
      ...actor.wristPoints,
      14: point,
      15: [85, 70],
      16: [98.5, 92],
      8: point,
      9: point,
      22: point,
      23: point,
    },
  };
}

export function receptionDisplayExtra(extra: StageExtra): StageExtra {
  return extra.id === "merchant"
    ? { ...extra, wristPoints: { 0: [68, 79], 1: [70, 79], 2: [69, 79], 3: [68, 79] } }
    : extra;
}
