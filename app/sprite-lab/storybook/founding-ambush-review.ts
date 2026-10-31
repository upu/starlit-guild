import { allQuests, type State } from "../../../lib/game.ts";
import { createEnemies, syncEnemyTotals } from "../../../lib/combat.ts";
import { placeRoadEnemies } from "../../../lib/chapter-road.ts";

/** Actual combat in disposable review state, with time for an enemy to attack. */
export function foundingAmbushReview(state: State): State {
  const next = structuredClone(state);
  const run = next.squads[0]?.run;
  const quest = allQuests.find((item) => item.id === "starlit-guild-founding");
  if (!run || run.quest !== quest?.id || !run.road || run.enemies?.some((e) => e.hp > 0))
    return state;
  run.road.ambushNode = Math.min(run.nodes - 1, run.node + 1);
  run.enemies = createEnemies(quest, run.node + 1, next.updatedAt, true, run.nodes);
  for (const enemy of run.enemies) enemy.nextAt = next.updatedAt + 2500;
  for (const actor of run.actors) actor.nextAt = Math.max(actor.nextAt, next.updatedAt + 7000);
  placeRoadEnemies(run);
  syncEnemyTotals(run);
  return next;
}
