import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";

export function commandMotion(battle: RoadBattle, look: RoadLook) {
  const effect = battle.effects.find((item) => item.kind === "command");
  if (!effect) return;
  for (const enemy of battle.enemies) {
    if (enemy.hp <= 0) continue;
    enemy.action = enemy.kind === "pumpety" ? "command" : "rally";
    enemy.actionAt = effect.at;
    if (enemy.kind === "pumpety") look.enemies[enemy.id].label = "もう一回なのよ！";
  }
}
