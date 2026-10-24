import { scene, trio, held, ground, type LaterStage } from "./story-stage-later-shared.ts";
import { blockadeApproach } from "./story-stage-blockade.ts";
import { recoveryCast, recoveryBeats } from "./story-stage-blockade-recovery.ts";
import { inventoryBeats, roadOpening } from "./story-stage-blockade-road.ts";
import { departureAndCare } from "./story-stage-blockade-care.ts";
import { golemReturn } from "./story-stage-golem-return.ts";
export const puppetStages: Record<string, LaterStage> = {
  "spinning-signpost-departure": scene(
    "mountain-road",
    trio(),
    [
      {
        at: 0,
        actors: { aria: { x: 36, inspect: true } },
        items: [ground("signpost", 47, 27, 15), held("map", "leon")],
      },
      {
        at: 4,
        actors: { aria: { inspect: false, reaction: "surprise" } },
        items: [ground("signpost", 57, 42, 15), ground("puppet", 57, 28, 9), held("map", "leon")],
      },
      { at: 6, actors: { aria: { x: 35, pose: "surprise" } } },
      { at: 8, actors: { leon: { x: 50, pose: "offer" } } },
      {
        at: 10,
        items: [ground("signpost", 78, 42, 15), ground("puppet", 78, 28, 9), held("map", "leon")],
      },
    ],
    { exit: ["aria", "leon", "mira"] },
  ),
  "spinning-signpost-return": scene("mountain-road", trio(), [
    {
      at: 0,
      actors: { leon: { inspect: true } },
      items: [ground("signpost", 56, 26, 15), ground("bread", 28)],
    },
    { at: 1, actors: { leon: { inspect: false } } },
    {
      at: 5,
      actors: { aria: { inspect: true } },
      items: [ground("signpost", 56, 26, 15), ground("cloth", 28)],
    },
    { at: 8, actors: { aria: { inspect: false, reaction: "surprise" } } },
    {
      at: 11,
      actors: { mira: { inspect: true } },
      items: [ground("signpost", 56, 26, 15), ground("cloth", 28), ground("honey", 69, 14, 6)],
    },
    {
      at: 14,
      actors: { mira: { inspect: false }, leon: { pose: "think" }, aria: { pose: "surprise" } },
    },
  ]),
  "begging-golem-departure": scene("mountain-road", trio(), [
    {
      at: 0,
      actors: { aria: { left: false }, leon: { left: false }, mira: { left: false } },
      items: [ground("medicine", 35), ground("honey", 26, 13, 6)],
    },
    { at: 1, actors: { aria: { pose: "surprise" } } },
  ]),
  "begging-golem-return": golemReturn,
  "sweet-blockade-departure": blockadeApproach,
  "sweet-blockade-return": scene(
    "workshop-yard",
    recoveryCast(),
    [...recoveryBeats, ...inventoryBeats, ...roadOpening, ...departureAndCare],
    { exit: ["aria", "leon", "mira"] },
  ),
};
