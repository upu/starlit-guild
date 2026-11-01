import { ground, held, table, onTable, type LaterBeat } from "./story-stage-later-shared.ts";
import type { StageItem } from "./story-stage-cues.ts";
import { chair } from "./story-stage-furniture.ts";
import { actor } from "./story-stage-later-shared.ts";

export const licoSampleBag = () =>
  held("tool-rucksack", "lico", {
    id: "lico-sample-bag",
    x: -5,
    bottom: 23,
    width: 6,
    behindOwner: true,
  });
const width = 5;
const handBottom = (y: number) => 27 + (width / 1.3) * 0.75 - (((128 - y) * 19) / 128) * 1.5;
const dish = (owner?: "aria" | "lico"): StageItem =>
  owner
    ? held("sample-dish", owner, { width, x: 0, bottom: 0, wrist: true })
    : { ...ground("sample-dish", 64.3671875, 27, width), support: "table" };
const items = (sample: StageItem) => [table(), onTable("ledger"), sample];

export const foundingSample: LaterBeat[] = [
  {
    at: 16,
    furniture: [
      { ...chair(actor("finn", 74, { bottom: 14, left: true }), 19), id: "representative-chair" },
    ],
    actors: {
      aria: { x: 66, bottom: handBottom(76), lane: -25, carry: true, left: true },
      // Clear the chair beside the table while the specimen is being handled.
      finn: {
        seated: false,
        x: 91,
        bottom: 37,
        via: [
          { x: 75, bottom: 14 },
          { x: 75, bottom: 55 },
          { x: 91, bottom: 55 },
        ],
      },
    },
    items: items(dish("aria")),
    sequence: [
      { after: 3800, actors: { aria: { carry: false, pose: "offer" } }, items: items(dish()) },
      {
        after: 4400,
        actors: { aria: { x: 78, bottom: -15, lane: undefined, via: [{ x: 66, bottom: -15 }] } },
      },
    ],
  },
  {
    at: 18,
    actors: {
      lico: {
        x: 68.375,
        bottom: handBottom(80),
        left: true,
        mossStudy: "reach",
        via: [
          { x: 83, bottom: 0 },
          { x: 70, bottom: 0 },
        ],
      },
    },
    sequence: [{ after: 1800, actors: { lico: { via: undefined } }, items: items(dish("lico")) }],
  },
  {
    at: 21,
    actors: { aria: { x: 19, bottom: 14, via: undefined, lane: -25 } },
    sequence: [
      { after: 800, actors: { lico: { mossStudy: "write" } }, items: items(dish()) },
      { after: 2400, actors: { lico: { mossStudy: "reach" } }, items: items(dish("lico")) },
      {
        after: 3200,
        items: items({
          ...dish(),
          support: undefined,
          x: 0,
          bottom: 0,
          carrier: "lico-sample-bag",
          stored: true,
        }),
      },
      {
        after: 3600,
        actors: {
          lico: {
            x: 83,
            bottom: 14,
            mossStudy: undefined,
            via: [
              { x: 70, bottom: 0 },
              { x: 83, bottom: 0 },
            ],
          },
        },
      },
    ],
  },
];
