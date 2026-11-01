import { actor, scene, type LaterBeat } from "./story-stage-later-shared.ts";
import { chair } from "./story-stage-furniture.ts";
import { brekkaDiningItems as props } from "./story-stage-brekka-dining-items.ts";
import { brekkaServing, diner, innkeeper } from "./story-stage-brekka-dining-service.ts";

const cast = [
  actor("aria", 53.5, { bottom: 10, left: false, seated: true, chair: true }),
  actor("leon", 66.5, { bottom: 10, left: true, seated: true, chair: true }),
  actor("mira", 36, { bottom: 18, left: false, seated: true, chair: true }),
  actor("finn", 84, { bottom: 14, left: true, seated: true, chair: true }),
];
const drinking: LaterBeat[] = [
  {
    at: 13,
    actors: { finn: { dining: "hold" } },
    items: props({ mira: "full", finn: "held", juice: "table" }),
    sequence: [
      { after: 800, actors: { finn: { dining: "sip" } } },
      { after: 1600, items: props({ mira: "full", finn: "sip", juice: "table" }) },
      {
        after: 3000,
        actors: { finn: { dining: "hold" } },
        items: props({ mira: "full", finn: "held", juice: "table" }),
      },
    ],
  },
  {
    at: 15,
    actors: { mira: { dining: "hold" } },
    items: props({ mira: "held", finn: "held", juice: "table" }),
    sequence: [
      {
        after: 900,
        actors: { mira: { dining: "sip" } },
        items: props({ mira: "sip", finn: "held", juice: "table" }),
      },
      {
        after: 2300,
        actors: { mira: { dining: "hold" } },
        items: props({ mira: "held", finn: "held", juice: "table" }),
      },
      {
        after: 3200,
        actors: { mira: { dining: undefined } },
        items: props({ mira: "full", finn: "held", juice: "table" }),
      },
    ],
  },
  {
    at: 17,
    extras: [innkeeper(), diner("sip")],
    items: props({ mira: "full", finn: "held", juice: "table", worker: "sip" }),
    sequence: [
      {
        after: 1200,
        extras: [innkeeper(), diner("hold")],
        items: props({ mira: "full", finn: "held", juice: "table", worker: "hold" }),
      },
      {
        after: 2000,
        extras: [innkeeper(), diner("reach")],
        items: props({ mira: "full", finn: "held", juice: "table", worker: "meal" }),
      },
    ],
  },
  {
    at: 20,
    actors: { finn: { dining: undefined }, mira: { dining: "reach" } },
    items: props({ mira: "full", finn: "full", juice: "table", worker: "meal", bread: true }),
    sequence: [{ after: 900, actors: { mira: { dining: "hold" } } }],
  },
];
export const brekkaDining = scene(
  "brekka-dining-room",
  cast,
  [
    {
      at: 0,
      extras: [innkeeper(80, 24.5, "place"), diner()],
      items: props({ placing: true }),
      sequence: [
        { after: 650, items: props() },
        { after: 1400, extras: [{ ...innkeeper(), via: [{ x: 80, bottom: 44 }] }, diner()] },
      ],
    },
    { at: 1, extras: [{ ...innkeeper(), pose: "explain", speaking: true }, diner()] },
    { at: 5, items: props({ juice: "waiting" }) },
    {
      at: 10,
      actors: { leon: { left: false } },
      sequence: [{ after: 900, actors: { leon: { left: true } } }],
    },
    brekkaServing,
    ...drinking,
    {
      at: 24,
      items: props({ mira: "full", finn: "full", juice: "table", worker: "meal" }),
      actors: { mira: { dining: undefined } },
      sequence: [
        {
          after: 900,
          actors: {
            aria: { seated: false, bottom: 0 },
            leon: { seated: false, bottom: 0 },
            mira: { seated: false, x: 29 },
            finn: { seated: false, x: 90 },
          },
        },
      ],
    },
  ],
  {
    furniture: cast.map((a) => chair(a)),
    exit: ["aria", "leon", "mira", "finn"],
    exitLanes: { mira: -14, finn: -14 },
  },
);
