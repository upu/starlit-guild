import { actor, npc, scene, type LaterBeat } from "./story-stage-later-shared.ts";
import { visitItems, type VisitState } from "./story-stage-berne-visit-items.ts";

const owner = (speaking = false, pose: "idle" | "explain" = speaking ? "explain" : "idle") => ({
  ...npc("keeper", "家の人", 82, pose, speaking),
  bottom: 36,
  left: true,
});
type VisitItems = (patch?: VisitState) => ReturnType<typeof visitItems>;
function visitBeats(): LaterBeat[] {
  let state: VisitState = {};
  const items: VisitItems = (patch = {}) => visitItems((state = { ...state, ...patch }));
  return [
    ...prescription(items),
    ...unpackLunch(items),
    ...moveMedicine(items),
    ...shareLunch(items),
    ...finishLunch(items),
  ];
}
function prescription(items: VisitItems): LaterBeat[] {
  return [
    {
      at: 0,
      extras: [owner(false, "explain")],
      items: items({ packet: "mira" }),
      sequence: [
        { after: 800, items: items({ packet: "owner" }) },
        {
          after: 1600,
          items: items({ packet: undefined }),
          actors: { mira: { x: 70, bottom: 32, inspect: true, packing: true } },
        },
        {
          after: 2300,
          items: items({ medicine: "mira" }),
          actors: { mira: { inspect: false, packing: false, carry: true } },
        },
        {
          after: 3100,
          actors: { mira: { x: 60, bottom: 43, via: [{ x: 65, bottom: 47 }], left: false } },
        },
      ],
    },
    { at: 1, actors: { aria: { pose: "surprise" } }, extras: [owner()] },
    { at: 2, extras: [owner(true)] },
    { at: 3, extras: [owner()] },
    {
      at: 6,
      extras: [owner(false, "explain")],
      actors: { leon: { x: 72, bottom: 36, left: false, pose: "offer" } },
      items: items({ documents: "owner" }),
      sequence: [
        { after: 1100, items: items({ documents: "leon" }) },
        { after: 1900, actors: { leon: { x: 56, bottom: 24, left: true } }, extras: [owner()] },
      ],
    },
  ];
}

function unpackLunch(items: VisitItems): LaterBeat[] {
  return [
    {
      at: 10,
      actors: {
        leon: { x: 66, bottom: 14, left: true },
        mira: { carry: false },
        aria: { x: 40, bottom: 24 },
      },
      items: items({ medicine: "waiting" }),
      sequence: [
        {
          after: 600,
          actors: {
            aria: { seated: true },
            mira: { x: 28, bottom: 24, via: [{ x: 28, bottom: 44 }], left: false },
          },
        },
        { after: 900, items: items({ documents: "ground", lunch: "lap" }) },
        {
          after: 1500,
          actors: {
            leon: {
              x: 52,
              bottom: 24,
              via: [
                { x: 66, bottom: 30 },
                { x: 52, bottom: 30 },
              ],
            },
          },
        },
        { after: 2200, items: items({ note: "open" }) },
      ],
    },
    { at: 11, actors: { leon: { seated: true } } },
    {
      at: 13,
      actors: { aria: { left: false }, leon: { left: true } },
      items: items({ lunch: "pass" }),
      sequence: [
        { after: 800, items: items({ lunch: "given" }) },
        { after: 1600, actors: { leon: { left: false } }, items: items({ lunch: "laid" }) },
      ],
    },
  ];
}

function moveMedicine(items: VisitItems): LaterBeat[] {
  return [
    {
      at: 14,
      actors: {
        leon: { seated: false, x: 65, bottom: 42, left: true, via: [{ x: 55, bottom: 40 }] },
        mira: { seated: true },
      },
      items: items({ leonWrap: "ground" }),
      sequence: [
        { after: 1100, actors: { leon: { inspect: true, packing: true } } },
        { after: 1700, items: items({ medicine: "lift" }) },
        {
          after: 2400,
          actors: { leon: { inspect: false, packing: false, carry: true } },
          items: items({ medicine: "leon" }),
        },
        {
          after: 3100,
          actors: { leon: { x: 52, bottom: 24, via: [{ x: 55, bottom: 40 }], left: false } },
        },
        {
          after: 4100,
          actors: { leon: { carry: false, inspect: true, packing: true } },
          items: items({ medicine: "rest" }),
        },
        {
          after: 4900,
          actors: { leon: { inspect: false, packing: false, seated: true } },
          items: items({ leonWrap: undefined }),
        },
      ],
    },
  ];
}

function shareLunch(items: VisitItems): LaterBeat[] {
  return [
    {
      at: 17,
      items: items({ lunch: "split" }),
      sequence: [
        {
          after: 700,
          items: items({ lunch: "edge" }),
          actors: { finn: { x: 64, bottom: 24, left: true, nameAbove: true } },
        },
        { after: 1400, actors: { finn: { seated: true } } },
        { after: 2100, items: items({ lunch: "shared" }) },
      ],
    },
    {
      at: 18,
      extras: [owner(false, "explain")],
      actors: {
        finn: { seated: false, x: 74, bottom: 34, left: false, via: [{ x: 76, bottom: 24 }] },
      },
      items: items({ lunch: "edge", tea: "owner" }),
      sequence: [
        { after: 1200, actors: { finn: { carry: true } }, items: items({ tea: "finn" }) },
        {
          after: 2000,
          extras: [owner()],
          actors: { finn: { x: 64, bottom: 24, via: [{ x: 76, bottom: 24 }], left: true } },
        },
        {
          after: 3100,
          actors: { finn: { carry: false, inspect: true, left: false } },
          items: items({ tea: "ground" }),
        },
        {
          after: 3900,
          actors: { finn: { inspect: false, seated: true, left: true } },
          items: items({ lunch: "shared" }),
        },
      ],
    },
  ];
}

function finishLunch(items: VisitItems): LaterBeat[] {
  return [
    {
      at: 20,
      actors: { aria: { left: true }, mira: { left: false, pose: "idle" } },
      items: items({ note: "closed" }),
      sequence: [
        { after: 800, items: items({ lunch: "mira-pass" }) },
        { after: 1500, items: items({ lunch: "mira-given" }) },
        { after: 2400, items: items({ lunch: "holding" }) },
      ],
    },
    { at: 21, items: items({ lunch: "eaten" }) },
    { at: 22, extras: [owner(true)] },
    {
      at: 23,
      extras: [owner()],
      actors: { finn: { inspect: true } },
      sequence: [
        { after: 700, items: items({ documents: "finn" }) },
        { after: 1500, actors: { finn: { inspect: false } }, items: items({ documents: "coat" }) },
        { after: 2300, items: items({ documents: "stored" }) },
      ],
    },
  ];
}

export const berneVisit = scene(
  "berne-porch",
  [
    actor("aria", 36, { bottom: 30, left: false, nameAbove: true }),
    actor("leon", 56, { bottom: 24, left: true, nameAbove: true }),
    actor("mira", 74, { bottom: 36, left: false, pose: "offer", nameAbove: true }),
    actor("finn", 75, { bottom: 16, left: true }),
  ],
  visitBeats(),
);
