import type { StageActor, StageExtra, StageItem, StoryStageCue } from "../story-stage-cues.ts";

export function householdActor(a: StageActor, indoor: boolean): StageActor {
  if (indoor && a.id === "aria" && a.x === 24) return { ...a, x: 35, bottom: 32, carry: true };
  if (indoor && a.id === "leon" && (a.x === 34 || a.x === 40)) return { ...a, x: 52, left: true };
  if (indoor && a.id === "leon" && a.via)
    return {
      ...a,
      via: [
        { x: 60, bottom: 32 },
        { x: 60, bottom: 12 },
      ],
    };
  if (a.id !== "mira") return a;
  return {
    ...a,
    ...(indoor && a.x === 79 ? { x: 69, bottom: 63 } : {}),
    wristPoints: { ...a.wristPoints, 13: [84, 111], 46: [77, 99] },
  };
}

export function householdStart(cue: StoryStageCue, indoor: boolean) {
  const cast = cue.actors.map((a) =>
    householdActor(
      { ...a, x: cue.initial?.[a.id] ?? a.x, bottom: cue.initialBottom?.[a.id] ?? a.bottom },
      indoor,
    ),
  );
  return {
    initial: Object.fromEntries(cast.map((a) => [a.id, a.x])),
    initialBottom: Object.fromEntries(cast.map((a) => [a.id, a.bottom ?? 14])),
  };
}

export function householdExtras(extras?: StageExtra[]) {
  return extras?.map((e): StageExtra => {
    if (e.id === "child") return { ...e, x: 80, bottom: 40 };
    if (e.id === "parent" && e.x === 97)
      return {
        ...e,
        x: 99,
        bottom: 40,
        via: e.via && [
          { x: 18, bottom: 18 },
          { x: 99, bottom: 18 },
        ],
      };
    if (e.id === "cook")
      return { ...e, grip: "reach", wristPoints: { ...e.wristPoints, 8: [37, 76] } };
    return e;
  });
}

export function householdItem(i: StageItem, indoor: boolean): StageItem {
  if (i.id === "medicine" && i.actor)
    return {
      ...i,
      x: 0,
      bottom: 0,
      wrist: true,
      wristAnchor: "bottom",
      wristOffset: { x: indoor ? 5.05 : 0, bottom: -6.5 },
      support: "table",
    };
  if (i.id === "chair-mira")
    return { ...i, x: 67.5, bottom: 64.96875, width: 8.5, seatFor: undefined };
  if (i.art === "water-bucket")
    return {
      ...i,
      width: 5,
      x: 0,
      bottom: 0,
      wrist: true,
      wristAnchor: "top",
      wristOffset: { x: 0, bottom: 0.6 },
      steaming: true,
    };
  return householdSupplies(i);
}

function householdSupplies(i: StageItem): StageItem {
  if (i.art === "honey-bag" && !i.actor) return { ...i, x: 63, bottom: 63, width: 6 };
  if (i.art === "honey-bag" && i.actor)
    return { ...i, width: 6, x: -3, bottom: 20.5, behindOwner: true };
  if (i.art === "honey") return { ...i, width: 3 };
  if (i.id === "loot-cloth") return { ...i, width: 5 };
  if (i.art === "folded-paper" && i.actor)
    return { ...i, x: 0, bottom: 0, wrist: true, wristAnchor: "bottom", width: 4 };
  return i;
}
