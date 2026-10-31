import type { RoadBattle, Traveller } from "./road-view.ts";
import { roadTravellerCanMove } from "./road-view.ts";
import { roadX } from "./road-layout.ts";
import { stepFacing } from "./road-follow-effects.ts";

/** Keep the planted foot fixed while the hands lower or lift the basket. */
export function transplantBasketLock(battle: RoadBattle, hero: Traveller, width: number) {
  const locked = battle.handheld?.some(
    (item) =>
      item.hero === hero.id &&
      item.kind === "transplant-basket" &&
      (item.phase === "lower" || item.phase === "lift"),
  );
  return locked
    ? { x: (roadX(hero.x, battle.distance, width, battle.stage) / width) * 560, lane: hero.lane }
    : undefined;
}
export function transplantBasketWalking(hero: Traveller, moving: boolean, locked: boolean) {
  return !locked && roadTravellerCanMove(hero) && !hero.paralyzed && (hero.walking || moving);
}
export function transplantBasketFacing(
  hero: Traveller,
  previous: { x: number } | undefined,
  position: { x: number },
  battle: RoadBattle,
  locked: boolean,
) {
  return locked ? hero.facing : stepFacing(hero, previous, position, battle);
}
export function restingFootPosition(
  rest: { x: number; lane: number } | undefined,
  hero: Traveller,
  position: { x: number; lane: number },
  battle: RoadBattle,
  width: number,
) {
  return rest && !roadTravellerCanMove(hero)
    ? { x: (roadX(rest.x, battle.distance, width, battle.stage) / width) * 560, lane: rest.lane }
    : position;
}
