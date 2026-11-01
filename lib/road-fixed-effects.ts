import type { RoadBattle } from "./road-view.ts";

/** Re-anchor effects after fixed-scene actors replace saved route coordinates. */
export function projectFixedEffects(
  battle: RoadBattle,
  heroes: RoadBattle["heroes"],
  enemies: RoadBattle["enemies"],
) {
  battle.effects = battle.effects.map((effect) => {
    const target = enemies.findIndex((e) => e.x === effect.x && e.lane === effect.lane);
    const source = heroes.findIndex((h) => h.x === effect.fromX && h.lane === effect.fromLane);
    const patient = heroes.findIndex((h) => h.x === effect.x && h.lane === effect.lane);
    return {
      ...effect,
      ...(target >= 0 ? { x: battle.enemies[target].x, lane: battle.enemies[target].lane } : {}),
      ...(patient >= 0 ? { x: battle.heroes[patient].x, lane: battle.heroes[patient].lane } : {}),
      ...(source >= 0
        ? { fromX: battle.heroes[source].x, fromLane: battle.heroes[source].lane }
        : {}),
    };
  });
}
