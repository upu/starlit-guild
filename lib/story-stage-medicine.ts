import {
  scene,
  duo,
  trio,
  held,
  ground,
  table,
  onTable,
  npc,
  type LaterStage,
} from "./story-stage-later-shared.ts";

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
  "moonlit-herbs-return": scene("medicine-room", trio(), [
    { at: 0, items: [table(61), onTable("herbs", 61), ground("medicine", 77)] },
    { at: 3, actors: { mira: { seated: true, pose: "think" } } },
    { at: 4, actors: { aria: { x: 35, pose: "think" } } },
    { at: 5, actors: { leon: { x: 56 }, mira: { pose: "think" } } },
  ]),
  "medicine-packing-departure": scene(
    "medicine-room",
    trio(),
    [
      {
        at: 0,
        actors: { mira: { seated: true }, aria: { seated: true } },
        items: [held("ledger", "aria"), ground("medicine", 60)],
      },
      {
        at: 9,
        actors: { leon: { inspect: true }, mira: { seated: false } },
        items: [held("ledger", "leon"), ground("medicine", 60)],
      },
      { at: 11, actors: { aria: { seated: false, pose: "offer" } } },
      {
        at: 13,
        actors: { mira: { seated: true }, leon: { inspect: false } },
        items: [held("ledger", "aria"), ground("medicine", 60)],
      },
    ],
    { exit: ["aria", "leon"] },
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
      actors: {
        aria: { visible: false },
        leon: { visible: false },
        mira: { visible: true, seated: true },
      },
    },
    {
      at: 6,
      night: false,
      actors: {
        aria: { visible: true, carry: false, shoulder: false },
        leon: { visible: true, place: false },
        mira: { seated: false, x: 68, inspect: true },
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
  "mountain-entrance-return": scene("mountain-road", trio(), [
    {
      at: 0,
      actors: { aria: { seated: true }, leon: { seated: true }, mira: { inspect: true } },
      items: [ground("medicine", 69)],
    },
    { at: 2, items: [ground("medicine", 69), ground("tea", 50, 16, 14)] },
    { at: 4, actors: { mira: { inspect: false, seated: true } } },
    { at: 5, actors: { aria: { reaction: "nod" } } },
    {
      at: 10,
      items: [ground("medicine", 77), ground("tea", 50, 16, 14), ground("bread", 35, 13, 11)],
    },
  ]),
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
  "waiting-households-return": scene("patient-room", trio(), [
    {
      at: 0,
      actors: { mira: { seated: true } },
      items: [ground("medicine", 49), held("honey", "mira", { width: 5 })],
      extras: [npc("parent", "家の人", 82), npc("child", undefined, 62)],
    },
    { at: 1, actors: { mira: { pose: "offer" } } },
  ]),
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
      items: [table(56), onTable("ledger", 56), ground("medicine", 78)],
    },
    { at: 3, actors: { aria: { pose: "greet" } } },
    { at: 6, actors: { aria: { reaction: "surprise" } } },
    {
      at: 9,
      actors: { mira: { seated: true } },
      items: [table(56), onTable("tea", 56), ground("medicine", 78)],
    },
    { at: 10, actors: { aria: { x: 34, pose: "offer" } } },
  ]),
};
