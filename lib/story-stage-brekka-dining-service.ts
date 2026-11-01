import { npc, type LaterBeat } from "./story-stage-later-shared.ts";
import type { StageExtra } from "./story-stage-cues.ts";
import { brekkaDiningItems } from "./story-stage-brekka-dining-items.ts";

export const diner = (dining: StageExtra["dining"] = "hold"): StageExtra => ({
  ...npc("worker", "荷運び人", 6),
  bottom: 20,
  left: true,
  dining,
});
export const innkeeper = (x = 90, bottom = 43, service?: StageExtra["service"]): StageExtra => ({
  ...npc("merchant", "店主", x),
  bottom,
  service,
});
const extras = (owner: StageExtra) => [owner, diner()];

export const brekkaServing: LaterBeat = {
  at: 12,
  extras: extras({
    ...innkeeper(48, 24, "carry"),
    via: [
      { x: 90, bottom: 44 },
      { x: 48, bottom: 44 },
    ],
  }),
  items: brekkaDiningItems({ juice: "waiting", jug: "held" }),
  sequence: [
    { after: 4000, items: brekkaDiningItems({ juice: "waiting", jug: "pour" }) },
    { after: 5000, items: brekkaDiningItems({ mira: "full", juice: "waiting", jug: "held" }) },
    {
      after: 5700,
      extras: extras({
        ...innkeeper(81, 25, "carry"),
        via: [
          { x: 48, bottom: 44 },
          { x: 81, bottom: 44 },
        ],
      }),
    },
    { after: 9600, items: brekkaDiningItems({ mira: "full", juice: "waiting", jug: "pour" }) },
    {
      after: 10600,
      items: brekkaDiningItems({ mira: "full", finn: "full", juice: "waiting", jug: "held" }),
    },
    { after: 11300, extras: extras(innkeeper(94, 38, "carry")) },
    { after: 12500, items: brekkaDiningItems({ mira: "full", finn: "full", juice: "carried" }) },
    {
      after: 13200,
      extras: extras({
        ...innkeeper(65, 26, "place"),
        via: [
          { x: 94, bottom: 44 },
          { x: 65, bottom: 44 },
        ],
      }),
    },
    { after: 16500, items: brekkaDiningItems({ mira: "full", finn: "full", juice: "table" }) },
    {
      after: 17300,
      extras: extras({
        ...innkeeper(90, 43),
        via: [
          { x: 65, bottom: 44 },
          { x: 90, bottom: 44 },
        ],
      }),
    },
    {
      after: 18400,
      actors: { aria: { dining: "hold" }, leon: { dining: "hold" } },
      items: brekkaDiningItems({ mira: "full", finn: "full", juice: "held" }),
    },
    {
      after: 19400,
      actors: { aria: { dining: "reach" }, leon: { dining: "reach" } },
      items: brekkaDiningItems({ mira: "full", finn: "full", juice: "toast" }),
    },
    {
      after: 20600,
      actors: { aria: { dining: "sip" }, leon: { dining: "sip" } },
      items: brekkaDiningItems({ mira: "full", finn: "full", juice: "sip" }),
    },
    {
      after: 22000,
      actors: { aria: { dining: "hold" }, leon: { dining: "hold" } },
      items: brekkaDiningItems({ mira: "full", finn: "full", juice: "held" }),
    },
    {
      after: 23000,
      actors: { aria: { dining: undefined }, leon: { dining: undefined } },
      items: brekkaDiningItems({ mira: "full", finn: "full", juice: "table" }),
    },
  ],
};
