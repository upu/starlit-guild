import type { LaterBeat } from "./story-stage-later-shared.ts";
import type { RestItems } from "./story-stage-stone-rest-items.ts";
type Sequence = NonNullable<LaterBeat["sequence"]>;
export function stoneTea(items: RestItems): LaterBeat[] {
  return [
    collectCup(items),
    {
      at: 21,
      actors: {
        aria: {
          x: 34,
          bottom: 21,
          left: false,
          via: [
            { x: 36, bottom: 8 },
            { x: 34, bottom: 8 },
          ],
        },
        leon: {
          x: 84,
          bottom: 23,
          left: false,
          via: [
            { x: 72, bottom: 14 },
            { x: 84, bottom: 14 },
          ],
        },
      },
      items: items({ kettle: "leon" }),
      sequence: [...rightSeats(items), ...leftSeats(items), ...lastSeat(items)],
    },
  ];
}
function collectCup(items: RestItems): LaterBeat {
  return {
    at: 20,
    actors: {
      aria: { inspect: false, pose: "offer" },
      mira: { pose: "offer" },
      leon: {
        x: 66,
        bottom: 19,
        left: true,
        pose: "offer",
        via: [
          { x: 71, bottom: 40 },
          { x: 71, bottom: 19 },
        ],
      },
    },
    sequence: [
      { after: 400, items: items({ clothDown: true }) },
      {
        after: 650,
        actors: {
          aria: {
            x: 36,
            bottom: 25,
            left: true,
            via: [{ x: 36, bottom: 40 }],
          },
        },
      },
      { after: 2300, items: items({ paper: "bag" }) },
      { after: 2700, items: items({ cup: "aria" }) },
    ],
  };
}
function rightSeats(items: RestItems): Sequence {
  return [
    { after: 1500, items: items({ cup: "table", kettle: "fire" }) },
    {
      after: 1600,
      actors: {
        aria: { x: 40, bottom: 6, left: false, via: [{ x: 34, bottom: 6 }] },
        leon: {
          x: 64,
          bottom: 7,
          left: true,
          via: [
            { x: 84, bottom: 3 },
            { x: 64, bottom: 3 },
          ],
        },
      },
    },
    { after: 1850, actors: { finn: { x: 84, bottom: 23.96875, left: true, via: undefined } } },
    { after: 2400, items: items({ chair: "finn" }), actors: { finn: { carry: true } } },
    { after: 2950, actors: { finn: { x: 76 } } },
    {
      after: 3500,
      items: items({ chair: undefined, arranged: 1 }),
      actors: { finn: { carry: false } },
    },
    { after: 3750, actors: { finn: { x: 86, bottom: 8.96875, via: [{ x: 86, bottom: 24 }] } } },
    {
      after: 4800,
      items: items({ chair: "leon" }),
      actors: { finn: { carry: true, via: undefined } },
    },
    { after: 5200, actors: { finn: { x: 76 } } },
    {
      after: 5700,
      items: items({ chair: undefined, arranged: 2 }),
      actors: { finn: { carry: false } },
    },
    {
      after: 6000,
      actors: { leon: { x: 70, bottom: 11, seated: true, chair: true, via: undefined } },
    },
  ];
}
function leftSeats(items: RestItems): Sequence {
  return [
    {
      after: 6100,
      actors: {
        finn: {
          x: 16,
          bottom: 8.96875,
          left: false,
          via: [
            { x: 76, bottom: -10 },
            { x: 16, bottom: -10 },
          ],
        },
      },
    },
    {
      after: 9300,
      items: items({ chair: "aria" }),
      actors: { finn: { carry: true, via: undefined } },
    },
    { after: 9700, actors: { finn: { x: 28 } } },
    {
      after: 10300,
      items: items({ chair: undefined, arranged: 3 }),
      actors: { finn: { carry: false } },
    },
    {
      after: 10600,
      actors: { aria: { x: 34, bottom: 11, seated: true, chair: true, via: undefined } },
    },
    {
      after: 10700,
      actors: {
        finn: {
          x: 22,
          bottom: 22.96875,
          via: [
            { x: 16, bottom: 10 },
            { x: 16, bottom: 22.96875 },
          ],
        },
        mira: { seated: false, x: 38, bottom: 34, via: undefined },
      },
    },
  ];
}
function lastSeat(items: RestItems): Sequence {
  return [
    {
      after: 12100,
      items: items({ chair: "mira" }),
      actors: { finn: { carry: true, via: undefined } },
    },
    { after: 12500, actors: { finn: { x: 24 } } },
    {
      after: 12900,
      items: items({ chair: undefined, arranged: 4 }),
      actors: { finn: { carry: false } },
    },
    { after: 13200, actors: { mira: { x: 30, bottom: 25, seated: true, chair: true } } },
    {
      after: 13300,
      actors: {
        finn: {
          x: 70,
          bottom: 26,
          left: true,
          via: [
            { x: 24, bottom: 59 },
            { x: 70, bottom: 59 },
          ],
        },
      },
    },
    {
      after: 16500,
      actors: { finn: { seated: true, chair: true, via: undefined } },
      items: items({ heated: true }),
    },
  ];
}
