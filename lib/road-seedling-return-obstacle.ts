import type { RoadLook } from "./road-look.ts";
import type { RoadBattle } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { PartyObstacle } from "./road-party-spacing.ts";
import { roadDepth, roadX } from "./road-layout.ts";
import { seedlingCastScale, mossBedsLayout } from "./road-moss-beds-layout.ts";

/** Leon goes around Lico while she waits for the route back to clear. */
export function seedlingReturnObstacles(
  battle: RoadBattle,
  look: RoadLook,
  view: RoadViewport,
  previous?: { lico?: { x: number; lane: number }; leon?: { x: number; lane: number } },
): PartyObstacle[] {
  if (!look.mossBeds?.seedlings || !look.mossBeds.completed) return [];
  const lico = battle.heroes.find((hero) => hero.id === "lico");
  const leon = battle.heroes.find((hero) => hero.id === "leon");
  if (!lico || !leon) return [];
  const layout = mossBedsLayout(view);
  const figure = layout.figureSize * seedlingCastScale(layout.portrait);
  const obstacle = (point: { x: number; lane: number }, ignore: PartyObstacle["ignore"]) => ({
    x: (roadX(point.x, battle.distance, view.width, battle.stage) / view.width) * 560,
    lane: point.lane,
    clearance: {
      x: ((figure * 0.46) / view.width) * 560,
      lane: (figure * 0.88) / roadDepth(view.width, view.height),
    },
    ignore,
  });
  return [
    obstacle(previous?.lico ?? lico, ["aria", "finn", "mira", "lico"]),
    obstacle(previous?.leon ?? leon, ["aria", "finn", "mira", "leon"]),
  ];
}
