import { secondDayDeparture, secondDayReturn } from "./story-stage-moss-second-day.ts";
import { tiredMira, followMossCart } from "./story-stage-moss-trail.ts";
import { scene, quartet, held, npc, type LaterStage } from "./story-stage-later-shared.ts";
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
  "glowing-moss-trail-next-day-departure": secondDayDeparture,
  "glowing-moss-trail-next-day-return": secondDayReturn,
};
