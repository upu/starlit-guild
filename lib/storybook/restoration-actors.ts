import type { StageActor, StageExtra } from "../story-stage-cues.ts";
export function restorationActor(a: StageActor): StageActor {
  const paper = a.id === "leon" && a.pose === "offer";
  return {
    ...a,
    ...(a.id === "finn" && a.pose === "greet" ? { left: true } : {}),
    ...(a.id === "finn" && a.x === 66 ? { x: 20, bottom: 12, via: [{ x: 12, bottom: 12 }] } : {}),
    packing: a.id === "aria" && a.inspect ? true : a.packing,
    carry: paper || a.carry,
    carryWalkFrames: [8, 9, 22, 23],
    wristPoints: {
      ...a.wristPoints,
      14: [82, 72],
      15: [82, 72],
      16: [82, 72],
      8: [89, 70],
      9: [89, 70],
      22: [89, 70],
      23: [89, 70],
      18: [93, 82],
      20: [95, 79],
      1: [55, 89],
      4: a.id === "finn" ? [80, 74] : [86, 76],
    },
  };
}
export function restorationExtra(e: StageExtra): StageExtra {
  if (e.id === "keeper") return keeperExtra(e);
  if (e.id === "stone-carrier") return cartExtra(e);
  if (e.id === "fence-carrier") return { ...e, left: false };
  return e;
}
function keeperExtra(e: StageExtra): StageExtra {
  return {
    ...e,
    ...(e.x === 74
      ? { x: 75.2, bottom: 14.2, via: e.via ? [{ x: 70, bottom: 13.5 }] : undefined }
      : {}),
    wristPoints: {
      ...e.wristPoints,
      12: [29, 110],
      13: [29, 110],
      14: [42, 73],
      15: [30, 76],
      8: [74, 82],
      9: [74, 82],
      10: [74, 82],
      11: [74, 82],
    },
  };
}
function cartExtra(e: StageExtra): StageExtra {
  return {
    ...e,
    left: false,
    bottom: e.x === 85 ? -18 : -14,
    ...(e.x === 96 ? { x: 106 } : {}),
    ...(e.x === 85
      ? {
          x: -15,
          via: [
            { x: 96, bottom: -18 },
            { x: 66, bottom: -18 },
            { x: 20, bottom: -18 },
          ],
        }
      : {}),
    wristPoints: { 0: [40, 75], 1: [40, 75], 2: [40, 75], 3: [40, 75] },
  };
}
