import { equipmentBonus } from "./equipment.ts";
import { questNodes, puppetBattleName } from "./puppet-battles.ts";
import { createEnemies, penetration, reducedDamage, workResistance } from "./combat.ts";
import { TRADE_QUEST, RETURN_QUEST, TOWN_QUEST, NIGHT_QUEST, WETLAND_QUEST } from "./prologue.ts";
import { chapterTwoWork, chapterTwoWorkload } from "./chapter-two.ts";
import { techniqueMultiplier } from "./techniques.ts";
import { waterwayWork } from "./waterway-work.ts";
import { bonds, level } from "./roster.ts";
import { heroes, allQuests, type Quest } from "./game-content.ts";
import type { Encounter, MemberHealth, Run, Squad, State } from "./game-types.ts";

export function heroById(id: string) {
  const hero = heroes.find((h) => h.id === id);
  if (!hero) throw Error(`仲間「${id}」が見つかりません。`);
  return hero;
}
export function defaultSquadName(members: string[]) {
  if (members.length === 2 && members.includes("aria") && members.includes("leon"))
    return "レオン・アリア";
  return members
    .map((id) => heroes.find((hero) => hero.id === id)?.name ?? "不明な仲間")
    .join("・");
}
export function squadName(sq: Squad) {
  return sq.customName?.trim() || defaultSquadName(sq.members);
}
export function questById(id: string) {
  const quest = allQuests.find((q) => q.id === id);
  if (!quest) throw Error(`依頼「${id}」が見つかりません。`);
  return quest;
}
export function activeRun(sq: Squad) {
  if (!sq.run) throw Error(`隊「${sq.id}」は冒険中ではありません。`);
  return sq.run;
}
export function initialState(now: number): State {
  return {
    version: 4,
    story: { departed: [], completed: [], read: [] },
    friendship: {},
    gold: 60,
    herbs: 0,
    ore: 0,
    owned: ["aria", "leon"],
    xp: {},
    clears: 0,
    done: {},
    updatedAt: now,
    squads: [
      { id: "party-1", name: "レオン・アリア", members: ["aria", "leon"], repeat: true, run: null },
    ],
    log: [{ at: now, text: "アリアとレオン、ふたりの旅が始まった。" }],
  };
}
export function initialPrologueState(now: number): State {
  return { ...initialState(now), prologue: true };
}
export const activeBonds = (members: string[]) =>
  bonds.filter((b) => b.ids.every((id) => members.includes(id)));
export function memberStats(s: State, id: string) {
  const h = heroById(id),
    bonus = equipmentBonus(s, id);
  return h.stats.map((v, i) => Math.round(v * (1 + 0.1 * (level(s.xp[id] || 0) - 1))) + bonus[i]);
}
export function stats(s: State, sq: Squad) {
  return [0, 1, 2].map(
    (i) =>
      sq.members.reduce((v, id) => v + memberStats(s, id)[i], 0) +
      activeBonds(sq.members).reduce((v, b) => v + b.bonus, 0),
  );
}
export function memberMaxHp(s: State, id: string) {
  return Math.round(40 + memberStats(s, id)[1] * 2);
}
export function memberHealth(r: Run, id: string) {
  if (!Object.hasOwn(r.health, id)) throw Error(`仲間「${id}」のHPが見つかりません。`);
  return r.health[id];
}
export function healthRatio(health: MemberHealth) {
  return health.hp / health.maxHp;
}
export function totalMaxHp(r: Run) {
  return Object.values(r.health).reduce((sum, health) => sum + health.maxHp, 0);
}
export function lowestHealth(r: Run, members: string[]) {
  return members
    .filter((id) => memberHealth(r, id).hp < memberHealth(r, id).maxHp)
    .sort((a, b) => healthRatio(memberHealth(r, a)) - healthRatio(memberHealth(r, b)))[0];
}
export function healMember(r: Run, id: string, amount: number) {
  const health = memberHealth(r, id),
    restored = Math.min(amount, health.maxHp - health.hp);
  health.hp += restored;
  return restored;
}
export function healAll(r: Run, ratio: number) {
  for (const health of Object.values(r.health))
    health.hp = Math.min(health.maxHp, health.hp + health.maxHp * ratio);
}
export const power = (s: State, sq: Squad, q: Quest) =>
  stats(s, sq)[["採取", "護衛", "討伐"].indexOf(q.kind)];
export const memberLimit = (s: State) => (s.clears >= 10 ? 3 : 2);
export const squadLimit = (s: State) => (s.owned.length >= 6 ? 3 : s.owned.length >= 4 ? 2 : 1);
function standardEncounter(q: Quest, node: number): Encounter {
  if (q.kind === "採取") return node % 3 === 1 ? "battle" : "gather";
  if (q.kind === "護衛") return node === 1 ? "escort" : "battle";
  return "battle";
}
export function encounter(q: Quest, node: number): Encounter {
  const work = chapterTwoWork(q.id, node) || waterwayWork(q.id, node);
  if (work) return work.kind;
  if (q.id === WETLAND_QUEST) return "gather";
  if (q.id === TOWN_QUEST) return "escort";
  if (q.id === NIGHT_QUEST) return (["escort", "battle", "escort"] as const)[node % 3];
  if (q.id === RETURN_QUEST) return (["escort", "battle", "battle"] as const)[node % 3];
  if (q.id === TRADE_QUEST) return (["escort", "gather", "battle"] as const)[node % 3];
  return standardEncounter(q, node);
}
function gatherTargetName(q: Quest) {
  if (q.gatherTarget) return q.gatherTarget;
  if (q.id === "crystal") return "青晶石";
  if (q.id === "blossom") return "千年樹の花";
  return "月しずく草";
}
function enemyTargetName(q: Quest) {
  if (q.enemyName) return q.enemyName;
  if (q.enemy === 10) return "星喰い竜";
  if (q.enemy === 9) return "霧狼";
  return "スライム";
}
export function targetName(q: Quest, node: number, nodes = 15) {
  const battle = puppetBattleName(q.id, node, nodes);
  if (battle) return battle;
  const work = chapterTwoWork(q.id, node) || waterwayWork(q.id, node);
  if (work) return work.name;
  if (q.id === WETLAND_QUEST)
    return ["湿った木陰を探す", "苔の葉を見分ける", "群落の周りを確かめる"][node % 3];
  if (q.id === TOWN_QUEST)
    return ["倉庫で荷札を確かめる", "商店へ荷物を運ぶ", "品を渡して控えを受け取る"][node % 3];
  const kind = encounter(q, node);
  if (kind === "gather") return gatherTargetName(q);
  if (kind === "escort") return q.escortTarget || "旅人を目的地へ";
  return enemyTargetName(q);
}
export const stepMs = () => 1050;
export function estimate(s: State, sq: Squad, q: Quest) {
  return Math.round(
    Array.from({ length: questNodes(q.id) }, (_, node) => estimateNode(s, sq, q, node)).reduce(
      (sum, seconds) => sum + seconds,
      0,
    ),
  );
}
export function statIndex(kind: Encounter) {
  return kind === "battle" ? 2 : kind === "gather" ? 0 : 1;
}
export function specialInterval(hero: string) {
  return hero === "aria" ? 3 : 4;
}
export function specialMultiplier(hero: string) {
  if (hero === "leon") return 1.7;
  if (hero === "aria") return 1.65;
  return 1;
}
export function resistanceFor(q: Quest, kind: Encounter) {
  return kind === "battle" ? 0 : workResistance(q);
}
function estimateNode(s: State, sq: Squad, q: Quest, node: number) {
  const kind = encounter(q, node),
    enemies = kind === "battle" ? createEnemies(q, node, 0) : [],
    bond = activeBonds(sq.members).reduce((sum, b) => sum + b.bonus, 0);
  const dps = sq.members.reduce((sum, id) => {
    const base = 2 + memberStats(s, id)[statIndex(kind)] * 0.23 + bond * 0.1,
      multiplier =
        techniqueMultiplier(s, id, kind, false, 1) +
        (techniqueMultiplier(s, id, kind, true, specialMultiplier(id)) -
          techniqueMultiplier(s, id, kind, false, 1)) /
          specialInterval(id),
      period = (stepMs() * (0.8 + (heroes.findIndex((h) => h.id === id) % 4) * 0.13)) / 1000;
    const hit = reducedDamage(
      base * multiplier,
      enemies.length ? enemies[0].resistance : workResistance(q),
      penetration(s, id),
    );
    return sum + hit / period;
  }, 0);
  const work = enemies.length
    ? enemies.reduce((sum, enemy) => sum + enemy.hp, 0)
    : q.need * 1.12 * (kind === "escort" ? 1.8 : 2.3) * chapterTwoWorkload(q.id);
  return 2.5 + work / Math.max(0.1, dps);
}
