import type { RoadBattle, RoadEnemy, Traveller } from "./road-view.ts";
import { attackStep } from "./road-follow-effects.ts";

type Position = { x: number; lane: number };
export function roaming(
  hero: Traveller,
  battle: RoadBattle,
  working: boolean,
  wideLane = false,
): Position {
  if (working || hero.hp <= 0 || hero.paralyzed || battle.scene || battle.phase !== "journey")
    return { x: hero.x, lane: hero.lane };
  const enemy = battle.enemies
    .filter((item) => item.hp > 0 && item.kind !== "pumpety")
    .sort((a, b) => Math.abs(a.x - hero.x) - Math.abs(b.x - hero.x))
    .at(0);
  if (!hero.walking && !enemy) return { x: hero.x, lane: hero.lane };
  return roamingTarget(hero, battle, enemy, wideLane);
}

function outsideEnemy(
  hero: Traveller,
  battle: RoadBattle,
  target: RoadEnemy | undefined,
  x: number,
) {
  if (!target) return x;
  // Saved melee range measures point positions. Sway plus a lunge must not
  // put the drawn torso inside the enemy; large bodies need more room.
  const ahead = battle.enemies.filter(
    (e) =>
      e.hp > 0 && e.kind !== "pumpety" && (e.id === target.id || (e.x - hero.x) * hero.facing >= 0),
  );
  return ahead.reduce((position, enemy) => {
    const gap = enemy.boss || enemy.kind === "golem" ? 120 : 75;
    return hero.facing > 0 ? Math.min(position, enemy.x - gap) : Math.max(position, enemy.x + gap);
  }, x);
}

function roamingTarget(
  hero: Traveller,
  battle: RoadBattle,
  enemy?: RoadEnemy,
  wideLane = false,
): Position {
  const index = ["aria", "leon", "mira", "finn", "lico"].indexOf(hero.id);
  const beat = battle.time / 1000 + index * 1.7;
  const melee = hero.id === "leon" || hero.id === "finn";
  const lane = enemy && melee ? enemy.lane + (hero.id === "leon" ? 0.1 : -0.2) : hero.lane;
  const lunge = attackStep(hero, battle, melee);
  const drawnLane = lane + Math.sin(beat * 0.7) * (enemy ? 0.16 : 0.23);
  return {
    x: outsideEnemy(
      hero,
      battle,
      enemy,
      hero.x + Math.sin(beat * 0.9) * (enemy ? 24 : 36) + hero.facing * lunge,
    ),
    lane: wideLane ? drawnLane : Math.max(0.3, Math.min(0.98, drawnLane)),
  };
}
