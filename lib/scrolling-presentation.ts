import type { RoadBattle } from "./scrolling-battle.ts";
import { ROAD_STEP } from "./scrolling-travel.ts";

// Read-only, one-tick-delayed interpolation. Rendering never advances combat.
export function roadPresentation(state: RoadBattle, sinceUpdate = 0): RoadBattle {
  const alpha = Math.max(0, Math.min(1, (state.remainder + sinceUpdate) / ROAD_STEP));
  const mix = (before: number, after: number) => before + (after - before) * alpha;
  return {
    ...state,
    time: Math.max(0, state.time - ROAD_STEP + alpha * ROAD_STEP),
    distance: mix(state.previousDistance, state.distance),
    gathering: state.gathering
      ? { ...state.gathering, x: mix(state.gathering.previousX, state.gathering.x) }
      : null,
    heroes: state.heroes.map((hero) => ({ ...hero, x: mix(hero.previousX, hero.x) })),
    enemies: state.enemies.map((enemy) => ({ ...enemy, x: mix(enemy.previousX, enemy.x) })),
  };
}
