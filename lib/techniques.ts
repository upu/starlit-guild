import type { State, Encounter } from "./game.ts";
import { level } from "./roster.ts";
import { PICNIC_QUEST } from "./chapter-two.ts";

export type TechniqueSlot = "active" | "passive";
export type Techniques = {
  learned: string[];
  equipped: Record<string, { active?: string | null; passive?: string | null }>;
};
export type Technique = {
  id: string;
  hero: string;
  slot: TechniqueSlot;
  name: string;
  description: string;
  level: number;
  cost: number;
};
export const techniques: Technique[] = [
  {
    id: "finn-opening",
    hero: "finn",
    slot: "passive",
    name: "隙を見抜く目",
    description: "自分の通常攻撃・技の威力が15%増える。",
    level: 17,
    cost: 120,
  },
  {
    id: "mira-care",
    hero: "mira",
    slot: "passive",
    name: "丁寧な手当て",
    description: "自分の回復技で戻すHPが15%増える。",
    level: 1,
    cost: 80,
  },
  {
    id: "aria-double",
    hero: "aria",
    slot: "active",
    name: "風の二連矢",
    description: "3回ごとに威力1.65倍。これまで使ってきた技。",
    level: 1,
    cost: 0,
  },
  {
    id: "aria-gather",
    hero: "aria",
    slot: "active",
    name: "丁寧な採取",
    description: "採取の3回ごとに作業量2.2倍。戦闘では通常の矢を使う。",
    level: 1,
    cost: 80,
  },
  {
    id: "aria-herbs",
    hero: "aria",
    slot: "passive",
    name: "野草の目利き",
    description: "隊で受け取る薬草の量が25%増える。",
    level: 1,
    cost: 80,
  },
  {
    id: "aria-aim",
    hero: "aria",
    slot: "passive",
    name: "狩人の狙い",
    description: "自分の通常攻撃・技の威力が15%増える。",
    level: 14,
    cost: 120,
  },
  {
    id: "leon-step",
    hero: "leon",
    slot: "active",
    name: "暁の踏み込み",
    description: "4回ごとに威力1.7倍。これまで使ってきた技。",
    level: 1,
    cost: 0,
  },
  {
    id: "leon-guard",
    hero: "leon",
    slot: "active",
    name: "かばう",
    description: "戦闘の4回ごとに、隊の最大HPの12%分の障壁を張る。斬撃の威力は通常と同じ。",
    level: 1,
    cost: 80,
  },
  {
    id: "leon-ready",
    hero: "leon",
    slot: "passive",
    name: "堅実な備え",
    description: "自分が受ける攻撃を15%軽減する。",
    level: 1,
    cost: 80,
  },
  {
    id: "leon-sword",
    hero: "leon",
    slot: "passive",
    name: "剣の心得",
    description: "自分の通常攻撃・技の威力が15%増える。",
    level: 14,
    cost: 120,
  },
];
const defaults: Record<string, string> = { aria: "aria-double", leon: "leon-step" };
export const techniquesUnlocked = (s: State) =>
  !!s.done[PICNIC_QUEST] && !!s.story?.read.includes(PICNIC_QUEST + "-return");
export const techniqueById = (id: string) => techniques.find((t) => t.id === id);
export const knowsTechnique = (s: State, id: string) =>
  Object.values(defaults).includes(id) || !!s.techniques?.learned.includes(id);
export function equippedTechnique(s: State, hero: string, slot: TechniqueSlot) {
  const slots = s.techniques?.equipped[hero];
  if (slots && Object.hasOwn(slots, slot)) return slots[slot] ?? null;
  return slot === "active" ? (defaults[hero] ?? null) : null;
}
export const learnableTechniques = (s: State) =>
  techniquesUnlocked(s)
    ? techniques.filter(
        (t) =>
          s.owned.includes(t.hero) &&
          !knowsTechnique(s, t.id) &&
          level(s.xp[t.hero] || 0) >= t.level,
      )
    : [];
function requireTechniqueAccess(s: State, hero: string) {
  if (!techniquesUnlocked(s) || !s.owned.includes(hero))
    throw Error("技は2-1のお昼を終えてから、仲間ごとに習得できます。");
}
export function learnTechnique(s: State, id: string) {
  const t = techniqueById(id);
  if (!t) throw Error("習得する技を確認してください。");
  requireTechniqueAccess(s, t.hero);
  if (knowsTechnique(s, id)) throw Error("この技は習得済みです。");
  if (level(s.xp[t.hero] || 0) < t.level || s.gold < t.cost)
    throw Error("必要レベルかコインが足りません。");
  s.gold -= t.cost;
  (s.techniques ??= { learned: [], equipped: {} }).learned.push(id);
}
export function setTechnique(s: State, hero: string, slot: TechniqueSlot, id?: string) {
  requireTechniqueAccess(s, hero);
  if (!["active", "passive"].includes(slot)) throw Error("セットする枠を確認してください。");
  if (s.squads.some((sq) => sq.run && sq.members.includes(hero)))
    throw Error("技の付け替えは帰還してから行えます。");
  const t = id ? techniqueById(id) : null;
  if (id && (!t || t.hero !== hero || t.slot !== slot || !knowsTechnique(s, id)))
    throw Error("セットする技を確認してください。");
  const progress = (s.techniques ??= { learned: [], equipped: {} });
  (progress.equipped[hero] ??= {})[slot] = id || null;
}
function activeMultiplier(
  s: State,
  hero: string,
  kind: Encounter,
  special: boolean,
  fallback: number,
) {
  if (!special) return 1;
  if (!s.techniques || !Object.hasOwn(defaults, hero)) return fallback;
  const active = equippedTechnique(s, hero, "active");
  if (active === null || active === "leon-guard") return 1;
  if (active === "aria-gather") return kind === "gather" ? 2.2 : 1;
  return fallback;
}
export function techniqueMultiplier(
  s: State,
  hero: string,
  kind: Encounter,
  special: boolean,
  fallback: number,
) {
  const multiplier = activeMultiplier(s, hero, kind, special, fallback);
  const passive = equippedTechnique(s, hero, "passive");
  return (
    multiplier *
    (kind === "battle" && ["aria-aim", "leon-sword", "finn-opening"].includes(passive ?? "")
      ? 1.15
      : 1)
  );
}
export function techniqueText(s: State, hero: string, kind: Encounter, special: boolean) {
  const id = equippedTechnique(s, hero, "active");
  if (!special || !s.techniques || !Object.hasOwn(defaults, hero)) return null;
  if (id === "aria-gather") return kind === "gather" ? "丁寧な採取" : null;
  if (id === "leon-guard") return kind === "battle" ? "かばう" : null;
  return id ? (techniqueById(id)?.name ?? null) : null;
}
export const techniqueDamage = (s: State, hero: string, damage: number) =>
  Math.max(
    1,
    Math.round(damage * (equippedTechnique(s, hero, "passive") === "leon-ready" ? 0.85 : 1)),
  );
export const techniqueHerbs = (s: State, members: string[]) =>
  members.some((hero) => equippedTechnique(s, hero, "passive") === "aria-herbs") ? 1.25 : 1;
export const techniqueHealing = (s: State, hero: string, amount: number) =>
  Math.round(amount * (equippedTechnique(s, hero, "passive") === "mira-care" ? 1.15 : 1));
export function validTechniques(progress: Techniques, owned: string[]) {
  if (new Set(progress.learned).size !== progress.learned.length) return false;
  if (progress.learned.some((id) => !owned.includes(techniqueById(id)?.hero ?? ""))) return false;
  return Object.entries(progress.equipped).every(
    ([hero, slots]) =>
      owned.includes(hero) &&
      Object.entries(slots).every(([slot, id]) => {
        if (id === null) return true;
        const t = techniqueById(id);
        return (
          !!t &&
          t.hero === hero &&
          t.slot === slot &&
          (defaults[hero] === id || progress.learned.includes(id))
        );
      }),
  );
}
