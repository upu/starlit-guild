import type { StoryStageCue, StageActor, StageExtra, StageItem } from "../story-stage-cues.ts";

export function lanternStudyCue(cue: StoryStageCue): StoryStageCue {
  const sequence = cue.sequence?.flatMap((s) =>
    s.after === 5800
      ? [
          { ...s, after: 6400, extras: s.extras?.map((e) => ({ ...e, hatGreeting: true })) },
          { ...s, after: 6750 },
        ]
      : [{ ...s, after: s.after >= 5800 ? s.after + 600 : s.after }],
  );
  const adjust = (s: Pick<StoryStageCue, "actors" | "items" | "extras">) => ({
    actors: s.actors.map((a) => lanternActor(a, s.items ?? [])),
    extras: s.extras?.map((e) => lanternPorter(e, s.items ?? [])),
    items: (s.items ?? []).map(lanternItem),
  });
  return {
    ...cue,
    cameraScale: 0.72,
    ...adjust(cue),
    finishBeforeAdvance: !!cue.sequence?.length || cue.actors.some((a) => !!a.via?.length),
    sequence: sequence?.map((s) => ({ ...s, ...adjust(s) })),
  };
}

function lanternActor(a: StageActor, items: StageItem[]): StageActor {
  a = lanternPosition(a);
  const work = a.id === "aria" && a.x === 43 && a.bottom === 31;
  const pan = items.some((i) => i.id === "oil-pan" && i.actor === a.id);
  return {
    ...a,
    ...(work ? { bottom: 27, reachOver: undefined } : {}),
    ...(a.id === "leon" && a.x === 44 ? { reachOver: undefined } : {}),
    ...(a.id === "leon" && a.x === 58 ? { nameOffset: 24 } : {}),
    carry:
      !a.fieldWork &&
      !a.push &&
      !a.writing &&
      (pan || items.some((i) => i.actor === a.id && !i.stored)),
    carryWalkFrames: [8, 9, 22, 23],
    wristPoints: {
      ...a.wristPoints,
      ...(pan ? { 14: [84, 72] as [number, number], 15: [84, 72] as [number, number] } : {}),
      44: [84, 72],
      45: [83, 72],
      52: [95, 52],
      53: [106, 54],
      8: [84, 77],
      9: [84, 77],
      22: [84, 77],
      23: [84, 77],
    },
  };
}

function lanternPosition(a: StageActor): StageActor {
  if (a.bottom === undefined) return lanternRoadPosition(a);
  if (a.id === "mira" && a.x === 85) return { ...a, x: 54, bottom: 0, via: undefined };
  if (a.id === "finn" && a.x === 91) return { ...a, x: 84, bottom: 50, via: undefined };
  if (a.id === "finn" && a.x === 19)
    return {
      ...a,
      x: 45,
      bottom: 9,
      via: [
        { x: 63, bottom: 50 },
        { x: 63, bottom: 10 },
        { x: 45, bottom: 10 },
      ],
    };
  if (a.id === "mira" && a.x === 34)
    return {
      ...a,
      via: [
        { x: 50, bottom: 20 },
        { x: 34, bottom: 20 },
      ],
    };
  return a;
}
function lanternRoadPosition(a: StageActor): StageActor {
  const road: Partial<Record<string, [number, number]>> = {
    aria: [28, 14],
    leon: [44, 14],
    mira: [58, 8],
    finn: [78, 50],
  };
  const p = road[a.id];
  return p && a.x >= 0 && a.x <= 100 ? { ...a, x: p[0], bottom: p[1] } : a;
}

function lanternPorter(e: StageExtra, items: StageItem[]): StageExtra {
  return {
    ...e,
    left: false,
    oilPour: items.some((i) => i.id === "lamp-oil" && i.extra === e.id && !!i.tilt),
    showNotebook: e.notebook && !e.writing,
    ...(e.wiping ? { x: 56, bottom: 28 } : {}),
    wristPoints: {
      ...e.wristPoints,
      10: [20, 106],
      11: [35, 73],
      12: [29, 76],
      15: [29, 61],
      13: [35, 56],
      14: [49, 67],
      4: [44, 82],
      5: [44, 82],
      6: [44, 82],
      7: [44, 82],
    },
  };
}

function lanternItem(i: StageItem): StageItem {
  if (i.id === "lamp-oil" && !i.extra) return { ...i, x: 64.8, bottom: 36.3 };
  if (i.id === "stone-lantern") return { ...i, width: 13 };
  if (i.id === "roadside-grass") return { ...i, width: 12 };
  if (i.id === "tool-bag") return { ...i, width: 7 };
  if (i.actor || i.extra) return lanternHeld(i);
  return i;
}

function lanternHeld(i: StageItem): StageItem {
  const paper = ["paper", "map", "folded-paper"].includes(i.art);
  return {
    ...i,
    x: 0,
    bottom: 0,
    wrist: true,
    wristAnchor: "bottom",
    width: paper ? 5 : i.width,
    pitch: paper ? 55 : i.pitch,
    ...(i.id === "lamp-oil" ? { wristAnchor: "top", pouring: !!i.tilt } : {}),
    ...(i.id === "wiping-cloth"
      ? { wristAnchor: "top", width: 3, wristOffset: { x: 0, bottom: 1 } }
      : {}),
  };
}
