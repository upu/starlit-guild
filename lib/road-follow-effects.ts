import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import { roadScale } from "./road-layout.ts";

export function attackStep(hero: Traveller, battle: RoadBattle, melee: boolean) {
  const strike = battle.effects.findLast(
    (effect) => effect.hero === hero.id && ["slash", "arrow", "magic"].includes(effect.kind),
  );
  const age = strike ? battle.time - strike.at : -1;
  return age >= 0 && age < 600 ? Math.sin((age / 600) * Math.PI) * (melee ? 34 : 10) : 0;
}

export function prunePartyPositions<T>(
  positions: Map<string, T>,
  feet: Map<string, T>,
  battle: RoadBattle,
) {
  for (const id of positions.keys())
    if (!battle.heroes.some((hero) => hero.id === id)) {
      positions.delete(id);
      feet.delete(id);
    }
}

export function anchoredAtWork(battle: RoadBattle, look: RoadLook, hero: Traveller) {
  return (
    (battle.journeyCart?.phase !== "parked" &&
      !!battle.journeyCart &&
      look.workers.includes(hero.id)) ||
    !!battle.handheld?.some(
      (item) =>
        item.hero === hero.id &&
        (item.returning || ["lower", "lift"].includes(item.phase) || !!item.reservation),
    )
  );
}

export function carryingCart(battle: RoadBattle) {
  return (
    (battle.journeyCart?.phase === "moving" ||
      (battle.gathering?.kind === "cargo" && battle.gathering.task === "carry")) &&
    !battle.enemies.some((enemy) => enemy.hp > 0)
  );
}
export function atWorkPosition(
  drawn: Traveller,
  original: Traveller,
  width: number,
  battle: RoadBattle,
) {
  const dx = Math.abs(drawn.x - original.x) * roadScale(width, battle.stage);
  return (
    dx <= (carryingCart(battle) ? 12 : width / 280) && Math.abs(drawn.lane - original.lane) <= 0.02
  );
}

export function stepFacing(
  hero: Traveller,
  previous: { x: number } | undefined,
  position: { x: number },
  battle: RoadBattle,
) {
  const dx = previous ? position.x - previous.x : 0;
  if (Math.abs(dx) < 0.1 || battle.enemies.some((enemy) => enemy.hp > 0)) return hero.facing;
  return dx > 0 ? 1 : -1;
}

export function followEffects(before: Traveller[], battle: RoadBattle) {
  battle.effects = battle.effects.map((effect) => {
    const source = before.find((hero) => hero.x === effect.fromX && hero.lane === effect.fromLane);
    const target = before.find((hero) => hero.x === effect.x && hero.lane === effect.lane);
    const from = battle.heroes.find((hero) => hero.id === source?.id);
    const to = battle.heroes.find((hero) => hero.id === target?.id);
    return {
      ...effect,
      ...(from ? { fromX: from.x, fromLane: from.lane } : {}),
      ...(to ? { x: to.x, lane: to.lane } : {}),
    };
  });
}
