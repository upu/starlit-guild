import { ground, held, type LaterBeat } from "./story-stage-later-shared.ts";
import {
  basket,
  fieldFurniture,
  fieldKeeper,
  fieldRecord,
  kit,
  notebook,
  recordsFieldCast,
  smoke,
  tray,
} from "./story-stage-records-field-items.ts";

const stoolRecord = () => ({
  ...ground("record-board", 70, 16, 7),
  id: "records",
  support: "lico-stool",
});
export const recordsFieldBeats: LaterBeat[] = [
  {
    at: 32,
    background: "moss-beds",
    furniture: fieldFurniture(),
    cast: recordsFieldCast(),
    items: [...kit(), notebook(), fieldRecord()],
    extras: [fieldKeeper({ restoration: "read" })],
  },
  { at: 34, extras: [fieldKeeper({ pose: "explain", restoration: "read" })] },
  {
    at: 36,
    finishBeforeAdvance: true,
    actors: { leon: { x: 58, bottom: 10, pose: "offer", via: [{ x: 58, bottom: 25 }] } },
    extras: [fieldKeeper({ restoration: "receive" })],
    sequence: [
      { after: 1400, items: [...kit(), notebook(), fieldRecord("lico")] },
      {
        after: 2300,
        extras: [
          fieldKeeper({ x: 84, bottom: 32, restoration: undefined, via: [{ x: 87, bottom: 22 }] }),
        ],
      },
    ],
  },
  { at: 37, actors: { lico: { recordStudy: undefined, pose: "think", left: false } } },
  {
    at: 40,
    finishBeforeAdvance: true,
    actors: {
      aria: { x: 27, bottom: 36, inspect: true, left: true },
      lico: { recordStudy: undefined, pose: "offer", left: false },
    },
    items: [
      ...kit().filter((p) => p.id !== "samples"),
      tray(76),
      notebook(),
      fieldRecord("lico"),
      basket(false),
    ],
    sequence: [
      {
        after: 1100,
        actors: {
          aria: { inspect: false, carry: true },
          lico: { seated: false, recordStudy: undefined, mossStudy: "glasses" },
        },
        items: [
          ...kit().filter((p) => p.id !== "samples"),
          tray(76),
          notebook(true),
          stoolRecord(),
          basket(),
        ],
      },
    ],
  },
  {
    at: 42,
    finishBeforeAdvance: true,
    actors: {
      lico: {
        x: 38.5,
        bottom: 43,
        via: [
          { x: 55, bottom: 26 },
          { x: 40, bottom: 26 },
        ],
        left: false,
        mossStudy: "reach",
      },
    },
    items: [
      ...kit().filter((p) => p.id !== "samples"),
      tray(76),
      notebook(true),
      stoolRecord(),
      basket(),
    ],
    sequence: [
      {
        after: 2500,
        items: [
          ...kit(true).filter((p) => p.id !== "samples"),
          tray(76),
          notebook(true),
          stoolRecord(),
          basket(),
          held("reflector-cover", "lico", { id: "reflector-cover", x: 2.4, bottom: 17, width: 7 }),
          ...smoke(),
        ],
      },
      {
        after: 3200,
        items: [
          ...kit(true).filter((p) => p.id !== "samples"),
          tray(76),
          notebook(true),
          stoolRecord(),
          basket(),
          { ...ground("reflector-cover", 35, 41, 7), id: "reflector-cover" },
          ...smoke(),
        ],
      },
      {
        after: 3900,
        items: [
          ...kit(true).filter((p) => p.id !== "samples"),
          tray(76),
          notebook(true),
          stoolRecord(),
          basket(),
          { ...ground("reflector-cover-flat", 35, 41, 7), id: "reflector-cover" },
          ...smoke(),
        ],
      },
      {
        after: 4000,
        actors: {
          lico: {
            x: 54,
            bottom: 36,
            via: [{ x: 54, bottom: 32 }],
            mossStudy: "glasses",
            left: true,
          },
        },
      },
    ],
  },
  { at: 43, actors: { mira: { pose: "offer" } } },
  { at: 45, actors: { leon: { left: true, pose: "offer" } } },
  { at: 46, actors: { aria: { x: 38, bottom: 23, left: false, via: [{ x: 22, bottom: 29 }] } } },
];
