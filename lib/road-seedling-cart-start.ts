import { roadCartSlot, seedlingCartWidth, type RoadViewport } from "./road-cart-layout.ts";
import { roadDepth, roadHeroSize, roadX } from "./road-layout.ts";
import type { PartyObstacle } from "./road-party-spacing.ts";
import { isSeedlingCart } from "./road-storybook-work.ts";
import { roadTravellerCanMove, type RoadBattle, type Traveller } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";

export function seedlingCarrierPair(frame: { battle: RoadBattle; look: RoadLook }) {
  return (
    frame.look.quest === "moss-transplant" &&
    frame.look.storybookHeroes &&
    isSeedlingCart(frame.look) &&
    frame.battle.gathering?.task === "carry" &&
    !frame.battle.enemies.some((enemy) => enemy.hp > 0) &&
    ["aria", "finn"].every((id) =>
      frame.battle.heroes.some(
        (hero) => hero.id === id && roadTravellerCanMove(hero) && !hero.paralyzed,
      ),
    )
  );
}

/** The departure scene already leaves the two carriers at the cart. */
export function seedlingStartGrip(
  frame: { battle: RoadBattle; look: RoadLook },
  hero: Traveller,
  width: number,
  height: number,
) {
  const { battle, look } = frame;
  const pair = ["aria", "finn"];
  if (
    !seedlingCarrierPair(frame) ||
    !battle.gathering ||
    !pair.includes(hero.id) ||
    (look.frontCarriers.length > 0 && !look.frontCarriers.includes("finn"))
  )
    return undefined;
  const slot = roadCartSlot(
    { width, height },
    battle.stage,
    true,
    hero.id === "finn",
    true,
    hero.id,
  );
  return { ...hero, x: battle.gathering.x + 65 + slot.offset, lane: slot.lane };
}

/** Escorts go around the load while the two carriers can reach its handles. */
export function seedlingCartObstacle(
  battle: RoadBattle,
  look: RoadLook,
  view: RoadViewport,
): PartyObstacle | undefined {
  const aria = battle.heroes.find((hero) => hero.id === "aria");
  if (
    !aria ||
    !battle.gathering ||
    !seedlingStartGrip({ battle, look }, aria, view.width, view.height)
  )
    return undefined;
  const cartX = roadX(battle.gathering.x + 65, battle.distance, view.width, battle.stage);
  return {
    x: (cartX / view.width) * 560,
    lane: 0.82,
    clearance: {
      x: ((seedlingCartWidth(view) * 0.55) / view.width) * 560,
      lane: (roadHeroSize(view.width, view.height) * 0.42) / roadDepth(view.width, view.height),
    },
    ignore: ["aria", "finn"],
  };
}
