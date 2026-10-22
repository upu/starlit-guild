import type { StageItem } from "./story-stage-cues.ts";
import { ground, held, npc, type LaterBeat } from "./story-stage-later-shared.ts";

const notebook = (): StageItem[] => [
  { ...ground("stone-lantern", 51, 32, 17), glow: "bright" },
  { ...ground("ledger", -4, 45, 6), id: "carrier-notebook", extra: "worker" },
];
const receipt = (owner: "aria" | "leon", folded = false): StageItem[] => [
  ...notebook(),
  held(folded ? "folded-paper" : "paper", owner, {
    id: "request-copy",
    width: folded ? 4.2 : 6,
    bottom: 27,
  }),
];

/** The carrier keeps his notebook; the separate request copy passes from Leon to Aria. */
export const lanternAddressBeats: LaterBeat[] = [
  {
    at: 18,
    extras: [npc("worker", "荷運び人", 74, "point")],
    actors: {
      aria: { x: 62, bottom: 30, left: false, pose: "offer" },
      leon: { x: 78, bottom: 14, left: true, pose: "offer" },
      mira: { x: 34, bottom: 14, left: false },
      finn: { x: 19, bottom: 14, left: false },
    },
    items: notebook(),
  },
  {
    at: 19,
    extras: [npc("worker", "荷運び人", 74, "explain", true)],
  },
  {
    at: 21,
    actors: {
      aria: { x: 66, bottom: 30, pose: "offer", nameOffset: -10 },
      leon: { nameOffset: 10 },
    },
    sequence: [
      {
        after: 1200,
        actors: {
          leon: { writing: true },
          aria: { x: 70, bottom: 14, via: [{ x: 62, bottom: 14 }] },
        },
        // The writing frames contain their own sheet and quill.
        items: notebook(),
      },
      {
        after: 3200,
        actors: { leon: { writing: false, pose: "offer" }, aria: { via: undefined } },
        items: receipt("leon"),
      },
      { after: 3900, items: receipt("aria") },
      { after: 4800, items: receipt("aria", true) },
      { after: 5600, actors: { aria: { x: 64, nameOffset: 0 }, leon: { nameOffset: 0 } } },
    ],
  },
];
