import type { Enemy } from "./combat.ts";
import type { Actor, GameEvent, Run } from "./game-types.ts";
import { LICO_RECORDS_QUEST, MERRILL_SEEDLINGS_QUEST } from "./chapter-four.ts";

export type BattleTrick = "lico" | "merrill" | "mushroom";
export type BattleCue = "summon" | "song" | "paralyze";
export type BattleEmit = (
  r: Run,
  at: number,
  kind: GameEvent["kind"],
  text: string,
  amount?: number,
  hero?: string,
  target?: string,
  enemy?: string,
) => void;
export const paralyzed = (actor: Actor | undefined, at: number) =>
  (actor?.paralyzedUntil ?? 0) > at;
export function confrontation(quest: string, node: number) {
  if (quest === LICO_RECORDS_QUEST && node === 14) return "lico";
  if (quest === MERRILL_SEEDLINGS_QUEST && node === 8) return "merrill";
  return undefined;
}
export function confrontationEnemies(
  quest: string,
  node: number,
  rank: number,
  at: number,
): Enemy[] | null {
  const trick = confrontation(quest, node);
  if (!trick) return null;
  const maxHp = 36 + rank * 3;
  return [
    {
      id: "enemy-1",
      trick,
      actions: 0,
      hp: maxHp,
      maxHp,
      resistance: rank,
      attack: 4 + rank * 0.45,
      period: 3600,
      nextAt: at + (trick === "merrill" ? 1000 : 3700),
    },
  ];
}
function cue(
  r: Run,
  enemy: Enemy,
  at: number,
  value: BattleCue,
  emit: BattleEmit,
  target?: string,
  amount = 0,
) {
  enemy.cue = value;
  enemy.cueAt = at;
  emit(
    r,
    at,
    "move",
    value === "summon"
      ? "メリルがカバンからコロタケを二体投げた！"
      : value === "song"
        ? "メリルの歌と踊りで敵側全員が元気を取り戻す"
        : "リコのしびれ煙で一時的に麻痺",
    amount,
    undefined,
    target,
    enemy.id,
  );
}
function summon(r: Run, enemy: Enemy, at: number, emit: BattleEmit) {
  const enemies = r.enemies;
  if (!enemies || enemies.length >= 3 || !r.road) return false;
  for (let index = enemies.length; index < 3; index++) {
    const maxHp = Math.round(enemy.maxHp * 0.65);
    const mushroom: Enemy = {
      id: `enemy-${String(index + 1)}`,
      trick: "mushroom",
      hp: maxHp,
      maxHp,
      resistance: enemy.resistance,
      attack: enemy.attack * 0.42,
      period: 1900,
      nextAt: at + 1900,
    };
    enemies.push(mushroom);
    const source = r.road.opponents[enemy.id],
      target = r.road.members[r.actors[0].hero];
    const direction = target.x < source.x ? -1 : 1;
    const x = source.x + direction * (75 + index * 24);
    r.road.opponents[mushroom.id] = {
      x,
      previousX: x,
      recoil: 0,
      walking: false,
      facing: direction,
    };
  }
  cue(r, enemy, at, "summon", emit);
  return true;
}
function sing(r: Run, enemy: Enemy, at: number, emit: BattleEmit) {
  let restored = 0;
  for (const ally of r.enemies || []) {
    if (ally.hp <= 0) continue;
    const amount = Math.min(ally.maxHp - ally.hp, Math.ceil(ally.maxHp * 0.2));
    ally.hp += amount;
    restored += amount;
  }
  cue(r, enemy, at, "song", emit, undefined, restored);
}
// Called only for newly configured encounters. Existing saves without tricks keep their battle.
export function confrontationTurn(r: Run, enemy: Enemy, at: number, emit: BattleEmit) {
  if (!r.road || !["lico", "merrill"].includes(enemy.trick || "")) return false;
  enemy.actions = (enemy.actions || 0) + 1;
  if (enemy.trick === "merrill") {
    if (enemy.actions % 2 === 1 && summon(r, enemy, at, emit)) return true;
    sing(r, enemy, at, emit);
    return true;
  }
  if (enemy.actions % 2 === 0) return false;
  // One person at a time; no damage or stacking, then a guaranteed free interval.
  const living = r.actors.filter(
    (a) => r.health[a.hero].hp > 0 && (a.paralysisGuardUntil || 0) <= at,
  );
  const target = living.at((enemy.actions - 1) % Math.max(1, living.length));
  if (target) {
    target.paralyzedUntil = at + 1500;
    target.paralysisGuardUntil = at + 6000;
    target.nextAt = Math.max(target.nextAt, target.paralyzedUntil);
    cue(r, enemy, at, "paralyze", emit, target.hero);
  }
  // Alternate a harmless foot-stopping action with the existing apparatus pressure.
  return true;
}

export function shiftConfrontationClocks(r: Run, shift: number) {
  for (const actor of r.actors) {
    if (actor.paralyzedUntil !== undefined) actor.paralyzedUntil += shift;
    if (actor.paralysisGuardUntil !== undefined) actor.paralysisGuardUntil += shift;
  }
  for (const enemy of r.enemies || []) if (enemy.cueAt !== undefined) enemy.cueAt += shift;
}
