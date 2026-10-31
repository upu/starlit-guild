import { held, onTable, table, type LaterBeat } from "./story-stage-later-shared.ts";
import type { ResidentId } from "./home-actor.ts";

const paper = (id: ResidentId) => [
  table(),
  held("ledger", id, { width: 7, x: 0, bottom: 0, wrist: true }),
];

/** The paper makes one readable circuit, with Leon returning it to the desk last. */
export const registrationPaper: LaterBeat = {
  at: 35,
  actors: {
    aria: { x: 31, bottom: 18, writing: true, left: false, lane: 6 },
    leon: { x: 39, bottom: 0, pose: "offer", left: true },
    mira: { x: 53, bottom: 0, pose: "offer", left: true },
    lico: { x: 79, bottom: 14, pose: "offer", left: true },
  },
  // The writing sprite already includes the paper and quill.
  items: [table()],
  sequence: [
    {
      after: 2200,
      actors: { aria: { x: 29, bottom: 0, writing: false, carry: true, pose: "offer", lane: 0 } },
      items: paper("aria"),
    },
    {
      after: 3600,
      actors: { aria: { carry: false }, leon: { carry: true } },
      items: paper("leon"),
    },
    {
      after: 4500,
      actors: { leon: { left: false, carry: false }, mira: { carry: true } },
      items: paper("mira"),
    },
    { after: 5200, actors: { mira: { x: 57, bottom: 14, left: false, lane: 0 } } },
    { after: 6200, actors: { mira: { carry: false } }, items: paper("finn") },
    { after: 7200, actors: { lico: { carry: true } }, items: paper("lico") },
    {
      after: 7800,
      actors: { leon: { x: 91, bottom: 14, left: true, lane: -7 } },
    },
    {
      after: 10600,
      actors: { lico: { carry: false }, leon: { carry: true } },
      items: paper("leon"),
    },
    {
      after: 11400,
      actors: { leon: { x: 42, bottom: 14, left: false, lane: -7 } },
    },
    {
      after: 14400,
      actors: {
        aria: { x: 19, bottom: 14, lane: 0 },
        leon: { x: 42, bottom: 14, left: false, lane: undefined, carry: false },
        mira: { x: 51, bottom: 0, left: true, lane: 0 },
        lico: { x: 83, bottom: 14 },
      },
      items: [table(), onTable("ledger")],
    },
    { after: 15100, actors: { leon: { x: 35, bottom: 14 } } },
  ],
};
