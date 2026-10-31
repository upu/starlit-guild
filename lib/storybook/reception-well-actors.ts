import type { StageActor, StageExtra, StageItem } from "../story-stage-cues.ts";

export function receptionWellActor(actor: StageActor, items: StageItem[]): StageActor {
  if (actor.id === "aria" && actor.inspect) return { ...actor, packing: true };
  if (actor.id === "finn")
    return {
      ...actor,
      x: actor.x - 1.8,
      bottom: (actor.bottom ?? 18) - 7.5,
      pose: actor.carry ? "idle" : actor.pose,
      via: actor.via?.map((point) => ({ x: point.x - 1.8, bottom: point.bottom - 7.5 })),
      carryWalkFrames: [8, 9, 22, 23],
      wristPoints: { 14: [97, 76], 8: [97, 76], 9: [97, 76], 22: [97, 76], 23: [97, 76] },
    };
  if (actor.id !== "leon") return actor;
  const bag = items.find(
    (item) => item.art === "tool-rucksack" && item.actor === "leon" && !item.behindOwner,
  );
  const map = items.some((item) => item.id === "garden-map" && !item.stored);
  return {
    ...actor,
    nameAbove: actor.bottom === 76 || actor.nameAbove,
    ...(actor.x === 84 && actor.bottom === 14 ? { x: 80 } : {}),
    ...(actor.inspect ? { packing: true, left: actor.x === 94 } : {}),
    carry: !!bag || map,
    carryWalkFrames: [8, 9, 22, 23],
    wristPoints: {
      14: [75, 73],
      15: [75, 73],
      16: [75, 73],
      8: [75, 73],
      9: [75, 73],
      22: [75, 73],
      23: [75, 73],
      6: [88, 108],
      7: [88, 108],
    },
  };
}

export function receptionWellExtra(extra: StageExtra): StageExtra {
  if (extra.id !== "cook") return extra;
  return {
    ...extra,
    left: true,
    ...(extra.x === 96 ? { bottom: 86, via: [{ x: 96, bottom: 82 }] } : {}),
    wristPoints: { 12: [71, 82], 11: [71, 82], 4: [71, 82], 5: [71, 82], 6: [71, 82], 7: [71, 82] },
  };
}
