import type { StageActor, StageItem, StageMoment, StoryStageCue } from "../story-stage-cues.ts";

/** The room, props and palms share one registration; routes stay clear of the table. */
export function brekkaVisitStudyCue(cue: StoryStageCue): StoryStageCue {
  const outside = cue.background === "brekka-homes";
  const adjust = (s: Pick<StoryStageCue, "actors" | "items" | "extras">) => ({
    actors: s.actors.map((a) =>
      visitActor(
        a,
        outside,
        !!s.items?.some((i) => i.id === "patient-tea" && i.x === 60.2 && !i.actor),
      ),
    ),
    items: [
      ...(s.items ?? []).map(visitItem),
      ...(!outside
        ? [
            {
              id: "patient-chair",
              art: "chair" as const,
              x: 69,
              bottom: 18,
              width: 8.5,
              left: true,
            },
          ]
        : []),
    ],
    extras: s.extras,
  });
  return {
    ...cue,
    ...adjust(cue),
    finishBeforeAdvance: !!cue.sequence?.length || cue.actors.some((a) => !!a.via?.length),
    sequence: bagPlacement(teaPlacement(cue.sequence?.map((s) => ({ ...s, ...adjust(s) })))),
  };
}

function visitActor(a: StageActor, outside: boolean, near: boolean): StageActor {
  if (a.id !== "mira") return a;
  if (outside)
    return {
      ...a,
      carryWalkFrames: [8, 9, 22, 23],
      wristPoints: {
        ...a.wristPoints,
        14: [86, 73],
        15: [86, 73],
        8: [84, 77],
        9: [84, 77],
        22: [84, 77],
        23: [84, 77],
        13: [84, 111],
        46: [77, 99],
      },
    };
  return {
    ...a,
    carry: false,
    ...(a.x === 53.5
      ? {
          x: near || a.visit === "slide" ? 59.3 : 55.3,
          via:
            near || a.visit === "slide"
              ? undefined
              : a.via?.map((p) => (p.x === 53.5 ? { ...p, x: 55.3 } : p)),
        }
      : {}),
    carryWalkFrames: [8, 9, 22, 23],
    visit: a.x === 35.5 && a.visit === "touch" ? "bottle" : a.visit,
    wristPoints: {
      ...a.wristPoints,
      60: [86, 73],
      61: [94, 74],
      68: [94, 74],
      8: [84, 77],
      9: [84, 77],
      22: [84, 77],
      23: [84, 77],
      14: [86, 73],
    },
  };
}

function visitItem(i: StageItem): StageItem {
  if (i.id === "ale-bottle") return { ...i, bottom: 27.5 };
  if (i.id === "patient-tea" && i.actor)
    return { ...i, x: 0, bottom: 0, wristOffset: { x: 0, bottom: -1.1 } };
  if (i.id === "patient-tea" && i.x === 60.2) return { ...i, x: 64.2 };
  if (i.id === "visit-bag" && i.actor)
    return { ...i, x: 0, bottom: 0, wristAnchor: "top", wristOffset: { x: 0, bottom: 2 } };
  if (i.id === "visit-bag" && i.x === 86) return { ...i, x: 84.28, bottom: 51.18 };
  return i;
}

function teaPlacement(sequence?: StageMoment[]) {
  return sequence?.flatMap((s) =>
    s.after === 3700 && s.actors.some((a) => a.visit === "slide")
      ? [
          {
            ...s,
            actors: s.actors.map((a) =>
              a.id === "mira" ? { ...a, carry: true, visit: undefined } : a,
            ),
          },
          { ...s, after: 4000 },
        ]
      : [s],
  );
}

function bagPlacement(sequence?: StageMoment[]) {
  if (!sequence?.some((s) => s.actors.some((a) => a.knock))) return sequence;
  const phase = (s: StageMoment, after: number): StageMoment => ({
    ...s,
    after,
    actors: s.actors.map((a) =>
      a.id === "mira" ? { ...a, inspect: false, healing: "rise", carry: false, via: undefined } : a,
    ),
  });
  return sequence.flatMap((s) => {
    if (s.after === 2200) return [phase(s, 2000), s];
    if (s.after === 2600) return [s, phase(s, 3000)];
    return [s];
  });
}
