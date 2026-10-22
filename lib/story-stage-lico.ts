import { scene, trio, actor, held, ground, type LaterStage } from "./story-stage-later-shared.ts";
import { licoRecordsStages } from "./story-stage-lico-records.ts";
import { lowSeat } from "./story-stage-low-seats.ts";
// These sit inside the painted bed beside the left channel, not in the walking lane.
const plants = () => ground("colony", 7, 45, 12);
const plantLabel = () => ground("plant-label", 12, 44, 2.8);
const withLico = () => [actor("aria", 20), actor("leon", 41), actor("mira", 62), actor("lico", 82)];
const restStools = () => [
  { ...ground("step-stool", 72, 23.97, 6.3), id: "lico-stool", seatFor: "lico" as const },
  lowSeat(actor("mira", 82, { bottom: 22, left: true }), "step-stool"),
];
const notebook = (owner: "aria" | "lico", closed = true, x = 4) =>
  held(closed ? "closed-ledger" : "ledger", owner, { id: "ledger", width: closed ? 5 : 7, x });
const bag = (owner: "aria" | "mira") =>
  held("delivery-bag", owner, { id: "medicine", width: 6.5, bottom: 19 });
const restItems = (closed = true) => [
  plants(),
  notebook("lico", closed),
  bag("mira"),
  ground("bread", 69, 13, 8),
];
export const licoStages: Record<string, LaterStage> = {
  "brekka-moss-beds-departure": scene(
    "moss-beds",
    trio(),
    [
      { at: 0, items: [plants()] },
      { at: 1, actors: { aria: { x: 23, bottom: 38, inspect: true, left: true } } },
      { at: 2, actors: { leon: { pose: "offer" } } },
      { at: 4, actors: { aria: { inspect: false, left: false } } },
    ],
    { furniture: [plantLabel()] },
  ),
  "brekka-moss-beds-return": scene(
    "moss-beds",
    withLico(),
    [
      { at: 0, actors: { lico: { visible: false, x: 110 } }, items: [plants()] },
      {
        at: 2,
        actors: {
          lico: { visible: true, x: 82, pose: "surprise", name: "小柄な女性" },
          aria: { reaction: "surprise" },
        },
      },
      { at: 5, actors: { leon: { x: 46 } } },
      { at: 7, items: [plants(), held("ledger", "lico")] },
      { at: 9, actors: { lico: { name: "リコ" } } },
      {
        at: 15,
        actors: { lico: { x: 34, lane: 0, pose: "offer" }, aria: { pose: "surprise" } },
        items: [plants(), held("ledger", "lico")],
      },
      { at: 17, actors: { aria: { reaction: "surprise" } } },
      { at: 22, actors: { lico: { x: 79, lane: 0 }, mira: { pose: "think" } } },
      { at: 32, items: [plants(), held("ledger", "lico"), ground("bread", 74, 13, 8)] },
      { at: 37, actors: { lico: { pose: "think" } } },
      {
        at: 42,
        actors: {
          lico: {
            x: 23,
            bottom: 38,
            inspect: true,
            left: true,
            via: [
              { x: 79, bottom: 48 },
              { x: 23, bottom: 48 },
            ],
          },
          mira: { x: 38, bottom: 38, left: true },
        },
        items: restItems(false),
      },
      { at: 43, actors: { lico: { inspect: true } } },
      {
        at: 45,
        actors: {
          lico: { inspect: true, pose: "think" },
          mira: { x: 31, bottom: 38, pose: "offer", left: true },
        },
        items: restItems(),
        sequence: [
          { after: 700, actors: { lico: { inspect: false } } },
          {
            after: 1300,
            actors: {
              lico: {
                x: 72,
                bottom: 22,
                left: false,
                seated: true,
                stool: true,
                via: [
                  { x: 23, bottom: 28 },
                  { x: 72, bottom: 28 },
                ],
              },
              mira: {
                x: 82,
                bottom: 22,
                via: [
                  { x: 31, bottom: 28 },
                  { x: 82, bottom: 28 },
                ],
              },
            },
          },
        ],
      },
      { at: 49, actors: { mira: { seated: true, perch: true, via: undefined } } },
      {
        at: 50,
        actors: {
          aria: {
            x: 64,
            bottom: 18,
            pose: "offer",
            left: false,
            via: [
              { x: 20, bottom: 0 },
              { x: 64, bottom: 0 },
            ],
          },
          lico: { left: true },
        },
        sequence: [
          {
            after: 2600,
            items: [plants(), notebook("aria"), bag("mira"), ground("bread", 69, 13, 8)],
          },
          {
            after: 3400,
            actors: {
              mira: { left: false },
              aria: {
                x: 90,
                bottom: 18,
                left: true,
                via: [
                  { x: 64, bottom: 0 },
                  { x: 90, bottom: 0 },
                ],
              },
            },
          },
          {
            after: 5500,
            items: [plants(), notebook("aria", true, -4), bag("aria"), ground("bread", 69, 13, 8)],
          },
          {
            after: 6300,
            actors: {
              aria: {
                x: 55,
                bottom: 0,
                via: [
                  { x: 90, bottom: 0 },
                  { x: 55, bottom: 0 },
                ],
              },
            },
          },
          {
            after: 8500,
            actors: { aria: { inspect: true } },
            items: [
              plants(),
              { ...ground("closed-ledger", 50, 2, 5), id: "ledger" },
              { ...ground("delivery-bag", 60, 2, 6.5), id: "medicine" },
              ground("bread", 69, 13, 8),
            ],
          },
          {
            after: 9300,
            actors: {
              aria: {
                x: 20,
                bottom: 14,
                inspect: false,
                via: [
                  { x: 55, bottom: 0 },
                  { x: 20, bottom: 0 },
                ],
              },
            },
          },
        ],
      },
    ],
    { initial: { lico: 110 }, furniture: [plantLabel(), ...restStools()] },
  ),
  ...licoRecordsStages,
};
