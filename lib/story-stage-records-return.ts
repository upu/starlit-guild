import { ground, held, type LaterBeat } from "./story-stage-later-shared.ts";
import {
  basket,
  dryBoard,
  fieldCopy,
  fieldKeeper,
  fieldRecord,
  lap,
  notebook,
  quietKit,
  smoke,
} from "./story-stage-records-field-items.ts";

const returned = () => [notebook(true), fieldRecord("lico")];
const floor = () => [...quietKit(), basket(false)];
const reading = () => [...floor(), ...lap(), fieldCopy()];
const copied = () =>
  held("paper", "lico", { id: "order-copy", x: 2.7, bottom: 27, width: 3.5, support: "lap-board" });
const compared = () => [...floor(), ...lap(), copied()];
const folded = () => [
  ...quietKit(),
  ...lap().filter((p) => p.id !== "lico-book"),
  notebook(true),
  copied(),
  basket(),
];
export const recordsReturnBeats: LaterBeat[] = [
  {
    at: 0,
    finishBeforeAdvance: true,
    actors: { leon: { inspect: true, left: false } },
    extras: [fieldKeeper({ x: 84, bottom: 32 })],
    items: [
      ...quietKit(),
      dryBoard(),
      fieldCopy(),
      basket(),
      notebook(true),
      { ...ground("record-board", 65, 4, 7), id: "records" },
      ...smoke(true),
    ],
    sequence: [
      {
        after: 800,
        actors: { leon: { inspect: false, pose: "offer" } },
        items: [
          ...quietKit(),
          dryBoard(),
          fieldCopy(),
          basket(),
          notebook(true),
          { ...fieldRecord("leon"), wrist: true },
          ...smoke(true),
        ],
      },
      {
        after: 1700,
        items: [
          ...quietKit(),
          dryBoard(),
          fieldCopy(),
          basket(),
          notebook(true),
          { ...fieldRecord("lico"), wrist: true },
          ...smoke(true),
        ],
      },
      { after: 3000, items: [...quietKit(), dryBoard(), fieldCopy(), basket(), ...returned()] },
    ],
  },
  {
    at: 4,
    finishBeforeAdvance: true,
    actors: { aria: { carry: false, pose: "offer" } },
    items: [...floor(), dryBoard(), fieldCopy(), ...returned()],
  },
  {
    at: 8,
    finishBeforeAdvance: true,
    actors: {
      aria: {
        x: 60,
        bottom: 0,
        via: [
          { x: 28, bottom: -20 },
          { x: 60, bottom: -20 },
        ],
        inspect: true,
        left: false,
      },
      leon: { x: 52, bottom: 28, via: [{ x: 52, bottom: 7 }], left: false },
    },
    sequence: [
      {
        after: 3200,
        items: [
          ...floor(),
          fieldCopy(),
          ...returned(),
          { ...dryBoard(), actor: "aria", x: 0, bottom: 14, wrist: true },
        ],
      },
      {
        after: 3800,
        actors: {
          aria: { x: 60.8125, bottom: 5.5, via: undefined, inspect: false, pose: "offer" },
        },
      },
      {
        after: 4600,
        items: [
          ...floor(),
          fieldCopy(),
          ...returned(),
          { ...dryBoard(), actor: "lico", x: 0, bottom: 14, wrist: true },
        ],
      },
      { after: 5200, actors: { lico: { recordStudy: "read", left: true } }, items: reading() },
      {
        after: 5800,
        actors: {
          aria: {
            x: 14,
            bottom: 14,
            via: [
              { x: 60, bottom: -20 },
              { x: 14, bottom: -20 },
            ],
            left: false,
          },
        },
      },
    ],
  },
  { at: 9, actors: { lico: { recordStudy: "point" } } },
  { at: 11, actors: { lico: { recordStudy: "page" } } },
  { at: 12, extras: [fieldKeeper({ x: 84, bottom: 32, pose: "explain" })] },
  {
    at: 13,
    finishBeforeAdvance: true,
    actors: {
      finn: {
        x: 63,
        bottom: 9,
        via: [
          { x: 47, bottom: -20 },
          { x: 63, bottom: -20 },
        ],
        pose: "offer",
        left: false,
      },
      lico: { recordStudy: "point" },
    },
    items: [...floor(), ...lap(), { ...fieldCopy(), bottom: 28 }],
    sequence: [
      { after: 2400, items: compared() },
      {
        after: 3200,
        actors: {
          finn: {
            x: 47,
            bottom: -5,
            via: [
              { x: 63, bottom: -20 },
              { x: 47, bottom: -20 },
            ],
            left: false,
          },
        },
      },
    ],
  },
  { at: 16, actors: { lico: { recordStudy: "read", left: true } } },
  { at: 17, actors: { lico: { recordStudy: "point" } } },
  {
    at: 20,
    actors: { lico: { recordStudy: "page" } },
    items: [
      ...floor(),
      ...lap().map((p) => (p.id === "lico-book" ? { ...p, x: 3.2 } : p)),
      copied(),
    ],
    sequence: [{ after: 850, actors: { lico: { recordStudy: "read" } }, items: compared() }],
  },
  { at: 24, extras: [fieldKeeper({ x: 84, bottom: 32, pose: "point" })] },
  {
    at: 26,
    finishBeforeAdvance: true,
    actors: {
      aria: { x: 27, bottom: 36, via: [{ x: 24, bottom: 20 }], inspect: true, left: true },
    },
    sequence: [
      {
        after: 1500,
        actors: { aria: { inspect: false, carry: true } },
        items: [...quietKit(), ...lap(), copied(), basket()],
      },
      {
        after: 2200,
        actors: {
          aria: {
            x: 60.8125,
            bottom: 5.5,
            left: false,
            via: [
              { x: 24, bottom: -20 },
              { x: 60, bottom: -20 },
            ],
          },
        },
      },
    ],
  },
  {
    at: 27,
    finishBeforeAdvance: true,
    actors: { lico: { recordStudy: "hug", left: false } },
    items: [
      ...folded(),
      { ...ground("moss", 76, 20, 3), id: "first-seedling", support: "samples" },
    ],
    sequence: [
      {
        after: 700,
        items: [
          ...folded(),
          held("moss", "lico", {
            id: "first-seedling",
            width: 3,
            wrist: true,
            wristAnchor: "bottom",
          }),
        ],
      },
      { after: 1300, actors: { lico: { left: true } } },
      {
        after: 2000,
        items: [
          ...folded(),
          { ...ground("moss", 0, 5.5, 3), id: "first-seedling", carrier: "basket" },
        ],
      },
    ],
  },
  { at: 30, actors: { lico: { seated: true, recordStudy: "hug" } } },
];
