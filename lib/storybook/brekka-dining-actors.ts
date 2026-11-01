import type { StageActor, StageExtra, StageItem } from "../story-stage-cues.ts";
export function brekkaDiner(a: StageActor): StageActor {
  const hand =
    hands[a.id] ??
    ([
      [71, 83],
      [76, 58],
      [101, 68],
    ] as [number, number][]);
  return {
    ...a,
    nameOffset: a.id === "aria" ? -12 : a.id === "leon" ? 12 : a.nameOffset,
    ...leavingDiner(a),
    ...(a.id === "aria" && a.x === 53.5 ? { x: 56 } : {}),
    ...(a.id === "leon" && a.x === 66.5 ? { x: 63.4 } : {}),
    ...(a.seated ? { bottom: seatBottom[a.id] ?? a.bottom } : {}),
    carry: false,
    wristPoints: { ...a.wristPoints, 56: hand[0], 57: hand[1], 58: hand[2] },
  };
}
function leavingDiner(a: StageActor): Partial<StageActor> {
  if (a.seated) return {};
  if (a.id === "mira" && a.x === 29) return { x: 22, bottom: 10 };
  if (a.id === "finn" && a.x === 90) return { x: 100, bottom: 8 };
  if (a.bottom !== 0) return {};
  const side = a.id === "aria" ? 33 : 89;
  const x = a.id === "aria" ? 56 : 63.4;
  return {
    via: [
      { x, bottom: 40 },
      { x: side, bottom: 40 },
      { x: side, bottom: 0 },
    ],
  };
}
export const seatBottom: Partial<Record<string, number>> = {
  aria: 30,
  leon: 30,
  mira: 24,
  finn: 23,
};
const hands: Partial<Record<string, [number, number][]>> = {
  aria: [
    [59, 86],
    [61, 65],
    [81, 72],
  ],
  leon: [
    [59, 75],
    [61, 65],
    [83, 70],
  ],
  mira: [
    [63, 82],
    [58, 76],
    [79, 86],
  ],
  finn: [
    [67, 87],
    [71, 77],
    [85, 81],
  ],
};
export function brekkaServer(e: StageExtra, items: StageItem[]): StageExtra {
  if (e.id === "worker") return { ...e, wristPoints: { 16: [51, 75], 17: [54, 70], 18: [37, 81] } };
  const tray = items.some((i) => i.id === "fruit-tray" && i.extra === "merchant");
  return {
    ...e,
    ...(e.x === 80 ? { x: 77.5, bottom: 12.4, left: true, service: "talk" } : {}),
    ...(e.x === 48 ? { x: 46, bottom: 30 } : {}),
    ...(e.x === 81 ? { x: 75, bottom: 20, left: true, service: "talk" } : {}),
    ...(e.via?.[0]?.x === 80
      ? {
          via: [
            { x: 89, bottom: 12.4 },
            { x: 89, bottom: 44 },
          ],
        }
      : {}),
    ...(tray && e.service === "carry" ? { service: "raise" } : {}),
    wristPoints: {
      ...e.wristPoints,
      12: [53, 70],
      13: [33, 94],
      14: [40, 78],
      15: [53, 70],
      8: [35, 75],
      9: [35, 75],
      10: [35, 75],
      11: [35, 75],
    },
  };
}
