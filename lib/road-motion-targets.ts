import type { RoadBattle, Traveller } from "./road-view.ts";
import { roadTravellerCanMove } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import { carryingCart, anchoredAtWork } from "./road-follow-effects.ts";
import { fixedScene, fixedBattle, brekkaInitialAvoidance } from "./road-fixed-scene-layout.ts";
import { roaming } from "./road-roaming.ts";
import { seedlingCartObstacle, seedlingStartGrip } from "./road-seedling-cart-start.ts";
import { berneHandheld } from "./road-berne-journey.ts";
import { lindeLaneBounds } from "./road-linde-delivery.ts";
import { roadX } from "./road-layout.ts";
import type { PartyTarget } from "./road-party-spacing.ts";

type Frame = { battle: RoadBattle; look: RoadLook };
function anchoredTarget(frame: Frame, hero: Traveller, grip: Traveller | undefined) {
  return (
    !!grip ||
    (frame.look.foundingDraft?.openingGrip && hero.id === "finn") ||
    frame.battle.waterwayActions?.priorityHero === hero.id ||
    anchoredAtWork(frame.battle, frame.look, hero) ||
    frame.look.lindeDelivery?.pickupCourier === hero.id ||
    frame.look.foundingDraft?.actor === hero.id
  );
}
function avoidInitial(frame: Frame, hero: Traveller) {
  const { look, battle } = frame;
  if (brekkaInitialAvoidance(look, battle, hero)) return true;
  if (!look.foundingDraft || !battle.journeyCart) return false;
  return (
    hero.id === "leon" ||
    (hero.id === "finn" &&
      !look.foundingDraft.openingGrip &&
      battle.journeyCart.phase === "parked" &&
      look.foundingDraft.actor !== "finn")
  );
}
const avoidSeedlingEscort = (enabled: boolean, hero: Traveller) =>
  enabled && ["mira", "lico"].includes(hero.id);
function initialCartGrip(frame: Frame, hero: Traveller, width: number, height: number) {
  const seedling = seedlingStartGrip(frame, hero, width, height);
  return (
    seedling ?? (frame.look.foundingDraft?.openingGrip && hero.id === "finn" ? hero : undefined)
  );
}
export function partyTargets(
  frame: Frame,
  camera: number,
  width: number,
  height: number,
  reduced: boolean,
) {
  const { battle, look } = frame;
  const seedlingEscorts = !!seedlingCartObstacle(battle, look, { width, height });
  const carrying = carryingCart(battle);
  const fixedSite =
    fixedScene(look) && (fixedBattle(look) || !battle.enemies.some((enemy) => enemy.hp > 0));
  return battle.heroes.map((hero): PartyTarget => {
    const working = look.workers.includes(hero.id);
    const planted = !!look.blockade && hero.id !== "leon";
    // Escort lanes are part of the cart formation too.
    const grip = initialCartGrip(frame, hero, width, height);
    const target =
      grip ??
      (reduced || fixedSite || planted
        ? hero
        : roaming(hero, battle, working || carrying, fixedScene(look)));
    return {
      ...target,
      ...(anchoredTarget(frame, hero, grip) ? { anchored: true } : {}),
      ...(grip ? { cartGrip: true } : {}),
      ...(avoidSeedlingEscort(seedlingEscorts, hero) ? { avoidEscort: true } : {}),
      id: hero.id,
      wideLane: fixedScene(look),
      avoidInitial: avoidInitial(frame, hero),
      ...(berneHandheld(look) ? { minLane: 0.2, maxLane: 1.1 } : {}),
      ...lindeLaneBounds(look, { width, height }),
      facing: hero.facing,
      fixed: !!grip || planted || working || !roadTravellerCanMove(hero) || !!hero.paralyzed,
      x: (roadX(target.x, camera, width, battle.stage) / width) * 560,
    };
  });
}
