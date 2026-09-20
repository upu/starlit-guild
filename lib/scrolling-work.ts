import type { RoadBattle } from "./scrolling-battle.ts";
import { gatheringOffset, isWorking, ROAD_STEP } from "./scrolling-travel.ts";

const DELIVERY_X = 700;
const START_X = 180;
const PACK_TIME = 12000;

export function workCargo(state: RoadBattle) {
  const point = state.gathering;
  if (!point || point.kind !== "cargo") return;
  if (point.task === "carry") {
    // Wait for the escort to return; neither cart nor companions leave someone behind.
    const living = state.heroes.filter((hero) => hero.hp > 0);
    if (
      state.enemies.some((enemy) => enemy.hp > 0) ||
      !living.every((hero) => Math.abs(hero.x - point.x - gatheringOffset[hero.id]) < 12)
    )
      return;
    point.x = Math.min(DELIVERY_X, point.x + ROAD_STEP * 0.026);
    point.remaining = DELIVERY_X - point.x;
    if (point.remaining > 0) return;
    point.task = "unload";
    point.remaining = point.total = PACK_TIME;
    return;
  }
  point.remaining = Math.max(
    0,
    point.remaining - ROAD_STEP * state.heroes.filter((hero) => isWorking(state, hero)).length,
  );
  if (point.remaining > 0) return;
  if (point.task === "pack") {
    point.task = "carry";
    point.total = point.remaining = DELIVERY_X - START_X;
    return;
  }
  state.deliveries++;
  state.gathering = null;
}
