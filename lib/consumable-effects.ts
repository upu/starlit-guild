import { assignedConsumable, consume, consumableById } from "./consumables.ts";
import { healMember, heroById } from "./game-rules.ts";
import type { GameEvent, Run, Squad, State } from "./game-types.ts";

type Emit = (
  r: Run,
  at: number,
  kind: GameEvent["kind"],
  text: string,
  amount?: number,
  hero?: string,
  target?: string,
) => void;

// Both modern enemy turns (including dedicated fights) and legacy damage use this hook.
export function applyPinchConsumable(
  s: State,
  r: Run,
  hero: string,
  damage: number,
  at: number,
  emit: Emit,
) {
  const item = assignedConsumable(s, hero),
    health = r.health[hero];
  if (!item || item.effect.timing !== "pinch" || damage <= 0) return;
  if (health.hp <= 0 || health.hp > health.maxHp * 0.4 || !consume(s, item.id)) return;
  const restored = healMember(r, hero, item.effect.healing);
  const text = `${heroById(hero).name}が${item.name}を使った。`;
  recordUse(s, item.id, text, at);
  emit(r, at, "heal", text, restored, hero, hero);
}

export function applyDepartureConsumables(s: State, sq: Squad, r: Run, at: number, emit: Emit) {
  const users = new Map<string, { name: string; heroes: string[] }>();
  // Party order resolves competing requests for the last shared item.
  for (const hero of sq.members) {
    const item = assignedConsumable(s, hero);
    if (!item || item.effect.timing !== "departure" || !consume(s, item.id)) continue;
    (r.consumableEffects ??= {})[hero] = item.id;
    const text = `${heroById(hero).name}が${item.name}を使った。`;
    const group = users.get(item.id) ?? { name: item.name, heroes: [] };
    group.heroes.push(heroById(hero).name);
    users.set(item.id, group);
    emit(r, at, "move", text, undefined, hero);
  }
  for (const [id, group] of users) {
    recordUse(
      s,
      id,
      `${group.heroes.join("・")}が${group.name}を使った（${String(group.heroes.length)}個）。`,
      at,
    );
  }
}

export function consumableExperience(r: Run, hero: string, xp: number) {
  const item = consumableById(r.consumableEffects?.[hero] ?? "");
  return item?.effect.timing === "departure" ? xp * (1 + item.effect.experience) : xp;
}

function recordUse(s: State, consumable: string, text: string, at: number) {
  s.log = [{ text, at, consumable }, ...s.log].slice(0, 40);
}
export function consumableNotice(s: State, now: number) {
  return s.log
    .filter((entry) => entry.consumable && now >= entry.at && now - entry.at < 5000)
    .reverse()
    .map((entry) => entry.text)
    .join("\n");
}
