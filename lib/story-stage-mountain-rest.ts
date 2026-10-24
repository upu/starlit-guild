import type { StageItem } from "./story-stage-cues.ts";
import { actor, ground, held, scene, type LaterStage } from "./story-stage-later-shared.ts";
import { lowSeat } from "./story-stage-low-seats.ts";

const cast = () => [
  actor("aria", 41, { seated: true, perch: true }),
  actor("leon", 56, { seated: true, perch: true, left: false }),
  actor("mira", 86, { perch: true, left: true }),
];
type TeaState = {
  boxOpen?: boolean;
  cups?: boolean;
  receiver?: "leon" | "mira";
  seated?: boolean;
  kettle?: "held" | "tilted" | "pouring";
  potOpen?: boolean;
  hot?: boolean;
  snack?: boolean;
};
function teaItems(state: TeaState = {}): StageItem[] {
  const kettle = state.kettle
    ? held("kettle", "aria", {
        width: 5,
        bottom: 25,
        left: true,
        tilt: state.kettle === "held" ? 0 : 20,
        pouring: state.kettle === "pouring",
      })
    : ground("kettle", 34, 9, 5);
  return [
    { ...ground(state.boxOpen ? "medicine" : "medicine-closed", 82, 14, 8), id: "medicine" },
    kettle,
    {
      ...ground(state.potOpen ? "teapot-open" : "teapot", 48, 22.4, 5),
      id: "teapot",
      support: "tea-stone",
      left: true,
      steaming: state.hot,
    },
    ...(state.cups
      ? [
          { ...ground("empty-cup", 36, 8, 2.8), id: "aria-cup" },
          { ...ground("empty-cup", 56, 8, 2.8), id: "leon-cup" },
          held("empty-cup", state.receiver ?? "leon", {
            id: "mira-cup",
            width: 2.8,
            bottom: state.seated ? 27.5 : 27,
          }),
        ]
      : []),
    ...(state.snack ? [ground("bread", 46, 6, 7)] : []),
  ];
}

export const mountainRest: LaterStage = scene(
  "mountain-road",
  cast(),
  [
    {
      at: 0,
      actors: { mira: { inspect: true } },
      items: teaItems(),
      sequence: [{ after: 650, items: teaItems({ boxOpen: true }) }],
    },
    { at: 1, actors: { mira: { inspect: true } } },
    {
      at: 2,
      actors: { aria: { seated: false, pose: "offer" } },
      items: teaItems({ boxOpen: true }),
      sequence: [{ after: 650, items: teaItems({ boxOpen: true, kettle: "held", potOpen: true }) }],
    },
    {
      at: 3,
      actors: { leon: { seated: false, pose: "offer" } },
      items: teaItems({ boxOpen: true, kettle: "held", potOpen: true, cups: true }),
    },
    {
      at: 4,
      items: teaItems({ kettle: "held", potOpen: true, cups: true }),
      actors: {
        mira: {
          inspect: false,
          x: 64,
          via: [
            { x: 86, bottom: 7 },
            { x: 64, bottom: 7 },
          ],
        },
      },
      sequence: [
        { after: 1800, actors: { mira: { pose: "offer", via: undefined } } },
        {
          after: 2200,
          items: teaItems({ kettle: "held", potOpen: true, cups: true, receiver: "mira" }),
        },
        {
          after: 3000,
          actors: {
            leon: { seated: true },
            mira: {
              x: 72,
              via: [
                { x: 64, bottom: 7 },
                { x: 72, bottom: 7 },
              ],
            },
          },
          items: teaItems({ kettle: "tilted", potOpen: true, cups: true, receiver: "mira" }),
        },
        {
          after: 3700,
          actors: { mira: { seated: true, via: undefined } },
          items: teaItems({
            kettle: "pouring",
            potOpen: true,
            cups: true,
            receiver: "mira",
            seated: true,
          }),
        },
        {
          after: 4600,
          items: teaItems({
            kettle: "held",
            potOpen: true,
            cups: true,
            receiver: "mira",
            seated: true,
            hot: true,
          }),
        },
        {
          after: 5300,
          actors: { aria: { seated: true, pose: "offer" } },
          items: teaItems({ cups: true, receiver: "mira", seated: true, hot: true }),
        },
      ],
    },
    { at: 5, actors: { aria: { reaction: "nod", pose: "offer" } } },
    { at: 6, actors: { mira: { pose: "offer" } } },
    { at: 8, actors: { mira: { pose: "offer" } } },
    {
      at: 10,
      actors: { aria: { pose: "idle" } },
      items: teaItems({ cups: true, receiver: "mira", seated: true, hot: true, snack: true }),
    },
  ],
  {
    furniture: [
      ...cast().map((a) => lowSeat(a.id === "mira" ? { ...a, x: 72 } : a)),
      { ...ground("tea-rock", 48, 14, 8.5), id: "tea-stone" },
    ],
  },
);
