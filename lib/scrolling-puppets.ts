import type { RoadBattle, RoadEnemy } from "./scrolling-battle.ts";

// As in the main story, the puppeteer commands actors and withdraws when they stop.
export function commandPuppets(state: RoadBattle, master: RoadEnemy) {
  const actors = state.enemies.filter((enemy) => enemy.kind !== "pumpety" && enemy.hp > 0);
  if (!actors.length) {
    master.hp = 0;
    return;
  }
  if (state.time < master.nextAttack) return;
  master.nextAttack = state.time + 4800;
  for (const actor of actors) actor.nextAttack = Math.min(actor.nextAttack, state.time + 350);
}
