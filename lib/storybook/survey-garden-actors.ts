import type { StageActor, StageExtra, StageItem } from "../story-stage-cues.ts";

export function surveyGardenActor(actor: StageActor, items: StageItem[]): StageActor {
  if (actor.id === "aria" && actor.x === 20 && actor.bottom === 54)
    return {
      ...actor,
      x: 14,
      bottom: 73,
      via: actor.via?.map((point) => (point.bottom === 44 ? { ...point, bottom: 58 } : point)),
    };
  if (actor.id === "mira" && actor.x === 69)
    return {
      ...actor,
      x: 71.5,
      packing: false,
      ...(actor.inspect ? { inspect: false, healing: "treat" } : {}),
    };
  if (actor.id !== "finn") return actor;
  return finnHands(actor, items);
}

function heldPose(actor: StageActor, returning: boolean, opening: boolean): StageActor["pose"] {
  if (actor.gloves) return actor.pose;
  if (returning) return "tease";
  return opening ? "think" : "idle";
}

function finnHands(actor: StageActor, items: StageItem[]): StageActor {
  const held = items.find((item) => item.actor === "finn" && !item.stored);
  const returning = actor.x === 67 && actor.bottom === 42;
  const opening =
    held?.art === "work-gloves" && items.find((item) => item.id === "case-key")?.bottom === 19;
  const showing = actor.x === 64 && actor.bottom === 10 && actor.pose === "offer";
  return {
    ...actor,
    ...(returning ? { x: 65.8, bottom: 41.4 } : {}),
    carry: !!held && !actor.gloves,
    pose: held ? heldPose(actor, returning, opening) : actor.pose,
    handAction: showing ? "wipe" : undefined,
    carryWalkFrames: [8, 9, 22, 23],
    wristPoints: {
      ...actor.wristPoints,
      14: [93, 63],
      15: [86, 72],
      16: [101, 67.5],
      8: [79, 75],
      9: [79, 75],
      22: [79, 75],
      23: [79, 75],
    },
  };
}

export function surveyGardenExtra(extra: StageExtra, items: StageItem[]): StageExtra {
  if (extra.id !== "worker") return extra;
  const receiving = items.some(
    (item) =>
      (item.art === "work-gloves" && item.bottom === 48.2) ||
      (item.id === "case-key" && item.bottom === 50.8),
  );
  return {
    ...extra,
    ...(receiving ? { pose: "explain" } : {}),
    wristPoints: {
      4: [49, 80],
      5: [49, 80],
      6: [49, 80],
      7: [49, 80],
      11: [49, 80],
      10: [32, 108],
      1: [39, 70],
    },
  };
}
