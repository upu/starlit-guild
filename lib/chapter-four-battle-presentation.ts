import type { RoadBattle, RoadEffect } from "./road-view.ts";
import type { Run } from "./game-types.ts";
export function mushroomArrival(run: Run | null, id: string) {
  const master = run?.enemies?.[0];
  if (master?.cue !== "summon" || master.cueAt === undefined || id === master.id) return undefined;
  return master.cueAt + 800;
}
export function confrontationEffects(run: Run | null, battle: RoadBattle): RoadEffect[] {
  if (!run || run.phase === "rest") return [];
  return (run.enemies || []).flatMap((enemy) => {
    const { cue, cueAt } = enemy;
    if (!cue || cueAt === undefined || battle.time < cueAt || battle.time - cueAt > 1800) return [];
    const source = battle.enemies.find((e) => e.id === Number(enemy.id.split("-")[1]));
    if (!source || source.hp <= 0) return [];
    const targets =
      enemy.cue === "song"
        ? battle.enemies.filter((e) => e.hp > 0)
        : enemy.cue === "summon"
          ? battle.enemies.filter((e) => e.kind === "mushroom")
          : battle.heroes.filter((h) => h.paralyzed);
    return targets.map((target, index) => ({
      id: -Math.round(cueAt) * 4 - index,
      at: cueAt,
      kind: cue === "summon" ? "mushroomThrow" : cue,
      x: target.x,
      lane: target.lane,
      fromX: source.x,
      fromLane: source.lane,
      amount: 0,
    }));
  });
}
