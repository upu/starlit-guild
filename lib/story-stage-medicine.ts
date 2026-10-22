import {
  scene,
  duo,
  trio,
  held,
  ground,
  table,
  onTable,
  npc,
  actor,
  type LaterStage,
} from "./story-stage-later-shared.ts";
import { chair, diningItems } from "./story-stage-furniture.ts";
import { mountainRest } from "./story-stage-mountain-rest.ts";

const bedsideCast = () => [
  actor("aria", 60, { bottom: 59, seated: true, chair: true, left: false }),
  actor("leon", 43, { bottom: 52, left: false }),
  actor("mira", 81, { bottom: 70, bed: "rest", left: true }),
];
const breakfast = () => [
  ground("dish", 92, 70, 6),
  { ...ground("bread", 92, 71, 4), support: "dish" },
];
const patientCast = () => [
  actor("aria", 43, { bottom: 35 }),
  actor("leon", 60, { bottom: 35 }),
  actor("mira", 79, { bottom: 52, seated: true, chair: true, left: false }),
];
const patientExtras = (bed: "rest" | "listen" | "ask" | "nod") => [
  { ...npc("parent", "家の人", 97), bottom: 52 },
  { ...npc("child", undefined, 86), bottom: 73, bed, speaking: bed === "ask" },
];

export const medicineStages: Record<string, LaterStage> = {
  "hilltop-picnic-departure": scene(
    "hill-path",
    duo(),
    [
      {
        at: 0,
        actors: { leon: { carry: true } },
        items: [held("bread", "leon"), held("cloth", "leon", { id: "spare", x: 6, bottom: 26 })],
      },
      {
        at: 5,
        actors: { aria: { carry: true } },
        items: [held("bread", "aria"), held("cloth", "leon", { id: "spare", x: 6, bottom: 26 })],
      },
    ],
    { exit: ["aria", "leon"] },
  ),
  "hilltop-picnic-return": scene("hill-path", duo(), [
    {
      at: 0,
      actors: { aria: { seated: true }, leon: { seated: true } },
      items: [ground("picnic-cloth", 50, 12, 28), ground("bread", 50, 16, 13)],
    },
    {
      at: 5,
      items: [
        ground("picnic-cloth", 50, 12, 28),
        held("bread", "aria", { bottom: 23 }),
        held("bread", "leon", { id: "leon-bread", bottom: 23 }),
      ],
    },
    { at: 10, actors: { aria: { pose: "tease", reaction: "nod" } } },
    { at: 14, actors: { leon: { reaction: "nod" } } },
    { at: 16, items: [ground("picnic-cloth", 50, 12, 28), ground("bread", 50, 16, 13)] },
  ]),
  "moonlit-herbs-departure": scene(
    "medicine-room",
    trio(),
    [
      { at: 0, items: [table(61), onTable("herbs", 61)] },
      {
        at: 6,
        actors: { mira: { pose: "offer" } },
        items: [table(61), held("herbs", "mira", { glow: "dim" })],
      },
      { at: 7, actors: { aria: { x: 34, reaction: "surprise" } } },
      { at: 10, items: [table(61), held("herbs", "mira"), held("cloth", "aria")] },
      {
        at: 13,
        items: [table(61), held("herbs", "aria"), held("cloth", "leon")],
        actors: { mira: { left: true, pose: "greet" } },
      },
    ],
    { exit: ["aria", "leon"] },
  ),
  "moonlit-herbs-return": scene(
    "medicine-room",
    trio().map((a) => (a.id === "mira" ? { ...a, seated: true, chair: true } : a)),
    [
      {
        at: 0,
        items: [
          { ...table(61), width: 16 },
          { ...onTable("herbs", 61), bottom: 28 },
          ground("medicine", 85, 12, 9),
        ],
      },
      { at: 3, actors: { mira: { seated: true, pose: "think" } } },
      { at: 4, actors: { aria: { x: 35, pose: "think" } } },
      { at: 5, actors: { leon: { x: 56 }, mira: { pose: "think" } } },
    ],
    { furniture: [chair(actor("mira", 73))] },
  ),
  "medicine-packing-departure": scene(
    "medicine-room",
    bedsideCast(),
    [
      {
        at: 0,
        items: [held("ledger", "aria", { width: 6 }), ...breakfast()],
      },
      {
        at: 9,
        actors: { leon: { writing: true }, mira: { bed: "edge", bottom: 65 } },
        items: [held("ledger", "leon", { width: 6 }), ...breakfast()],
      },
      {
        at: 11,
        actors: {
          aria: { seated: false, x: 66, bottom: 51, pose: "offer" },
          leon: { writing: false },
        },
      },
      {
        at: 13,
        actors: {
          mira: { bed: "breakfast", bottom: 70 },
          leon: { x: 57, bottom: 49, writing: false },
        },
        items: [held("ledger", "leon", { width: 6 }), ...breakfast()],
        sequence: [
          {
            after: 1000,
            items: [
              held("ledger", "aria", { width: 6 }),
              held("delivery-bag", "leon", { width: 8, bottom: 19 }),
              ...breakfast(),
            ],
          },
        ],
      },
    ],
    { exit: ["aria", "leon"], furniture: [chair(bedsideCast()[0])] },
  ),
  "medicine-packing-return": scene("medicine-room", trio(), [
    {
      at: 0,
      actors: {
        aria: { carry: true },
        leon: { inspect: true, packing: true },
        mira: { visible: false },
      },
      items: [
        held("delivery-bag", "aria", { width: 10, bottom: 17 }),
        ground("cloth", 52),
        ground("honey", 62, 13, 6),
      ],
    },
    {
      at: 4,
      actors: { leon: { inspect: false, place: true }, aria: { carry: false, shoulder: true } },
      items: [
        held("delivery-bag", "aria", { width: 10, x: -3.8, bottom: 19 }),
        table(58),
        onTable("cloth", 58),
        ground("honey", 69, 13, 6),
      ],
    },
    {
      at: 5,
      night: true,
      cut: true,
      actors: {
        aria: { visible: false },
        leon: { visible: false },
        mira: { visible: true, seated: false, x: 81, bottom: 70, left: true, bed: "breakfast" },
      },
      items: breakfast(),
      sequence: [
        { after: 2000, actors: { mira: { bed: "sleep", x: 78, bottom: 71, left: false } } },
      ],
    },
    {
      at: 6,
      night: false,
      cut: true,
      actors: {
        aria: { visible: true, carry: false, shoulder: false },
        leon: { visible: true, place: false },
        mira: { seated: false, bed: undefined, x: 68, bottom: 14, inspect: true },
      },
      items: [ground("medicine", 52), ground("honey", 62, 13, 6), ground("cloth", 40)],
    },
    { at: 7, actors: { mira: { inspect: false, pose: "greet" } } },
    { at: 11, actors: { mira: { x: 74, pose: "offer" } } },
    { at: 13, actors: { aria: { reaction: "surprise" } } },
  ]),
  "mountain-entrance-departure": scene(
    "mountain-road",
    trio(),
    [
      {
        at: 0,
        extras: [
          npc("worker", "運び手", 29, "explain", true),
          npc("merchant", "もう一人の運び手", 72),
        ],
        items: [ground("medicine", 51)],
      },
      {
        at: 3,
        extras: [
          npc("worker", "運び手", 29),
          npc("merchant", "もう一人の運び手", 72, "explain", true),
        ],
      },
      {
        at: 6,
        actors: {
          mira: { x: 38, bottom: 36, via: [{ x: 60, bottom: 42 }], carry: true, left: true },
        },
        items: [held("medicine", "mira", { width: 12 })],
        sequence: [
          {
            after: 2000,
            actors: { mira: { carry: false, pose: "offer" } },
            items: [ground("medicine", 44, 32)],
          },
        ],
      },
      {
        at: 10,
        actors: { mira: { pose: "offer" }, aria: { pose: "think" }, leon: { pose: "think" } },
        items: [
          held("map", "leon", { width: 12 }),
          ground("medicine", 44, 32),
          held("cloth", "mira", { width: 4 }),
        ],
      },
      {
        at: 13,
        actors: { mira: { x: 73, bottom: 14, via: [{ x: 60, bottom: 42 }], inspect: false } },
        items: [held("medicine", "mira"), held("map", "leon", { width: 12 })],
      },
    ],
    { exit: ["aria", "leon", "mira"] },
  ),
  "mountain-entrance-return": mountainRest,
  "waiting-households-departure": scene(
    "village-house",
    trio(),
    [
      {
        at: 0,
        extras: [npc("parent", "家の人", 62, "wave", true)],
        items: [held("medicine", "leon")],
      },
      { at: 2, actors: { mira: { x: 68, pose: "think" } } },
      { at: 5, items: [held("medicine", "leon"), held("ledger", "aria")] },
      {
        at: 9,
        actors: { mira: { x: 110 } },
        items: [table(53), onTable("medicine", 53)],
        extras: [npc("parent", "家の人", 108)],
      },
    ],
    { exit: ["aria", "leon"] },
  ),
  "waiting-households-return": scene(
    "patient-room",
    patientCast(),
    [
      {
        at: 0,
        items: [
          ground("medicine", 52, 33, 9),
          { ...ground("honey", 52, 40, 3.5), support: "medicine" },
        ],
        extras: patientExtras("rest"),
      },
      { at: 1, extras: patientExtras("listen") },
      { at: 2, extras: patientExtras("ask") },
      { at: 3, extras: patientExtras("nod") },
    ],
    { furniture: [chair(patientCast()[2])] },
  ),
  "medicine-road-home-departure": scene(
    "village-house",
    trio(),
    [
      {
        at: 0,
        actors: { mira: { carry: true } },
        items: [held("medicine", "mira"), held("basket", "leon")],
      },
      {
        at: 4,
        background: "mountain-road",
        actors: { aria: { x: 31 }, leon: { x: 51 }, mira: { x: 73 } },
        extras: [npc("worker", "運び手", 78, "wave")],
      },
    ],
    { exit: ["aria", "leon", "mira"] },
  ),
  "medicine-road-home-return": scene("mountain-road", trio(), [
    { at: 0, items: [ground("signpost", 79, 34, 12), held("medicine", "mira")] },
    {
      at: 1,
      background: "medicine-room",
      furniture: [chair(actor("mira", 73))],
      items: [...diningItems([table(56), onTable("ledger", 56)]), ground("medicine", 85, 12, 9)],
    },
    { at: 3, actors: { aria: { pose: "greet" } } },
    { at: 6, actors: { aria: { reaction: "surprise" } } },
    {
      at: 9,
      actors: { mira: { seated: true, chair: true } },
      items: [...diningItems([table(56), onTable("tea", 56)]), ground("medicine", 85, 12, 9)],
    },
    { at: 10, actors: { aria: { x: 34, pose: "offer" } } },
  ]),
};
