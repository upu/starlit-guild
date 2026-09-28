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
  const restored = healMember(r, hero, Math.ceil(health.maxHp * item.effect.healing));
  const text = `${heroById(hero).name}が${item.name}を使った。HP +${String(Math.round(restored * 100) / 100)}`;
  recordUse(s, item.id, text, at);
  emit(r, at, "heal", text, restored, hero, hero);
}

export function applyDepartureConsumables(s: State, sq: Squad, r: Run, at: number, emit: Emit) {
  // Party order resolves competing requests for the last shared item.
  for (const hero of sq.members) {
    const item = assignedConsumable(s, hero);
    if (!item || item.effect.timing !== "departure" || !consume(s, item.id)) continue;
    (r.consumableEffects ??= {})[hero] = item.id;
    const text = `${heroById(hero).name}が${item.name}を使った。この周回の経験値 +10%`;
    recordUse(s, item.id, text, at);
    emit(r, at, "move", text, undefined, hero);
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
    .slice(0, 2)
    .reverse()
    .map((entry) => entry.text)
    .join(" ／ ");
}
