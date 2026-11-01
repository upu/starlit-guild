import type { StageExtra, StageItem, StoryStageCue } from "../story-stage-cues.ts";

const closed: StageItem = {
  id: "inspection-lid",
  art: "inspection-lid",
  x: 65.2,
  bottom: 61.1,
  width: 8.7,
  travelMs: 450,
};
const opened: StageItem = { ...closed, x: 51, tilt: 12 };
const light: StageItem = {
  id: "inspection-light",
  art: "inspection-glow",
  x: 65.2,
  bottom: 65,
  width: 7,
};
const contact = { x: 74.6125, bottom: 57.7 };
const palms: StageExtra["wristPoints"] = {
  29: [37, 103],
  30: [41, 94],
  31: [44, 84],
  32: [43, 88],
  33: [49, 88],
  34: [43, 88],
  35: [48, 88],
};
const held: StageItem = {
  ...closed,
  x: 0,
  bottom: 0,
  extra: "keeper",
  wrist: true,
  wristAnchor: "bottom",
  wristUnmirrored: true,
  wristOffset: { x: -4.35, bottom: -3.63125 },
  behindOwner: true,
};

export const inspectionLidStates = { closed, opened, held, palms };

/** The solid lid occludes the moss until the keeper takes its weight and steps aside. */
export function waterwayHatchOpening(cue: StoryStageCue, line: number): StoryStageCue {
  if (line === 1) return openingMotion(cue);
  if (line === 0) return { ...cue, items: [...(cue.items ?? []), closed] };
  return {
    ...cue,
    items: [...(cue.items ?? []), opened, light],
    sequence: cue.sequence?.map((beat) => ({ ...beat, items: [...beat.items, opened, light] })),
  };
}

function openingMotion(cue: StoryStageCue): StoryStageCue {
  const props = (lid: StageItem, revealed = false) => [
    ...(cue.items ?? []),
    lid,
    ...(revealed ? [light] : []),
  ];
  const extras = (
    hatchOpening: StageExtra["hatchOpening"],
    at = contact,
    via?: StageExtra["via"],
    carry = false,
  ) =>
    cue.extras?.map((extra) =>
      extra.id === "keeper"
        ? { ...extra, ...at, via, carry, hatchOpening, left: false, wristPoints: palms }
        : extra,
    );
  const approach = extras("idle", contact, [
    { x: 43, bottom: 36 },
    { x: 75, bottom: 36 },
  ]);
  const side = { x: 59.1, bottom: 57.7 };
  const low = { x: 60.4125, bottom: 57.7 };
  const onPath = { x: 43, bottom: 24 };
  const state = (
    after: number,
    people: StoryStageCue["extras"],
    lid: StageItem,
    revealed = false,
  ) => ({ after, actors: cue.actors, extras: people, items: props(lid, revealed) });
  return {
    ...cue,
    items: props(closed),
    extras: approach,
    finishBeforeAdvance: true,
    sequence: [
      state(3300, extras("grip"), closed),
      state(3750, extras("grip"), held),
      state(4200, extras("lift", { x: 73.8625, bottom: 57.7 }), held),
      state(4700, extras("hold", { x: 73.3, bottom: 57.7 }), held),
      state(5200, extras("hold", side, undefined, true), held, true),
      state(6050, extras("hold", side), held, true),
      state(6400, extras("grip", low), held, true),
      state(6900, extras("grip", low), opened, true),
      state(7400, extras("idle", low), opened, true),
      state(
        7750,
        extras("idle", onPath, [
          { x: 75, bottom: 57.7 },
          { x: 75, bottom: 36 },
          { x: 43, bottom: 36 },
        ]),
        opened,
        true,
      ),
      state(11850, extras("idle", onPath), opened, true),
    ],
  };
}
