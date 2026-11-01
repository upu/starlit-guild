import { actor, item, scene, type LaterBeat } from "./story-stage-later-shared.ts";
import type { StageExtra, StageItem } from "./story-stage-cues.ts";

const patient = (pose: StageExtra["pose"] = "idle"): StageExtra => ({
  id: "keeper",
  name: "患者",
  x: 67,
  bottom: 16,
  chair: true,
  left: true,
  pose,
});
const doctor = (writing = false, pose: StageExtra["pose"] = "idle"): StageExtra => ({
  id: "doctor",
  name: "町の医者",
  x: 78,
  bottom: 35,
  notebook: true,
  writing,
  pose,
});
const bag = (carried = false): StageItem =>
  item("visit-bag", "medicine-closed", 30, 12, {
    width: 6,
    ...(carried ? { actor: "mira", wrist: true, wristAnchor: "bottom" as const } : {}),
  });
function room(cup: "table" | "hand" | "near" = "table"): StageItem[] {
  return [
    item("visit-table", "dining-table", 52, 14, { width: 30 }),
    item("ale-bottle", "ale-bottle", 41, 26, { width: 2.8, support: "visit-table" }),
    item("ale-cup", "ale-cup-empty", 45, 25.5, { width: 2.6, support: "visit-table" }),
    item("patient-tea", "teacup", cup === "near" ? 60.2 : 57.9, 23.8, {
      width: 2.8,
      support: "visit-table",
      ...(cup === "hand" ? { actor: "mira", wrist: true, wristAnchor: "bottom" as const } : {}),
    }),
    bag(),
  ];
}
const moveTea: LaterBeat = {
  at: 10,
  actors: { mira: { visit: undefined, pose: "idle" } },
  sequence: [
    {
      after: 700,
      actors: {
        mira: {
          x: 53.5,
          bottom: 12.5,
          via: [
            { x: 33, bottom: 2 },
            { x: 53.5, bottom: 2 },
          ],
        },
      },
    },
    // Keep the route on the next line too, so an early tap still goes around the table.
    { after: 2600, actors: { mira: { visit: "touch", left: false } } },
    { after: 3000, items: room("hand") },
    { after: 3700, actors: { mira: { visit: "slide" } } },
    { after: 4600, items: room("near") },
    { after: 5400, actors: { mira: { visit: undefined, pose: "idle" } } },
  ],
};
const leaveHouse: LaterBeat = {
  at: 12,
  background: "brekka-homes",
  cut: true,
  extras: [],
  items: [bag(true)],
  cast: [
    actor("aria", 26, { bottom: 50, left: false }),
    actor("leon", 30, { bottom: 43, left: false }),
    actor("mira", 22, { bottom: 59, left: false, carry: true }),
    actor("finn", 73, { bottom: 20, left: true }),
  ],
  sequence: [
    { after: 50, actors: { leon: { x: 47, bottom: 11 } } },
    { after: 600, actors: { aria: { x: 29, bottom: 16 } } },
    { after: 1100, actors: { mira: { x: 53, bottom: 27 } } },
  ],
};
const knockNextDoor: LaterBeat = {
  at: 27,
  actors: { leon: { left: true }, mira: { x: 81, bottom: 54, via: [{ x: 67, bottom: 37 }] } },
  sequence: [
    {
      after: 2200,
      actors: { mira: { carry: false, via: undefined, left: false, inspect: true } },
    },
    { after: 2600, items: [item("visit-bag", "medicine-closed", 86, 55, { width: 6 })] },
    { after: 3400, actors: { mira: { inspect: false, knock: true } } },
    { after: 4480, actors: { mira: { knock: false, pose: "idle" } } },
  ],
};
export const brekkaVisit = scene(
  "patient-room",
  [
    actor("aria", 18, { bottom: 5, left: false }),
    actor("leon", 80, { bottom: 4, left: true }),
    actor("mira", 35.5, { bottom: 18, left: false }),
    actor("finn", 85, { visible: false }),
  ],
  [
    { at: 0, items: room(), extras: [patient("explain"), doctor()] },
    {
      at: 1,
      extras: [patient("point"), doctor(true)],
      sequence: [{ after: 2400, extras: [patient(), doctor()] }],
    },
    { at: 2, extras: [patient(), doctor(false, "explain")] },
    { at: 3, actors: { mira: { visit: "touch" } }, extras: [patient(), doctor()] },
    moveTea,
    leaveHouse,
    { at: 14, actors: { aria: { reaction: "surprise" } } },
    knockNextDoor,
  ],
);
