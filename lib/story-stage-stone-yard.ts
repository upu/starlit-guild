import type { StageExtra } from "./story-stage-cues.ts";
import { actor, npc, scene, type LaterBeat } from "./story-stage-later-shared.ts";
import { yardItems, type YardState } from "./story-stage-stone-yard-items.ts";

const mason = (speaking = false): StageExtra => ({
  ...npc("worker", "石工", 30),
  bottom: 44,
  pose: speaking ? "explain" : "idle",
  speaking,
});
const carrier = (patch: Partial<StageExtra> = {}): StageExtra => ({
  ...npc("stone-carrier", "石を運ぶ人", 83),
  bottom: 48,
  ...patch,
});
const extras = (patch: Partial<StageExtra> = {}, speaking = false) => [
  mason(speaking),
  carrier(patch),
];
type Items = (patch?: YardState) => ReturnType<typeof yardItems>;

function treatHand(items: Items): LaterBeat[] {
  return [
    {
      at: 13,
      items: items({ wrap: "ground", cargo: "lower" }),
      extras: extras({ care: "palm" }),
      actors: { mira: { inspect: false, packing: false } },
      sequence: [
        {
          after: 600,
          items: items({ cargo: "floor" }),
          extras: extras({ care: "sore" }),
          actors: { mira: { x: 75, bottom: 49.5, left: false, via: [{ x: 68, bottom: 41 }] } },
        },
      ],
    },
    {
      at: 14,
      actors: { mira: { inspect: false, healing: "treat", pose: "offer" } },
      extras: extras({ care: "palm" }),
    },
    {
      at: 15,
      actors: { mira: { inspect: false, healing: "treat" } },
      sequence: [
        { after: 900, extras: extras({ care: "bandaged" }) },
        { after: 1300, actors: { mira: { healing: "rise" } } },
        { after: 1900, actors: { mira: { healing: "steady" } } },
        {
          after: 2400,
          actors: {
            mira: {
              x: 66,
              bottom: 43,
              left: false,
              healing: undefined,
              via: [{ x: 75, bottom: 43 }],
            },
            finn: { x: 95, bottom: 33, left: true, via: [{ x: 92, bottom: 22 }] },
          },
        },
        { after: 3500, items: items({ chair: "moving" }), actors: { finn: { carry: true } } },
        { after: 4200, actors: { finn: { x: 64, bottom: 30, left: true, via: undefined } } },
        {
          after: 5700,
          items: items({ chair: "offered" }),
          actors: { finn: { carry: false, pose: "offer" } },
        },
        {
          after: 6400,
          actors: { finn: { x: 82, bottom: 22, left: true, via: [{ x: 76, bottom: 30 }] } },
        },
      ],
    },
    { at: 16, extras: extras({ care: "rest" }) },
    { at: 17, actors: { mira: { x: 112, bottom: 32, left: false, via: [{ x: 80, bottom: 38 }] } } },
  ];
}
function yardBeats(): LaterBeat[] {
  let state: YardState = {};
  const items: Items = (patch = {}) => yardItems((state = { ...state, ...patch }));
  return [
    {
      at: 0,
      items: items(),
      extras: [mason(), carrier({ x: 112, carry: true })],
      sequence: [{ after: 300, extras: extras({ carry: true }) }],
    },
    { at: 1, extras: extras({ carry: true }, true) },
    { at: 3, extras: extras({ carry: true }, true) },
    { at: 4, actors: { finn: { pose: "think" } }, extras: extras({ carry: true }) },
    { at: 6, extras: extras({ carry: true }, true) },
    { at: 8, extras: extras({ carry: true }, true) },
    { at: 9, actors: { aria: { inspect: true } }, extras: extras({ carry: true }) },
    { at: 10, items: items({ comparing: true }) },
    { at: 11, actors: { aria: { inspect: false, pose: "offer" } } },
    { at: 12, items: items({ wrap: "held" }) },
    ...treatHand(items),
  ];
}
export const stoneYard = scene(
  "stone-yard",
  [
    actor("aria", 22, { bottom: 14, left: false }),
    actor("leon", 43, { bottom: 28, left: true }),
    actor("mira", 59, { bottom: 18, left: false }),
    actor("finn", 83, { bottom: 22, left: true }),
  ],
  yardBeats(),
);
