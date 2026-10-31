import type { StageActor, StageExtra, StageItem, StoryStageCue } from "../story-stage-cues.ts";

export function mossTrailStudyCue(cue: StoryStageCue): StoryStageCue {
  const foyer = cue.background === "brekka-foyer";
  const adjust = (s: Pick<StoryStageCue, "actors" | "items" | "extras">) => ({
    actors: s.actors.map((a) =>
      foyer
        ? tiredActor(a)
        : a.id === "leon" && a.pose === "greet"
          ? { ...a, pose: "offer" as const }
          : a,
    ),
    extras: s.extras?.map(cartDriver),
    items: foyer
      ? foyerItems(s.items ?? [])
      : (s.items ?? []).map((item) => scaledTrailItem(item, 36)),
  });
  return {
    ...cue,
    ...adjust(cue),
    cell: foyer ? cue.cell : (cue.cell ?? 24) * 0.75,
    finishBeforeAdvance: !!cue.sequence?.length || !foyer,
    sequence: cue.sequence?.map((s) => ({ ...s, ...adjust(s) })),
  };
}

export function scaledTrailItem(item: StageItem, bottom: number): StageItem {
  const value = cartItem(item);
  if (value.art === "basket-cart")
    return {
      ...value,
      x: value.x * 0.75,
      bottom: bottom + (value.bottom - bottom) * 0.75,
      width: 21,
    };
  if (value.art === "cart-wheel" || value.id === "wheel-moss")
    return {
      ...value,
      x: value.carrier ? value.x * 0.75 : value.x,
      bottom: value.carrier ? value.bottom * 0.75 : value.bottom,
      width: (value.width ?? 0) * 0.75,
    };
  return value;
}
function tiredActor(a: StageActor): StageActor {
  return a.id === "mira"
    ? {
        ...a,
        wristPoints: { ...a.wristPoints, 64: [85, 93], 65: [85, 93], 66: [85, 93], 67: [85, 93] },
      }
    : a;
}
function foyerItems(items: StageItem[]): StageItem[] {
  return [
    ...items,
    {
      id: "night-visit-bag",
      art: "medicine-closed",
      actor: "mira",
      x: 0,
      bottom: 0,
      width: 6,
      wrist: true,
      wristAnchor: "top",
      wristOffset: { x: 0, bottom: 2 },
    },
    {
      id: "night-visit-note",
      art: "folded-paper",
      carrier: "night-visit-bag",
      x: 0,
      bottom: 8,
      width: 2.5,
      pitch: 55,
    },
  ];
}
export function cartDriver(e: StageExtra): StageExtra {
  if (!e.pullCart) return e;
  return {
    ...e,
    wristPoints: { ...e.wristPoints, 20: [92, 80], 21: [92, 80], 22: [96, 80], 23: [96, 80] },
  };
}
export function cartItem(i: StageItem): StageItem {
  if (i.art === "basket-cart") return { ...i, x: -16.4, bottom: i.bottom - 1.2, width: 28 };
  if (i.art === "cart-wheel") return { ...i, x: -8.2, bottom: 5.32, width: 11.5 };
  if (i.id === "wheel-moss" && i.carrier) return { ...i, x: -8.2, bottom: 10 };
  return i;
}
