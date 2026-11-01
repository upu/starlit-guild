import type { StageItem } from "../story-stage-cues.ts";
export function brekkaDiningItem(i: StageItem, rightServer = false): StageItem {
  if (i.id === "fruit-tray" && i.x === 94 && !i.extra) return i;
  if (i.art === "chair") return chair(i);
  if (i.actor || i.extra) return held(i, rightServer);
  const p = tablePoints[i.id];
  return p
    ? { ...i, x: p[0], bottom: p[1], ...(i.art === "serving-tray" ? { pitch: 35 } : {}) }
    : i;
}
function chair(i: StageItem): StageItem {
  const shift: Record<string, number> = {
    "chair-aria": 20,
    "chair-leon": 20,
    "chair-mira": 6,
    "chair-finn": 9,
  };
  return {
    ...i,
    width: 8.5,
    seatFor: undefined,
    x:
      i.x +
      (i.left ? 1.5 : -1.5) +
      (i.id === "chair-aria" ? 2.5 : i.id === "chair-leon" ? -3.1 : 0),
    bottom: i.bottom + (shift[i.id] ?? 0),
  };
}
function held(i: StageItem, rightServer: boolean): StageItem {
  const jug = i.art === "ale-jug";
  return {
    ...i,
    x: 0,
    bottom: 0,
    wrist: true,
    wristAnchor: "bottom",
    ...(jug ? { width: 4.3, wristOffset: { x: -1.7, bottom: -3.5 } } : {}),
    ...(jug && rightServer ? { left: true, tilt: -(i.tilt ?? 0) } : {}),
    ...(["fruit-glass", "ale-cup-full", "ale-cup-empty"].includes(i.art)
      ? { wristOffset: { x: 0, bottom: -1.2 } }
      : {}),
  };
}
const tablePoints: Partial<Record<string, [number, number]>> = {
  "mira-ale": [40.5, 35.8],
  "finn-ale": [79.3, 25.5],
  "fruit-tray": [60, 32.5],
  "bread-plate": [43, 29.5],
  "mira-bread": [41.5, 30.3],
  "worker-lunch": [14, 29],
  "worker-cup": [10, 29],
};
