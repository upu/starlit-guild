import type { StageActor, StageExtra, StageItem, StoryStageCue } from "../story-stage-cues.ts";
type State = Pick<StoryStageCue, "actors" | "items" | "extras">;
export function transplantTowerState(s: State): State {
  return {
    ...s,
    actors: s.actors.map(towerActor),
    extras: s.extras?.map(towerExtra),
    items: (s.items ?? []).map(towerItem),
  };
}
function towerActor(a: StageActor): StageActor {
  if (a.id === "mira") return { ...a, x: 48, bottom: 36 };
  if (a.id === "aria") return { ...a, x: 64, bottom: 65 };
  if (a.id === "leon")
    return {
      ...a,
      x: a.x === 66.1328125 ? 66.5 : a.x,
      bottom: a.x === 66.1328125 ? 36 : a.bottom,
      carry: a.x === 66.1328125 ? true : a.carry,
      via: a.via?.map((p) => ({ ...p, x: 66.5 })),
      wristPoints: { ...a.wristPoints, 16: [82, 76], 14: [82, 76], 15: [82, 76] },
    };
  return a;
}
function towerExtra(e: StageExtra): StageExtra {
  if (e.id === "keeper") return { ...e, x: 26, bottom: 48 };
  if (e.id !== "worker") return e;
  const at = e.inspect
    ? e.x === 74
      ? { x: 82.75, bottom: 64 }
      : { x: 77.484375, bottom: 42.6796875 }
    : { x: 73.921875, bottom: 36.22265625 };
  return {
    ...e,
    ...at,
    left: false,
    walkFrames: [4, 5, 6, 7],
    wristPoints: {
      ...e.wristPoints,
      1: [32, 77],
      10: [37, 114],
      11: [61, 85],
      4: [61, 85],
      5: [61, 85],
      6: [61, 85],
      7: [61, 85],
    },
  };
}
function towerItem(i: StageItem): StageItem {
  if (i.id === "tower-basket")
    return i.wrist
      ? { ...i, x: 0, bottom: 0, width: 6, wristOffset: { x: 0, bottom: -1.0384615385 } }
      : { ...i, x: 73.4765625, bottom: 41.296875, width: 6 };
  return i.id === "peeled-moss" ? peeledMoss(i) : i;
}
function peeledMoss(i: StageItem): StageItem {
  return {
    ...i,
    width: 2.2,
    ...(!i.wrist && !i.carrier ? { x: 78.7421875, bottom: 67.1171875 } : {}),
    ...(i.wrist ? { x: 0, bottom: 0, wristAnchor: "bottom", wristOffset: undefined } : {}),
    ...(i.carrier ? { x: 0, bottom: 2.5 } : {}),
  };
}
