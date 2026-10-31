import type { StageActor, StageExtra, StoryStageCue } from "../story-stage-cues.ts";
import { recordsFieldItems } from "./records-field-items.ts";
import { recordsFieldSequence } from "./records-field-sequence.ts";

/** Field props share registered palms; books stay separate on the dry lap board. */
export function recordsFieldStudyCue(cue: StoryStageCue, id: string, line: number): StoryStageCue {
  const returning = id.endsWith("return");
  const adjust = (s: Pick<StoryStageCue, "actors" | "items" | "extras">) => {
    const items = recordsFieldItems(s.items ?? [], s.actors, returning, line);
    return {
      actors: s.actors.map((a) => fieldActor(a, items, returning, line)),
      extras: s.extras?.map(fieldExtra),
      items,
    };
  };
  return {
    ...cue,
    ...adjust(cue),
    finishBeforeAdvance:
      !!cue.finishBeforeAdvance ||
      !!cue.sequence?.length ||
      cue.actors.some((a) => !!a.via?.length),
    sequence: recordsFieldSequence(
      cue.sequence?.map((s) => ({ ...s, ...adjust(s) })),
      returning,
      line,
    ),
  };
}
function fieldActor(
  a: StageActor,
  items: NonNullable<StoryStageCue["items"]>,
  returning: boolean,
  line: number,
): StageActor {
  const held = items.filter((i) => i.actor === a.id),
    holding = !!held.length;
  const shared = {
    ...a,
    via: a.via?.map((p) => ({ ...p, bottom: Math.max(-16, p.bottom) })),
    holdingWalk: holding,
    carryWalkFrames: [8, 9, 22, 23] as const,
  };
  if (a.id === "lico") return fieldLico(shared, held, returning);
  if (a.id === "aria") return fieldAria(shared, holding, returning, line);
  if (a.id === "leon") return fieldLeon(shared, returning);
  if (a.id === "mira")
    return {
      ...shared,
      wristPoints: { ...a.wristPoints, 68: [70, 83], 69: [70, 83], 70: [70, 83], 71: [70, 83] },
    };
  return fieldFinn(shared, holding, returning, line);
}
function fieldAria(a: StageActor, holding: boolean, returning: boolean, line: number): StageActor {
  const givingBoard = a.x === 60.8125 && line < 26;
  return {
    ...a,
    ...ariaBoardPickup(a),
    ...ariaBoardReturn(a, returning, line),
    ...(a.x === 60.8125
      ? { x: givingBoard ? 63.25 : 60.625, bottom: givingBoard ? 1.3125 : 7.3875 }
      : {}),
    ...(!givingBoard && a.x === 60.8125
      ? {
          via: basketRoute(line),
        }
      : {}),
    carry: holding && !a.inspect && !givingBoard,
    wristPoints: { ...a.wristPoints, 14: [79, 76], 15: [79, 76], 16: [79, 76] },
  };
}
function basketRoute(line: number) {
  if (line !== 26) return undefined;
  return [
    { x: 40, bottom: 36 },
    { x: 44, bottom: 10 },
  ];
}
function ariaBoardPickup(a: StageActor): Partial<StageActor> {
  if (a.x !== 60 || a.bottom !== 0) return {};
  return {
    x: 52.375,
    bottom: 0,
    via: [
      { x: 38, bottom: 36 },
      { x: 44, bottom: 10 },
    ],
  };
}
function ariaBoardReturn(a: StageActor, returning: boolean, line: number): Partial<StageActor> {
  if (!returning || line < 8 || line >= 26 || a.x !== 14 || a.bottom !== 14) return {};
  return {
    x: 28,
    bottom: 38,
    via:
      line === 8
        ? [
            { x: 44, bottom: 10 },
            { x: 40, bottom: 32 },
          ]
        : undefined,
  };
}
function fieldLeon(a: StageActor, returning: boolean): StageActor {
  if (returning) return a.x === 61.1875 ? { ...a, x: 60.25, bottom: 3.84375 } : a;
  // Finn stands just in front of Leon; a foot label would cover Finn's head.
  const named = { ...a, nameAbove: true };
  return a.x === 58 && a.bottom === 10 ? { ...named, x: 50, bottom: 12, via: undefined } : named;
}
function fieldFinn(a: StageActor, holding: boolean, returning: boolean, line: number): StageActor {
  return {
    ...a,
    ...(returning && line >= 8 && line < 13 && a.x === 47
      ? { x: 40, bottom: -5, via: undefined }
      : {}),
    ...(returning && a.x === 63
      ? {
          x: 60.4375,
          bottom: 2.71875,
          pose: "think" as const,
          via: [
            { x: 47, bottom: -12 },
            { x: 60.4375, bottom: -12 },
          ],
        }
      : {}),
    carry: holding,
    wristPoints: {
      ...a.wristPoints,
      14: [80, 74],
      15: [98, 70],
      16: [80, 74],
      8: [80, 74],
      9: [80, 74],
      22: [80, 74],
      23: [80, 74],
    },
  };
}
function fieldLico(
  a: StageActor,
  held: NonNullable<StoryStageCue["items"]>,
  returning: boolean,
): StageActor {
  const cover = held.some((i) => i.id === "reflector-cover");
  const emptyGlasses = !returning && a.x === 54 && a.mossStudy === "glasses";
  const standingUp = !returning && a.x === 70 && !a.seated && a.mossStudy === "glasses";
  return {
    ...a,
    nameAbove: true,
    recordHandOut:
      a.recordStudy === "hug" &&
      held.some((i) => i.id === "first-seedling" || (i.id === "records" && !i.carrier)),
    mossStudy: cover || emptyGlasses ? undefined : a.mossStudy,
    carry: cover,
    holdingWalk: false,
    ...(standingUp ? { bottom: 7.5 } : {}),
    ...(emptyGlasses ? { pose: "think", x: 62, bottom: 43, via: [{ x: 54, bottom: 43 }] } : {}),
    wristPoints: {
      ...a.wristPoints,
      14: [86, 88],
      15: [86, 88],
      16: [86, 88],
      73: [96, 94],
      76: [81, 103],
      77: [81, 103],
      78: [81, 103],
      79: [99, 99],
      36: [81, 103],
      37: [81, 103],
      38: [81, 103],
      39: [81, 103],
      40: [81, 103],
      41: [81, 103],
      42: [81, 103],
      43: [81, 103],
    },
  };
}
function fieldExtra(e: StageExtra): StageExtra {
  if (e.id !== "keeper") return e;
  return {
    ...e,
    ...(e.x === 79 ? { x: 62.3125, bottom: 4.125, left: true } : { left: false }),
    ...(e.via
      ? {
          via: [
            { x: 57, bottom: 23 },
            { x: 57, bottom: 35 },
            { x: 84, bottom: 35 },
          ],
        }
      : {}),
    wristPoints: { ...e.wristPoints, 14: [40, 75], 15: [40, 75] },
  };
}
