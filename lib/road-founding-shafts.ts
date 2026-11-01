import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadLook } from "./road-look.ts";
import { foundingCartAsset, journeyCartWidth } from "./road-journey-cart.ts";
import { roadDepth, roadHeroSize, roadX } from "./road-layout.ts";
import type { PartyTarget } from "./road-party-spacing.ts";

/** Keep Aria's first step clear of the shafts on wide opening views. */
export function foundingOpeningTargets(
  targets: PartyTarget[],
  look: RoadLook,
  view: RoadViewport,
  hasPreviousAria: boolean,
) {
  if (
    view.width <= 560 ||
    hasPreviousAria ||
    look.foundingDraft?.node !== 0 ||
    look.foundingDraft.actor
  )
    return;
  const aria = targets.find((target) => target.id === "aria");
  if (aria)
    aria.lane -=
      (roadHeroSize(view.width, view.height) * 0.17) / roadDepth(view.width, view.height);
}

/** Reserve the ground under the front shafts; Finn still needs to reach the grip. */
function shaftIgnores(battle: RoadBattle, look: RoadLook): Traveller["id"][] {
  const ignore: Traveller["id"][] = ["lico"];
  // At the first delivery Aria waits away from the shafts while Finn holds them.
  if (look.foundingDraft?.actor === "aria" || (look.foundingDraft?.departureAge ?? Infinity) > 1800)
    ignore.push("aria");
  if (look.foundingDraft?.actor !== "mira" || look.foundingDraft.cue !== "recover")
    ignore.push("mira");
  if (
    battle.journeyCart?.phase !== "parked" ||
    look.foundingDraft?.actor === "finn" ||
    look.foundingDraft?.openingGrip
  )
    ignore.push("finn");
  return ignore;
}
export function foundingShaftObstacles(battle: RoadBattle, view: RoadViewport, look: RoadLook) {
  const cart = battle.journeyCart;
  if (!cart || cart.asset !== foundingCartAsset) return [];
  const size = journeyCartWidth(view, cart);
  const x = roadX(cart.x, battle.distance, view.width, battle.stage);
  const ignore = shaftIgnores(battle, look);
  const obstacle = {
    x: ((x + size * 0.23) / view.width) * 560,
    lane: cart.lane - (size * 0.135) / roadDepth(view.width, view.height),
    clearance: {
      x: ((size * 0.3) / view.width) * 560,
      lane: (size * 0.23) / roadDepth(view.width, view.height),
    },
    ignore,
  };
  if (look.foundingDraft?.actor === "mira" && look.foundingDraft.cue === "recover")
    return [
      { ...obstacle, clearance: { ...obstacle.clearance, x: ((size * 0.4) / view.width) * 560 } },
    ];
  return [obstacle];
}
