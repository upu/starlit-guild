import type { StageActor, StageItem, StageExtra } from "../story-stage-cues.ts";
export function lindeActor(a: StageActor, items: StageItem[]): StageActor {
  a = lindePosition(a);
  const held = items.find((i) => i.actor === a.id && !i.stored);
  const seatedPoint: Record<string, [number, number]> = {
    aria: [82, 76],
    leon: [94, 67],
    mira: [87, 83],
    finn: [98, 81],
  };
  const point = seatedPoint[a.id] ?? [86, 80];
  return {
    ...a,
    carry: !a.seated && !!held,
    carryWalkFrames: [8, 9, 22, 23],
    wristPoints: {
      ...a.wristPoints,
      24: point,
      25: point,
      26: point,
      27: point,
      28: point,
      29: point,
      30: point,
      31: point,
      14: [86, 73],
      15: [86, 73],
      8: [84, 77],
      9: [84, 77],
      22: [84, 77],
      23: [84, 77],
    },
  };
}
function lindePosition(a: StageActor): StageActor {
  if (a.id === "aria" && a.x === 30 && a.bottom === 12) return { ...a, bottom: 24 };
  if (a.id === "finn" && a.x === 60 && a.bottom === 25) return { ...a, bottom: 29 };
  if (a.id !== "mira") return a;
  if (a.x === 40 && a.bottom === 25) return { ...a, bottom: 35 };
  return a.x === 29
    ? {
        ...a,
        x: 20,
        left: false,
        via: a.healing === "treat" ? [{ x: 20, bottom: 35 }] : undefined,
      }
    : a;
}
export function lindeExtra(e: StageExtra, items: StageItem[]): StageExtra {
  const plateHeld = items.some((i) => i.id === "cleared-plate" && i.extra === "merchant");
  const pickingPlate =
    e.service === "place" && items.some((i) => i.id === "town-request" && i.x === 34);
  return e.id === "merchant"
    ? {
        ...e,
        ...(e.x === 73 ? { x: 69, bottom: 22 } : {}),
        ...(plateHeld || pickingPlate ? { x: 76, bottom: 20 } : {}),
        wristPoints: {
          ...e.wristPoints,
          0: [35, 80],
          1: [35, 75],
          12: [35, 75],
          13: [33, 94],
          14: [36, 52],
          15: [35, 75],
          8: [35, 75],
          9: [35, 75],
          10: [35, 75],
          11: [35, 75],
        },
      }
    : e;
}
