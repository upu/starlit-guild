import type { StageExtra, StageItem } from "./story-stage-cues.ts";
import { actor, ground, held, npc, scene, type LaterBeat } from "./story-stage-later-shared.ts";
import { chair } from "./story-stage-furniture.ts";
import { heldBag } from "./story-stage-blockade-care.ts";

const parent = (x = 34, bottom = 43, pose: StageExtra["pose"] = "idle"): StageExtra => ({
  ...npc("parent", "家の人", x, pose),
  bottom,
  limp: true,
  left: x > 80,
});
const child = (bed: "rest" | "listen" | "ask" | "nod" = "rest"): StageExtra => ({
  ...npc("child", undefined, 86),
  bottom: 73,
  bed,
  speaking: bed === "ask",
});
const cook = (): StageExtra => ({ ...npc("cook", "台所の人", 9), bottom: 59 });
const medicine = (onTable = false, open = false): StageItem =>
  onTable
    ? {
        ...ground(open ? "medicine" : "medicine-closed", 44, 40, 8),
        id: "medicine",
        support: "table",
      }
    : { ...held("medicine-closed", "leon", { width: 8, bottom: 22 }), id: "medicine" };
const bagContents = (): StageItem[] => [
  { ...ground("honey", 0, 3, 6), carrier: "honey-bag", stored: true },
  { ...ground("packing-cloth", 0, 2, 10), id: "loot-cloth", carrier: "honey-bag", stored: true },
];
const receipt = () => held("folded-paper", "aria", { width: 5, bottom: 24 });
const dryTable = () => ground("table", 44, 25, 22);
const patientCast = () => [
  actor("aria", 32, { bottom: 24, dressed: true, left: false }),
  actor("leon", 58, { bottom: 24, dressed: true, left: true }),
  actor("mira", 79, { bottom: 52, dressed: true, seated: true, chair: true, left: false }),
];
const patientSeat = () => chair(patientCast()[2]);
const bucket = (carried = false): StageItem =>
  carried
    ? held("water-bucket", "aria", { x: 2.2, width: 5, bottom: 15 })
    : { ...ground("water-bucket", -5, 60, 5), extra: "cook" };
const outsideItems = (reading = false): StageItem[] => [
  medicine(),
  heldBag(true),
  ...bagContents(),
  ...(reading ? [receipt()] : []),
];
function indoorItems(placed = false, bagDown = false, bucketHeld = false): StageItem[] {
  return [
    medicine(placed),
    bagDown ? ground("honey-bag", 73, 52, 8) : heldBag(true),
    ...bagContents(),
    bucket(bucketHeld),
  ];
}

const householdChores: LaterBeat = {
  at: 9,
  background: "patient-room",
  cast: [
    actor("aria", 24, { bottom: 26, dressed: true, left: false }),
    actor("leon", 34, { bottom: 32, carry: true, dressed: true, left: false }),
    actor("mira", 30, { bottom: 50, carry: true, dressed: true, left: false }),
  ],
  furniture: [dryTable(), patientSeat()],
  extras: [parent(18, 52), child(), cook()],
  items: indoorItems(),
  sequence: [
    {
      after: 200,
      actors: { leon: { x: 40 }, mira: { x: 79, bottom: 52 } },
      extras: [
        {
          ...parent(97, 52),
          via: [
            { x: 54, bottom: 40 },
            { x: 97, bottom: 40 },
          ],
        },
        child(),
        cook(),
      ],
    },
    {
      after: 800,
      actors: { aria: { x: 2, bottom: 59, via: [{ x: 6, bottom: 45 }], left: false } },
    },
    { after: 2000, actors: { leon: { carry: false, pose: "offer" } }, items: indoorItems(true) },
    {
      after: 3300,
      actors: {
        leon: {
          x: 58,
          bottom: 24,
          via: [
            { x: 40, bottom: 12 },
            { x: 58, bottom: 12 },
          ],
          left: true,
        },
        mira: { seated: true, chair: true, carry: false, pose: "offer" },
      },
      items: indoorItems(true, true),
    },
    {
      after: 3800,
      actors: { aria: { carry: true, via: undefined, left: false } },
      items: indoorItems(true, true, true),
    },
    {
      after: 4700,
      actors: { aria: { x: 30, bottom: 22, via: [{ x: 2, bottom: 42 }], left: false } },
    },
  ],
};

export const waitingDeparture = scene(
  "village-house",
  [
    actor("aria", 52, { bottom: 28, left: true, dressed: true }),
    actor("leon", 66, { bottom: 25, left: true, carry: true, dressed: true }),
    actor("mira", 47, { bottom: 44, carry: true, left: true, dressed: true }),
  ],
  [
    { at: 0, extras: [parent(6, 57, "wave")], items: outsideItems() },
    { at: 1, extras: [parent()], actors: { mira: { pose: "think" } } },
    { at: 3, extras: [parent(34, 43, "point")] },
    { at: 4, extras: [parent()] },
    { at: 5, actors: { aria: { pose: "offer" } }, items: outsideItems(true) },
    householdChores,
  ],
  { exit: ["aria", "leon"], exitSide: "left", exitLanes: { aria: 12, leon: 12 } },
);

export const waitingReturn = scene(
  "patient-room",
  patientCast(),
  [
    {
      at: 0,
      items: [
        medicine(true, true),
        { ...ground("honey", 50, 40, 6), support: "table" },
        { ...ground("packing-cloth", 48, 39, 10), id: "loot-cloth", support: "table" },
        ground("honey-bag", 73, 52, 8),
      ],
      extras: [parent(97, 52), child()],
    },
    { at: 1, extras: [parent(97, 52), child("listen")] },
    { at: 2, extras: [parent(97, 52), child("ask")] },
    { at: 3, extras: [parent(97, 52), child("nod")] },
  ],
  { furniture: [dryTable(), patientSeat()] },
);
