import type { StageItem } from "./story-stage-cues.ts";
import { held, npc, type LaterBeat } from "./story-stage-later-shared.ts";
import { finishedLanternItems } from "./story-stage-lantern-items.ts";

const porter = () => ({ ...npc("worker", "荷運び人", 74), bottom: 36, notebook: true });
const receipt = (owner: "aria" | "leon", folded = false, turn = 0): StageItem[] => [
  ...finishedLanternItems(),
  held(folded ? "folded-paper" : "paper", owner, {
    id: "request-copy",
    width: folded ? 4.2 : 6,
    wrist: true,
    turn,
  }),
];

/** His notebook is in the writing atlas. The separate request copy is never that notebook. */
export const lanternAddressBeats: LaterBeat[] = [
  {
    at: 18,
    extras: [{ ...porter(), writing: true }],
    actors: {
      aria: {
        x: 67,
        bottom: 34,
        left: false,
        pose: "offer",
        via: [
          { x: 38, bottom: 24 },
          { x: 67, bottom: 24 },
        ],
      },
      leon: { x: 82, bottom: 30, left: true, pose: "offer" },
      mira: {
        x: 34,
        bottom: 14,
        left: false,
        via: [
          { x: 85, bottom: 4 },
          { x: 34, bottom: 4 },
        ],
      },
      finn: {
        x: 19,
        bottom: 14,
        left: false,
        via: [
          { x: 91, bottom: 0 },
          { x: 19, bottom: 0 },
        ],
      },
    },
    items: finishedLanternItems(),
    sequence: [{ after: 2000, extras: [porter()] }],
  },
  { at: 19, extras: [{ ...porter(), speaking: true }] },
  {
    at: 21,
    actors: { aria: { pose: "offer", via: undefined, nameOffset: -20 }, leon: { nameOffset: 20 } },
    sequence: [
      { after: 650, actors: { aria: { pose: "tease" } } },
      {
        after: 1400,
        extras: [{ ...porter(), bottom: 48 }],
        actors: {
          leon: { writing: true },
          aria: {
            x: 75,
            bottom: 30,
            pose: "offer",
            via: [
              { x: 67, bottom: 24 },
              { x: 75, bottom: 24 },
            ],
          },
        },
      },
      {
        after: 3400,
        actors: { leon: { writing: false, pose: "offer" }, aria: { via: undefined } },
        items: receipt("leon"),
      },
      { after: 4200, items: receipt("aria") },
      { after: 5000, items: receipt("aria", false, 75) },
      { after: 5700, items: receipt("aria", true) },
      {
        after: 6500,
        actors: {
          aria: { x: 69, bottom: 18, nameOffset: 0, carry: true },
          leon: { nameOffset: 0 },
        },
      },
    ],
  },
];
