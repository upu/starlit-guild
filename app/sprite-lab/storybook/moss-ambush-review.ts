import { allQuests, type State } from "../../../lib/game.ts";
import { createEnemies, syncEnemyTotals } from "../../../lib/combat.ts";
import { placeRoadEnemies } from "../../../lib/chapter-road.ts";

/** Inject an ambush into the isolated study state without touching a player's save. */
export function mossAmbushReview(state: State): State {
  const next = structuredClone(state);
  const run = next.squads[0]?.run;
  const quest = allQuests.find((item) => item.id === "tower-moss-removal");
  if (!run || run.quest !== quest?.id || !run.road || run.enemies?.some((e) => e.hp > 0))
    return state;
  run.road.ambushNode = Math.min(run.nodes - 1, run.node + 1);
  run.enemies = createEnemies(quest, run.road.ambushNode, next.updatedAt, true, run.nodes);
  for (const actor of run.actors) actor.nextAt = Math.max(actor.nextAt, next.updatedAt + 2500);
  placeRoadEnemies(run);
  syncEnemyTotals(run);
  return next;
}
