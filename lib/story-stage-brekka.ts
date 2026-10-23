import { tiredMira, followMossCart } from "./story-stage-moss-trail.ts";
import { scene, quartet, held, ground, npc, type LaterStage } from "./story-stage-later-shared.ts";
import { brekkaVisit } from "./story-stage-brekka-visit.ts";
import { brekkaDining } from "./story-stage-brekka-dining.ts";
import { lanternWork } from "./story-stage-lantern-work.ts";
import { lindeDeparture, lindeReturn } from "./story-stage-linde-requests.ts";
export const brekkaStages: Record<string, LaterStage> = {
  "linde-requests-departure": lindeDeparture,
  "linde-requests-return": lindeReturn,
  "lantern-detour-departure": scene(
    "hill-path",
    quartet(),
    [
      { at: 0, extras: [npc("worker", "荷運び人", 72, "explain", true)] },
      {
        at: 1,
        actors: { leon: { pose: "offer" } },
        items: [held("map", "leon", { wrist: true, width: 6.5 })],
      },
      { at: 4, actors: { aria: { pose: "greet" } } },
      { at: 7, actors: { finn: { pose: "tease" } } },
      { at: 8, actors: { leon: { carry: true } } },
    ],
    { exit: ["aria", "leon", "mira", "finn"] },
  ),
  "lantern-detour-return": lanternWork,
  "brekka-arrival-departure": brekkaDining,
  "brekka-arrival-return": brekkaVisit,
  "glowing-moss-trail-departure": tiredMira,
  "glowing-moss-trail-return": followMossCart,
  "glowing-moss-trail-next-day-departure": scene(
    "brekka-alley",
    quartet(),
    [
      { at: 0, items: [held("ledger", "leon")], actors: { mira: { x: 66 }, finn: { x: 82 } } },
      { at: 4, actors: { aria: { pose: "think" } } },
      { at: 5, items: [held("ledger", "leon"), ground("basket-cart", 83, 37, 25)] },
    ],
    { exit: ["aria", "leon", "mira", "finn"] },
  ),
  "glowing-moss-trail-next-day-return": scene("brekka-alley", quartet(), [
    { at: 0, items: [ground("basket-cart", 81, 37, 25), held("ledger", "leon")] },
    { at: 3, background: "moss-beds", items: [held("ledger", "leon"), ground("moss", 47, 15, 6)] },
    { at: 4, actors: { aria: { inspect: true } } },
    { at: 8, actors: { aria: { inspect: false } } },
    { at: 9, actors: { finn: { x: 112, pose: "greet" } } },
  ]),
};
