import type { StageActor, StageItem, StoryStageCue } from "../story-stage-cues.ts";

/** One body scale for field study, the held notebook walk and the low rest seats. */
export function mossBedsStudyCue(cue: StoryStageCue): StoryStageCue {
  const adjust = (s: Pick<StoryStageCue, "actors" | "items" | "extras">) => ({
    actors: s.actors.map((a) => bedActor(a, s.items ?? [])),
    items: (s.items ?? []).map(bedItem),
    extras: s.extras,
  });
  return {
    ...cue,
    ...adjust(cue),
    finishBeforeAdvance:
      !!cue.finishBeforeAdvance ||
      !!cue.sequence?.length ||
      cue.actors.some((a) => !!a.via?.length),
    sequence: cue.sequence?.map((s) => ({ ...s, ...adjust(s) })),
  };
}
function bedActor(a: StageActor, items: StageItem[]): StageActor {
  const holding = items.some((i) => i.actor === a.id);
  if (a.id === "lico")
    return {
      ...a,
      nameAbove: true,
      holdingWalk: holding,
      carryWalkFrames: [8, 9, 22, 23],
      wristPoints: {
        ...a.wristPoints,
        36: [82, 100],
        37: [82, 100],
        38: [82, 100],
        39: [82, 100],
        40: [82, 100],
        41: [82, 100],
        42: [82, 100],
        43: [82, 100],
      },
    };
  if (a.id === "mira")
    return {
      ...a,
      holdingWalk: holding,
      carryWalkFrames: [8, 9, 22, 23],
      mossCare: a.seated ? undefined : a.mossCare,
      nameAbove: !!a.seated,
      wristPoints: {
        ...a.wristPoints,
        8: [84, 77],
        9: [84, 77],
        22: [84, 77],
        23: [84, 77],
        68: [70, 83],
        69: [70, 83],
        70: [70, 83],
        71: [70, 83],
        36: [80, 95],
        37: [80, 95],
        38: [80, 95],
        39: [80, 95],
        40: [80, 95],
        41: [80, 95],
        42: [80, 95],
        43: [80, 95],
      },
    };
  return a.id === "aria" ? ariaHandover(a, holding) : a;
}
function ariaHandover(a: StageActor, holding: boolean): StageActor {
  const handover =
    a.x === 63.25
      ? { x: 63.0625, bottom: 2.15625 }
      : a.x === 86.1875
        ? { x: 86.1875, bottom: 6.65625 }
        : {};
  return {
    ...a,
    ...handover,
    holdingWalk: holding,
    carry: holding && a.x !== 63.25 && !a.inspect,
    wristPoints: { ...a.wristPoints, 14: [79, 76], 15: [79, 76], 16: [79, 76] },
    carryWalkFrames: [8, 9, 22, 23],
  };
}
function bedItem(i: StageItem): StageItem {
  if (i.id === "bed-rail-left") return { ...i, bottom: 49.4 };
  if (i.id === "lico-stool") return { ...i, seatFor: undefined };
  if (i.id === "ledger" && !i.actor) return { ...i, width: 3.2 };
  if (i.id === "ledger" && i.actor) return ledgerItem(i);
  if (i.id === "medicine" && i.actor)
    return {
      ...i,
      x: 0,
      bottom: 0,
      wrist: true,
      wristAnchor: "top",
      wristOffset: { x: 0, bottom: 2 },
      embeddedFrames: undefined,
    };
  return i;
}
function ledgerItem(i: StageItem): StageItem {
  return {
    ...i,
    width: 3.2,
    x: 0,
    bottom: 0,
    wrist: true,
    // These props use square cells, while the shared book target assumes a 1.3 ratio.
    wristOffset:
      i.actor === "aria" && i.x === -4
        ? { x: -4.8, bottom: 2.2 - 0.5538461538 }
        : { x: 0, bottom: -0.5538461538 },
    embeddedFrames:
      i.actor === "lico" ? [8, 9, 22, 23, 13, 68, 69, 70, 71, 72, 73, 74, 75] : undefined,
  };
}
