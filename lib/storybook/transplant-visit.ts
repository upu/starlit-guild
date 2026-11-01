import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";

type State = Pick<StoryStageCue, "actors" | "items" | "extras">;
export function transplantVisitState(s: State, outside: boolean): State {
  return {
    ...s,
    actors: s.actors.map((a) => visitActor(a, outside)),
    items: outside
      ? (s.items ?? []).map((i) => ({
          ...i,
          x: 0,
          bottom: 0,
          wrist: true,
          wristAnchor: "top",
          width: 6.4,
          wristOffset: { x: 0, bottom: 2 },
        }))
      : roomItems(),
    extras: s.extras?.map((e) =>
      outside
        ? { ...e, x: 76, bottom: 46, wristPoints: { ...e.wristPoints } }
        : e.id === "keeper"
          ? { ...e, x: 67, bottom: 16, chair: true, left: true }
          : { ...e, x: 78, bottom: 35, notebook: true },
    ),
  };
}
function visitActor(a: StageActor, outside: boolean): StageActor {
  return {
    ...a,
    x: outside ? 55 : 35.5,
    bottom: outside ? 19 : 17,
    left: false,
    mossCare: outside ? a.mossCare : undefined,
    via: undefined,
    nameAbove: outside,
    holdingWalk: outside,
    wristPoints: { ...a.wristPoints, 68: [70, 83] },
  };
}
function roomItems(): StageItem[] {
  return [
    { id: "visit-table", art: "dining-table", x: 52, bottom: 14, width: 30 },
    { id: "patient-tea", art: "teacup", x: 57.9, bottom: 23.8, width: 2.8, support: "visit-table" },
    { id: "visit-bag", art: "medicine-closed", x: 30, bottom: 12, width: 6 },
    { id: "patient-chair", art: "chair", x: 69, bottom: 18, width: 8.5, left: true },
  ];
}
