import type { StageActor, StageExtra, StageItem } from "../story-stage-cues.ts";
import { SEEDLING_SCENE_CELL, SEEDLING_SCENE_SCALE } from "../seedling-scene-scale.ts";

export function seedlingActor(a: StageActor, items: StageItem[]): StageActor {
  if (a.id === "leon" && a.x === 45 && a.bottom === 4)
    return { ...a, nameAbove: true, nameOffset: 12 };
  if (a.id === "finn" && a.x === 41 && a.bottom === -15)
    return { ...a, nameAbove: true, nameOffset: 0 };
  if (a.id === "lico")
    return {
      ...a,
      nameOffset: -10,
      wristPoints: { ...a.wristPoints, 73: [96, 94] },
    };
  if (a.id !== "aria") return a;
  const cloth = items.some((i) => i.actor === "aria" && i.id === "damp-cloth");
  return {
    ...a,
    carry: cloth ? false : a.carry,
    wristPoints: {
      ...a.wristPoints,
      8: [79, 76],
      9: [79, 76],
      22: [79, 76],
      23: [79, 76],
      13: [78, 109],
      14: [79, 76],
      15: [79, 76],
      16: [79, 76],
    },
  };
}
const potSlots = [-2.2, 2.2, -1.4, 1.4];
function collectorPosition(e: StageExtra, items: StageItem[]) {
  const held = items.some((item) => item.id.startsWith("korotake-") && item.extra === "merrill");
  const slot = potSlots.find((value) => Math.abs(e.x - (78.25 + value)) < 0.001);
  return {
    x:
      held && slot !== undefined
        ? 76 + slot * SEEDLING_SCENE_SCALE - (15 * SEEDLING_SCENE_CELL) / 128
        : e.x - 4.4765625,
    bottom: 2.66015625,
  };
}
export function seedlingVisitor(e: StageExtra, items: StageItem[]): StageExtra {
  if (e.id !== "merrill") return e;
  return {
    ...e,
    ...(e.x === 73.125 ? { x: 71.90625, bottom: 13.32421875 } : {}),
    ...(e.seedlingAction === "collect" ? collectorPosition(e, items) : {}),
    ...(e.carry && !e.seedlingAction && e.x === 89 ? { x: 83 } : {}),
    walkFrames: [12, 13, 14, 15],
    seedlingAction: e.carry && !e.seedlingAction ? "pot" : e.seedlingAction,
    wristPoints: {
      ...e.wristPoints,
      0: [62, 86],
      1: [94, 72],
      2: [91, 62],
      3: [56, 50],
      6: [82, 74],
      7: [85, 73],
      8: [92, 73],
      9: [81, 84],
      10: [79, 113],
      11: [75, 83],
      12: [69, 88],
      13: [77, 83],
      14: [69, 88],
      15: [77, 82],
    },
  };
}
