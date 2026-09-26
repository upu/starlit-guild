import type { RoadBattle } from "./road-view.ts";

// Display offsets only: leave saved movement, range and combat timing untouched.
// Stagger faces horizontally as well as vertically; Lico stands in front of the cart.
export function spreadBattleParty(battle: RoadBattle, workers: string[]) {
  if (battle.heroes.length < 3 || !battle.enemies.some((enemy) => enemy.hp > 0)) return;
  for (const hero of battle.heroes) {
    if (workers.includes(hero.id)) continue;
    const offset = { aria: -60, leon: 0, mira: 0, finn: 30, lico: -85 }[hero.id];
    hero.x += offset * hero.facing;
    if (hero.id === "lico") hero.lane = 0.98;
    if (hero.id === "finn") hero.lane = 0.36;
  }
}
