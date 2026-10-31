import type { StageExtra } from "./story-stage-cues.ts";
import { actor, ground, held, npc, scene, type LaterBeat } from "./story-stage-later-shared.ts";
import { chair } from "./story-stage-furniture.ts";
import { restItems, type RestItems, type RestState } from "./story-stage-stone-rest-items.ts";
import { stoneTea } from "./story-stage-stone-tea.ts";
const mason = (patch: Partial<StageExtra> = {}): StageExtra => ({
  ...npc("worker", "石工", 28),
  bottom: 60,
  left: true,
  ...patch,
});
function outside(): LaterBeat[] {
  const items = [
    { ...ground("candidate-blue", 16, 12, 6.2), id: "blue-stone" },
    { ...ground("candidate-violet", 42, 12, 6.2), id: "violet-stone" },
    { ...ground("candidate-dull", 51, 12, 6.2), id: "dull-stone" },
    chair(actor("mira", 58, { bottom: 31, left: true })),
    ground("basket", 16, 4, 7),
    ground("delivery-bag", 77, 5, 8),
    ground("medicine-closed", 71.5, 24.3, 8),
  ];
  return [
    {
      at: 0,
      items,
      extras: [{ ...mason(), x: 30, bottom: 44 }],
      actors: { finn: { x: 59, bottom: 13 } },
      sequence: [{ after: 600, actors: { finn: { inspect: true } } }],
    },
    { at: 1, actors: { finn: { inspect: true } } },
    {
      at: 2,
      actors: { aria: { x: 34.6, bottom: 14, pose: "offer" } },
      items: [
        ...items,
        held("light-cloth", "aria", {
          id: "comparison-cloth",
          x: 3.4,
          bottom: 23,
          width: 3.5,
          glow: "dim",
          glowTone: "violet",
        }),
      ],
      sequence: [{ after: 650, actors: { aria: { inspect: true } } }],
    },
  ];
}
function compare(items: RestItems): LaterBeat[] {
  return [
    {
      at: 4,
      background: "stone-storeroom",
      cast: [
        actor("aria", 48.6, { bottom: 49, inspect: true, left: false }),
        actor("leon", 38, { bottom: 49, inspect: true, left: false }),
        actor("mira", 28, { bottom: 25, seated: true, chair: true, left: false }),
        actor("finn", 88, { bottom: 44, left: true }),
      ],
      extras: [mason()],
      items: items({ comparison: "open" }),
      sequence: [
        { after: 900, items: items({ comparison: "dull" }) },
        {
          after: 2000,
          actors: {
            aria: {
              x: 39,
              inspect: false,
              via: [
                { x: 48.6, bottom: 60 },
                { x: 39, bottom: 60 },
              ],
            },
            leon: {
              x: 64,
              inspect: false,
              left: true,
              via: [
                { x: 38, bottom: 35 },
                { x: 64, bottom: 35 },
              ],
            },
          },
        },
        {
          after: 3400,
          actors: { aria: { inspect: true, left: false }, leon: { inspect: true } },
          items: items({ comparison: "violet" }),
        },
        { after: 3800, actors: { aria: { x: 34.6, inspect: false, via: undefined } } },
        { after: 4300, actors: { aria: { inspect: true } } },
        {
          after: 4500,
          actors: {
            leon: { x: 74, bottom: 44, inspect: false, left: true, via: [{ x: 70, bottom: 49 }] },
          },
        },
      ],
    },
    { at: 5, actors: { aria: { inspect: true } } },
    { at: 7, extras: [mason({ pose: "explain", speaking: true })] },
    { at: 8, extras: [mason({ pose: "explain", speaking: true })] },
    { at: 10, actors: { aria: { inspect: true } } },
  ];
}
function paper(items: RestItems): LaterBeat[] {
  return [
    {
      at: 12,
      extras: [mason({ writing: true })],
      items: items({ paper: "worker" }),
      actors: {
        finn: {
          x: 36,
          bottom: 60,
          left: true,
          pose: "offer",
          via: [
            { x: 88, bottom: 62 },
            { x: 36, bottom: 62 },
          ],
        },
      },
      sequence: [
        { after: 2300, extras: [mason({ pose: "explain" })], items: items({ paper: "finn" }) },
        {
          after: 2900,
          actors: { finn: { x: 66, bottom: 44, left: false, via: [{ x: 66, bottom: 60 }] } },
        },
        { after: 4600, actors: { leon: { pose: "offer" } }, items: items({ paper: "leon" }) },
      ],
    },
    {
      at: 15,
      actors: {
        mira: { seated: false, healing: "rise", pose: "think" },
        finn: {
          x: 96,
          bottom: 34,
          left: true,
          via: [{ x: 96, bottom: 44 }],
        },
      },
      sequence: [{ after: 900, actors: { mira: { seated: true, healing: undefined } } }],
    },
    { at: 16, actors: { aria: { left: true } } },
  ];
}
function beats() {
  let state: RestState = {};
  const items: RestItems = (patch = {}) => restItems((state = { ...state, ...patch }));
  return [...outside(), ...compare(items), ...paper(items), ...stoneTea(items)];
}
export const stoneRest = scene(
  "stone-yard",
  [
    actor("aria", 22, { bottom: 14, left: false }),
    actor("leon", 43, { bottom: 28, left: true }),
    actor("mira", 58, { bottom: 31, seated: true, chair: true, left: true }),
    actor("finn", 65, { bottom: 13, left: true }),
  ],
  beats(),
);
