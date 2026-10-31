import type { StageActor, StageExtra, StoryStageCue } from "../story-stage-cues.ts";
import { foundingDepartureItem, foundingRoadItems } from "./founding-departure-items.ts";
import { RPG_CAMERA_SCALE } from "../rpg-camera.ts";

// Keep the stone's position in the painted road while matching the adventure's scale.
const roadShift = { x: 27.7, bottom: -6 };

/** Existing tower courtyard, then the established country road; no new itinerary. */
export function foundingDepartureStudyCue(cue: StoryStageCue, line = 0): StoryStageCue {
  const road = cue.background === "hill-path";
  const adjust = (s: Pick<StoryStageCue, "actors" | "items" | "extras">) => ({
    ...s,
    actors: s.actors.map((a) => {
      const actor = foundingActor(a, road);
      return {
        ...(road ? shiftRoadActor(actor) : actor),
        // The five-unit road entrance should show one full pulling gait.
        ...(line === 37 ? { paceMsPerUnit: 144 } : {}),
      };
    }),
    extras: s.extras?.map(keeper),
    items: [
      ...(road ? foundingRoadItems(s.items ?? []) : (s.items ?? []).map(foundingDepartureItem)),
      ...(road
        ? []
        : [
            { id: "founding-keeper-chair", art: "chair" as const, x: 27, bottom: 38.7, width: 8.5 },
          ]),
    ],
  });
  const state = adjust(cue);
  return {
    ...cue,
    ...state,
    cell: 19,
    cameraScale: road ? 0.46 : RPG_CAMERA_SCALE,
    cut: cue.cut || line === 37,
    finishBeforeAdvance: !!cue.finishBeforeAdvance || !!cue.sequence?.length || line === 37,
    description: road
      ? "帰りの街道。道端の日陰の石に目を留める。"
      : "ブレッカの塔の足元。窓には薄い紫が残る。",
    initial: Object.fromEntries(state.actors.map((a) => [a.id, a.x - (line === 37 ? 5 : 0)])),
    initialBottom: Object.fromEntries(state.actors.map((a) => [a.id, a.bottom ?? 14])),
    sequence: cue.sequence?.map((s) => ({ ...s, ...adjust(s) })),
  };
}
function shiftRoadActor(a: StageActor): StageActor {
  return {
    ...a,
    x: a.x + roadShift.x,
    bottom: (a.bottom ?? 14) + roadShift.bottom,
    via: a.via?.map((p) => ({ x: p.x + roadShift.x, bottom: p.bottom + roadShift.bottom })),
    insideCamera: true,
    nameOffset:
      a.inspect && a.id === "aria" ? -30 : a.inspect && a.id === "lico" ? 30 : a.nameOffset,
  };
}
function foundingActor(a: StageActor, road: boolean): StageActor {
  const hands = a.id === "lico" ? [83, 77] : [79, 76];
  const registered: StageActor = {
    ...a,
    carryWalkFrames: [8, 9, 22, 23],
    wristPoints: {
      ...a.wristPoints,
      ...Object.fromEntries([8, 9, 22, 23, 14, 15, 16].map((f) => [f, hands])),
      13: a.id === "lico" ? [76, 113] : [88, 111],
      73: [91, 84],
      86: [76, 112],
      87: [76, 112],
    },
  };
  if (road) return roadActor(registered);
  if (a.id === "lico") return licoAtTower(registered);
  if (a.id === "aria" && a.x === 77.359375)
    return {
      ...registered,
      x: 76.765625,
      bottom: 12.21875,
      nameOffset: -35,
      via: a.via?.map((p) => ({ ...p, x: p.x === 77.359375 ? 76.765625 : p.x })),
    };
  return registered;
}
function licoAtTower(a: StageActor): StageActor {
  if (a.mossStudy === "spread") return { ...a, x: 79.78125, bottom: 18.6875 };
  if (a.inspect) return { ...a, x: 79.78125, bottom: 18.91015625 };
  if (a.carry) return { ...a, x: 80.8203125 };
  return a;
}
function roadActor(a: StageActor): StageActor {
  if (a.id === "lico" && a.inspect)
    return { ...a, x: 103.5, bottom: 14.9453125, left: true, carry: false, insideCamera: true };
  if (a.id === "aria" && a.inspect)
    return {
      ...a,
      x: 94.15625,
      bottom: 14.5,
      left: false,
      via: [{ x: 94.15625, bottom: 5 }],
      carry: false,
    };
  if (a.id === "finn")
    return { ...a, x: a.x + 3, bottom: 25.5, pull: true, left: false, nameOffset: -30 };
  // Keep the walking pair on separate depth lanes until Aria approaches the stone.
  if (a.id === "aria") return { ...a, x: a.x + 3, bottom: 0 };
  return { ...a, x: a.x + 3 };
}
function keeper(e: StageExtra): StageExtra {
  return e.id === "keeper" && e.deskWork
    ? { ...e, handOver: { item: "keeper-desk", rect: [70, 55, 26, 37] } }
    : e;
}
