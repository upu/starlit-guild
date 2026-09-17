import { advanceQuestDestination } from "./quest-navigation.ts";
import {
  equipmentBonus,
  buyEquipment,
  changeEquipment,
  type Inventory,
  type EquipmentSlot,
} from "./equipment.ts";
import { questNodes, puppetBattleName } from "./puppet-battles.ts";
import { enemyText, groupEnemyTurns } from "./enemy-turns.ts";
import {
  createEnemies,
  damageEnemy,
  penetration,
  reducedDamage,
  syncEnemyTotals,
  type Enemy,
} from "./combat.ts";
import {
  TRADE_QUEST,
  RETURN_QUEST,
  TOWN_QUEST,
  TOWER_QUEST,
  NIGHT_QUEST,
  WETLAND_QUEST,
  WATERWAY_QUEST,
  RESTORATION_QUEST,
  MOSS_QUEST,
  isPrologueQuest,
  stageUnlocked,
  stageEndingPending,
  storyStages,
  nextStage,
} from "./prologue.ts";
import {
  chapterTwoQuests,
  chapterTwoWork,
  chapterTwoWorkload,
  PICNIC_QUEST,
  MOON_HERB_QUEST,
  DELIVERY_PREP_QUEST,
  SIGNPOST_QUEST,
  HOUSE_CALLS_QUEST,
  MEDICINE_RETURN_QUEST,
  trioQuest,
} from "./chapter-two.ts";
import {
  learnTechnique,
  setTechnique,
  techniqueMultiplier,
  techniqueText,
  techniqueHerbs,
  equippedTechnique,
  type Techniques,
  type TechniqueSlot,
} from "./techniques.ts";
import { waterwayWork } from "./waterway-work.ts";
import {
  availableStories,
  coupleCombo,
  storyProgress,
  together,
  type StoryProgress,
} from "./stories.ts";
import { heroes as baseHeroes, bonds, level, type Kind } from "./roster.ts";
export { bonds, level };
export type { Kind };
export const heroes = baseHeroes.map((h, i) => ({ ...h, sprite: i }));
export type Quest = {
  id: string;
  name: string;
  kind: Kind;
  region: string;
  desc: string;
  tier: number;
  need: number;
  seconds: number;
  gold: number;
  xp: number;
  herbs: number;
  ore: number;
  unlock: number;
  enemy: number;
  enemyName?: string;
  background?: string;
  gatherTarget?: string;
  escortTarget?: string;
  escortAsset?: string;
  availability?: "repeatable" | "once";
};
export const quests: Quest[] = (
  [
    {
      id: TRADE_QUEST,
      name: "街への交易",
      kind: "護衛",
      region: "街へ続く交易路",
      desc: "それぞれの村から預かった品を、街の取引先へ。道中で頼まれた薬草も採りながら、アリアとレオンで荷物を届けよう。",
      tier: 1,
      need: 12,
      seconds: 180,
      gold: 120,
      xp: 60,
      herbs: 10,
      ore: 0,
      unlock: 0,
      enemy: 8,
      background: "/scenery/forest-background.webp",
      gatherTarget: "取引先に頼まれた薬草",
      escortTarget: "村から預かった荷物",
      availability: "repeatable",
    },
    {
      id: RETURN_QUEST,
      name: "夕暮れの帰り道",
      kind: "護衛",
      region: "村へ戻る交易路",
      desc: "買い物を終えたら、村への分かれ道まで一緒に。帰りの品を運びながら、夕方の街道を進もう。",
      tier: 1,
      need: 13,
      seconds: 180,
      gold: 100,
      xp: 65,
      herbs: 0,
      ore: 0,
      unlock: 0,
      enemy: 8,
      enemyName: "道に出てきたスライム",
      background: "/scenery/evening-trade-road-background.webp",
      escortTarget: "村へ持ち帰る品",
      availability: "repeatable",
    },
    {
      id: TOWN_QUEST,
      name: "街の配達仕事",
      kind: "護衛",
      region: "街の倉庫と商店",
      desc: "後日の交易を終えると、取引先から小さな配達を頼まれた。荷札と受け取りの控えを確かめ、倉庫から商店へ品を届けよう。",
      tier: 1,
      need: 12,
      seconds: 180,
      gold: 130,
      xp: 65,
      herbs: 0,
      ore: 0,
      unlock: 0,
      enemy: 8,
      background: "/scenery/town-deliveries-background.webp",
      escortTarget: "商店へ届ける荷物",
      availability: "repeatable",
    },
    {
      id: TOWER_QUEST,
      name: "丘の塔へ寄り道",
      kind: "採取",
      region: "畑と林を抜ける丘の道",
      desc: "街での仕事を済ませたら、気になっていた塔へ。道端の薬草を採りながら、小さな林と湿った坂道をふたりで進もう。",
      tier: 1,
      need: 14,
      seconds: 180,
      gold: 100,
      xp: 70,
      herbs: 10,
      ore: 0,
      unlock: 0,
      enemy: 8,
      enemyName: "林から出てきたスライム",
      background: "/scenery/tower-road-background.webp",
      gatherTarget: "道端の薬草",
      availability: "repeatable",
    },
    {
      id: NIGHT_QUEST,
      name: "苔灯と帰る夜道",
      kind: "護衛",
      region: "村々へ続く夜の交易路",
      desc: "塔で分けてもらった苔を小さな灯りにして、村々への分かれ道へ。普段のランタンも携え、足元を確かめながら帰ろう。",
      tier: 1,
      need: 14,
      seconds: 180,
      gold: 100,
      xp: 70,
      herbs: 0,
      ore: 0,
      unlock: 0,
      enemy: 8,
      enemyName: "夜道に出てきたスライム",
      background: "/scenery/moss-night-road-background.webp",
      escortTarget: "苔灯で足元を照らす",
      escortAsset: "/items/moss-lamp.png",
      availability: "repeatable",
    },
    {
      id: WETLAND_QUEST,
      name: "森の苔を探して",
      kind: "採取",
      region: "木陰に水の残る森の湿地",
      desc: "約束した午後、持ち帰った苔を携えて森へ。アリアが見覚えのある湿った木陰を探し、少しだけ分けてもらって見比べよう。",
      tier: 1,
      need: 14,
      seconds: 180,
      gold: 100,
      xp: 75,
      herbs: 0,
      ore: 0,
      unlock: 0,
      enemy: 8,
      background: "/scenery/forest-wetland-background.webp",
      gatherTarget: "湿地の草葉と苔",
      availability: "repeatable",
    },
    {
      id: WATERWAY_QUEST,
      name: "古い水路をたどって",
      kind: "採取",
      region: "塔の裏手の湿った斜面",
      desc: "森での記録を管理人へ持っていこう。塔のそばで苔を見比べ、古い管理図と湿った地面を手がかりに、水路の出口を探そう。",
      tier: 1,
      need: 15,
      seconds: 180,
      gold: 100,
      xp: 80,
      herbs: 0,
      ore: 0,
      unlock: 0,
      enemy: 8,
      enemyName: "斜面のスライム",
      background: "/scenery/old-waterway-background.webp",
      gatherTarget: "水路の道筋",
      availability: "repeatable",
    },
    {
      id: RESTORATION_QUEST,
      name: "水の通り道を戻す仕事",
      kind: "護衛",
      region: "塔の古い排水路",
      desc: "街の作業者と水路の修理へ。周囲の魔物を追い払い、道具を運び、水が下流へ流れることを確かめよう。",
      tier: 1,
      need: 15,
      seconds: 180,
      gold: 150,
      xp: 85,
      herbs: 0,
      ore: 0,
      unlock: 0,
      enemy: 8,
      enemyName: "水路脇のスライム",
      background: "/scenery/old-waterway-background.webp",
      gatherTarget: "水路に残った枝と小石",
      escortTarget: "水路の修理を手伝う",
      availability: "repeatable",
    },
    {
      id: MOSS_QUEST,
      name: "もう一度、あの灯りを",
      kind: "採取",
      region: "水の引いた塔の足元",
      desc: "水路は直った。次は石組みの奥に増えすぎた苔を取り除こう。管理人と点検口を開け、ふたりで剥がした苔を籠へ集めて、塔から離れた場所へ運び出そう。",
      tier: 1,
      need: 15,
      seconds: 180,
      gold: 150,
      xp: 90,
      herbs: 0,
      ore: 0,
      unlock: 0,
      enemy: 8,
      enemyName: "石陰のスライム",
      background: "/scenery/tower-drainage-open-background.webp",
      gatherTarget: "石組みを覆う苔",
      escortTarget: "苔の撤去を手伝う",
      availability: "repeatable",
    },
    ...chapterTwoQuests,
  ] satisfies Quest[]
).sort((a, b) => a.unlock - b.unlock);
export const allQuests: Quest[] = quests;
export const availableQuests = (s: State) =>
  quests.filter(
    (q) =>
      q.unlock <= s.clears &&
      isPrologueQuest(q.id) &&
      stageUnlocked(s, q.id) &&
      (q.availability !== "once" || !s.done[q.id]),
  );
export type Encounter = "battle" | "gather" | "escort";
export type GameEvent = {
  id: string;
  at: number;
  kind:
    "hit" | "gather" | "hurt" | "heal" | "clear" | "move" | "rest" | "assist" | "skill" | "combo";
  text: string;
  amount?: number;
  hero?: string;
  target?: string;
  enemy?: string;
};
export type Actor = {
  actions: number;
  hero: string;
  arrivesAt: number;
  nextAt: number;
  period: number;
};
export type Scene = { title: string; lines: string[]; at: number; kind: "combo" };
export type MemberHealth = { hp: number; maxHp: number };
export type Run = {
  serial: number;
  nodes: number;
  ward: number;
  comboAt: number;
  scene: Scene | null;
  actors: Actor[];
  enemyAt: number;
  enemies?: Enemy[];
  quest: string;
  round: number;
  node: number;
  phase: "move" | "work" | "rest";
  phaseAt: number;
  nextAt: number;
  started: number;
  health: Record<string, MemberHealth>;
  target: number;
  targetMax: number;
  hits: number;
  energy: number;
  energyAt: number;
  events: GameEvent[];
};
export type Squad = {
  id: string;
  name: string;
  customName?: string;
  members: string[];
  repeat: boolean;
  run: Run | null;
  lastQuest?: string;
};
export type State = {
  version: 4;
  autoNextQuest?: boolean;
  prologue?: boolean;
  techniques?: Techniques;
  inventory?: Inventory;
  story?: StoryProgress;
  wood: number;
  town: number;
  friendship: Record<string, number>;
  discoveries: number;
  gold: number;
  herbs: number;
  ore: number;
  owned: string[];
  xp: Record<string, number>;
  gear: number;
  camp: number;
  clears: number;
  done: Record<string, number>;
  claimed: string[];
  lastDaily: string;
  updatedAt: number;
  squads: Squad[];
  log: { text: string; at: number }[];
  receipts: string[];
};
type LegacySharedRun = Omit<Run, "health"> & { hp: number; maxHp: number };
type LegacySharedHealthState = Omit<State, "squads"> & {
  squads: (Omit<Squad, "run"> & { run: LegacySharedRun | null })[];
};
export type Rewards = {
  count: number;
  gold: number;
  xp: number;
  herbs: number;
  ore: number;
  wood: number;
  offline: boolean;
  capped: boolean;
};
function heroById(id: string) {
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
function questById(id: string) {
  const quest = allQuests.find((q) => q.id === id);
  if (!quest) throw Error(`依頼「${id}」が見つかりません。`);
  return quest;
}
function activeRun(sq: Squad) {
  if (!sq.run) throw Error(`隊「${sq.id}」は冒険中ではありません。`);
  return sq.run;
}
export function initialState(now: number): State {
  return {
    version: 4,
    story: { departed: [], completed: [], read: [] },
    wood: 0,
    town: 0,
    friendship: {},
    discoveries: 0,
    gold: 60,
    herbs: 0,
    ore: 0,
    owned: ["aria", "leon"],
    xp: {},
    gear: 0,
    camp: 0,
    clears: 0,
    done: {},
    claimed: [],
    lastDaily: "",
    updatedAt: now,
    squads: [
      { id: "party-1", name: "レオン・アリア", members: ["aria", "leon"], repeat: true, run: null },
    ],
    log: [{ at: now, text: "アリアとレオン、ふたりの旅が始まった。" }],
    receipts: [],
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
  return h.stats.map(
    (v, i) =>
      Math.round(
        v * (1 + 0.1 * (level(s.xp[id] || 0) - 1)) * (1 + 0.08 * s.gear + (s.town >= 2 ? 0.08 : 0)),
      ) + bonus[i],
  );
}
export function stats(s: State, sq: Squad) {
  return [0, 1, 2].map(
    (i) =>
      sq.members.reduce((v, id) => v + memberStats(s, id)[i], 0) +
      activeBonds(sq.members).reduce((v, b) => v + b.bonus, 0),
  );
}
export function memberMaxHp(s: State, id: string) {
  return Math.round((40 + memberStats(s, id)[1] * 2) * (s.town >= 1 ? 1.1 : 1));
}
function memberHealth(r: Run, id: string) {
  if (!Object.hasOwn(r.health, id)) throw Error(`仲間「${id}」のHPが見つかりません。`);
  return r.health[id];
}
function healthRatio(health: MemberHealth) {
  return health.hp / health.maxHp;
}
function totalMaxHp(r: Run) {
  return Object.values(r.health).reduce((sum, health) => sum + health.maxHp, 0);
}
function lowestHealth(r: Run, members: string[]) {
  return members
    .filter((id) => memberHealth(r, id).hp < memberHealth(r, id).maxHp)
    .sort((a, b) => healthRatio(memberHealth(r, a)) - healthRatio(memberHealth(r, b)))[0];
}
function healMember(r: Run, id: string, amount: number) {
  const health = memberHealth(r, id),
    restored = Math.min(amount, health.maxHp - health.hp);
  health.hp += restored;
  return restored;
}
function healAll(r: Run, ratio: number) {
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
export const stepMs = (s: State) => Math.round(1050 * (1 - 0.035 * s.camp));
export function estimate(s: State, sq: Squad, q: Quest) {
  return Math.round(
    Array.from({ length: questNodes(q.id) }, (_, node) => estimateNode(s, sq, q, node)).reduce(
      (sum, seconds) => sum + seconds,
      0,
    ),
  );
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
      period = (stepMs(s) * (0.8 + (heroes.findIndex((h) => h.id === id) % 4) * 0.13)) / 1000;
    const hit = enemies.length
      ? reducedDamage(base * multiplier, enemies[0].resistance, penetration(s, id))
      : base * multiplier;
    return sum + hit / period;
  }, 0);
  const work = enemies.length
    ? enemies.reduce((sum, enemy) => sum + enemy.hp, 0)
    : q.need * 1.12 * (kind === "escort" ? 1.8 : 2.3) * chapterTwoWorkload(q.id);
  return 2.5 + work / Math.max(0.1, dps);
}
function addLog(s: State, text: string, at: number) {
  s.log = [{ text, at }, ...s.log].slice(0, 40);
}
function event(
  r: Run,
  at: number,
  kind: GameEvent["kind"],
  text: string,
  amount?: number,
  hero?: string,
  target?: string,
  enemy?: string,
) {
  r.events = [
    ...r.events,
    {
      id: `${String(r.round)}-${String(r.node)}-${String(at)}-${kind}-${String(r.hits)}-${hero || "leader"}-${target || "none"}-${String(++r.serial)}`,
      at,
      kind,
      text,
      amount,
      hero,
      target,
      enemy,
    },
  ].slice(-12);
}
function configureTarget(r: Run, q: Quest) {
  r.enemies =
    encounter(q, r.node) === "battle" ? createEnemies(q, r.node, r.phaseAt, r.nodes !== 15) : [];
  r.targetMax = Math.round(
    q.need * 1.12 * (encounter(q, r.node) === "escort" ? 1.8 : 2.3) * chapterTwoWorkload(q.id),
  );
  r.target = r.targetMax;
  r.hits = 0;
  syncEnemyTotals(r);
}
export function travelMs(id: string) {
  return 2200 + (heroes.findIndex((h) => h.id === id) % 4) * 310;
}
function schedule(s: State, sq: Squad, r: Run, at: number) {
  r.actors = sq.members.map((hero) => ({
    hero,
    actions: 0,
    arrivesAt: at + travelMs(hero),
    nextAt: at + travelMs(hero),
    period: Math.round(stepMs(s) * (0.8 + (heroes.findIndex((h) => h.id === hero) % 4) * 0.13)),
  }));
  r.enemyAt = at + 3700;
  for (const [index, enemy] of (r.enemies || []).entries())
    enemy.nextAt = enemy.role ? at + 2800 + enemy.period : at + 3700 + index * 450;
  syncEnemyTotals(r);
  if (r.comboAt <= at) r.comboAt = at + 14500;
  r.nextAt = nextEvent(r);
}
function makeRun(s: State, sq: Squad, q: Quest, at: number, round = 1): Run {
  const health = Object.fromEntries(
    sq.members.map((id) => {
      const maxHp = memberMaxHp(s, id);
      return [id, { hp: maxHp, maxHp }];
    }),
  );
  const r: Run = {
    serial: 0,
    nodes: questNodes(q.id),
    ward: 0,
    comboAt: at + 14500,
    scene: null,
    actors: [],
    enemyAt: at + 3700,
    quest: q.id,
    round,
    node: 0,
    phase: "move",
    phaseAt: at,
    nextAt: at + 2200,
    started: at,
    health,
    target: 0,
    targetMax: 0,
    hits: 0,
    energy: 3,
    energyAt: at,
    events: [],
  };
  configureTarget(r, q);
  schedule(s, sq, r, at);
  return r;
}
function nextEvent(r: Run) {
  return Math.min(...r.actors.map((a) => a.nextAt), r.enemyAt, r.comboAt);
}
export const heroSkills: Record<string, { style: string; name: string; description: string }> = {
  aria: {
    style: "ranged",
    name: "風の二連矢",
    description: "離れて矢を放ち、3回ごとに二連射。寄り道も得意。",
  },
  leon: {
    style: "melee",
    name: "暁の踏み込み",
    description: "前線へ飛び込み、4回ごとに強力な斬撃。",
  },
  mira: {
    style: "healer",
    name: "月明かりの癒やし",
    description: "4回の行動ごとに、最も弱った仲間を回復。",
  },
};
export const bondKey = (ids: string[]) => [...ids].sort().join("-");
export const bondLevel = (s: State, ids: string[]) =>
  Math.min(3, 1 + Math.floor((s.friendship[bondKey(ids)] || 0) / 12));
function recordPairStory(s: State, sq: Squad, q: Quest) {
  s.story ??= storyProgress(s);
  if (!together(sq.members) || s.story.completed.includes(q.id)) return;
  if (!s.story.departed.includes(q.id)) s.story.departed.push(q.id);
  s.story.completed.push(q.id);
}
function finishQuest(s: State, sq: Squad, q: Quest) {
  recordPairStory(s, sq, q);
  s.clears++;
  s.done[q.id] = (s.done[q.id] || 0) + 1;
}
function awardExperience(s: State, sq: Squad, xp: number) {
  for (const id of sq.members) s.xp[id] = (s.xp[id] || 0) + xp;
}
function awardFriendship(s: State, sq: Squad) {
  for (const bond of activeBonds(sq.members)) {
    const key = bondKey(bond.ids);
    s.friendship[key] = (s.friendship[key] || 0) + (s.town >= 1 ? 2 : 1);
  }
}
function reward(s: State, sq: Squad, q: Quest, at: number, finished: boolean) {
  const r = activeRun(sq),
    portions = r.nodes === questNodes(q.id) ? Math.ceil(r.nodes / 3) : 5,
    part = Math.floor(r.node / 3);
  const totalGold = q.gold,
    gold =
      portions === 5
        ? Math.floor(totalGold / 5)
        : Math.floor((totalGold * (part + 1)) / portions) -
          Math.floor((totalGold * part) / portions);
  const herbs = (q.herbs / portions + (s.town >= 2 ? 2 : 0)) * techniqueHerbs(s, sq.members),
    ore = q.ore / portions,
    xp = q.xp / portions,
    wood = q.tier + 2;
  s.gold += gold;
  s.herbs += herbs;
  s.ore += ore;
  s.wood += wood;
  if (finished) finishQuest(s, sq, q);
  awardExperience(s, sq, xp);
  awardFriendship(s, sq);
  return { gold, xp, herbs, ore, wood, at, finished };
}
function completeNode(s: State, sq: Squad, q: Quest, at: number) {
  const r = activeRun(sq);
  event(
    r,
    at,
    "clear",
    r.enemies?.some((enemy) => enemy.role === "puppeteer")
      ? "人形が止まり、少女は糸を引いて退いた"
      : targetName(q, r.node, r.nodes) + "をクリア！",
  );
  const finished = r.node === r.nodes - 1;
  const gain = (r.node + 1) % 3 === 0 || finished ? reward(s, sq, q, at, finished) : null;
  if (gain)
    event(
      r,
      at,
      "clear",
      "区間の報酬を確保！ +" + String(gain.gold) + " G · 木材 +" + String(gain.wood),
    );
  if (!finished) {
    r.node++;
    r.phase = "move";
    r.phaseAt = at;
    healAll(r, s.town >= 2 ? 0.2 : 0.15);
    configureTarget(r, q);
    schedule(s, sq, r, at);
    return gain;
  }
  sq.lastQuest ??= q.id;
  const canRepeat = !isPrologueQuest(q.id) || s.story?.read.includes(q.id + "-return");
  if (sq.repeat && q.availability !== "once" && canRepeat) {
    const { events, scene } = r;
    sq.run = makeRun(s, sq, q, at, r.round + 1);
    sq.run.events = events;
    sq.run.scene = scene;
  } else sq.run = null;
  return gain;
}
function combination(s: State, sq: Squad, at: number) {
  const r = activeRun(sq),
    bs = activeBonds(sq.members);
  r.comboAt = at + 14500;
  if (!bs.length) return;
  const b = bs[(r.node + r.round) % bs.length],
    lv = bondLevel(s, b.ids),
    q = questById(r.quest),
    k = encounter(q, r.node),
    first = heroById(b.ids[0]).name,
    second = heroById(b.ids[1]).name;
  if (b.ids.some((id) => memberHealth(r, id).hp <= 0)) return;
  const lines =
    lv === 1
      ? b.lines
      : lv === 2
        ? [first + "「いつもの合図で、いくよ！」", second + "「息はぴったりだ！」"]
        : [first + "「この先も、一緒に！」", second + "「どんな冒険だって！」"];
  r.scene = {
    title: b.name + " · 連携 Lv." + String(lv),
    lines: together(b.ids) ? coupleCombo(s, r.node + r.round) : lines,
    at,
    kind: "combo",
  };
  const base =
      k === "battle" && r.enemies?.length ? 10 + lv * 4 : r.targetMax * (0.12 + 0.035 * lv),
    power = b.ids.reduce((sum, id) => sum + penetration(s, id), 0) / b.ids.length,
    hit = damageEnemy(r, base, power);
  if (b.ids.includes("mira")) {
    healAll(r, 0.15);
    r.ward += Math.ceil(totalMaxHp(r) * 0.08);
  }
  event(
    r,
    at,
    "combo",
    b.name + "！ " + (k === "battle" ? "連携攻撃" : "息の合った作業"),
    hit.amount,
    b.ids[0],
    undefined,
    hit.enemy,
  );
}
function recoverRun(s: State, sq: Squad, r: Run, q: Quest, at: number) {
  for (const health of Object.values(r.health)) health.hp = health.maxHp;
  configureTarget(r, q);
  r.phase = "move";
  r.phaseAt = at;
  schedule(s, sq, r, at);
  event(r, at, "heal", "みんなでひと休みして、もう一度。");
}
function statIndex(kind: Encounter) {
  return kind === "battle" ? 2 : kind === "gather" ? 0 : 1;
}
function specialInterval(hero: string) {
  return hero === "aria" ? 3 : 4;
}
function specialMultiplier(hero: string) {
  if (hero === "leon") return 1.7;
  if (hero === "aria") return 1.65;
  return 1;
}
function quietStageWork(q: Quest, kind: Encounter) {
  return (
    [TOWN_QUEST, WETLAND_QUEST, DELIVERY_PREP_QUEST, HOUSE_CALLS_QUEST].includes(q.id) ||
    ([
      TOWER_QUEST,
      NIGHT_QUEST,
      WATERWAY_QUEST,
      RESTORATION_QUEST,
      MOSS_QUEST,
      MOON_HERB_QUEST,
      SIGNPOST_QUEST,
      MEDICINE_RETURN_QUEST,
    ].includes(q.id) &&
      kind !== "battle")
  );
}
function actorEventKind(q: Quest, kind: Encounter, special: boolean): GameEvent["kind"] {
  if (quietStageWork(q, kind)) return "gather";
  if (special) return "skill";
  return kind === "battle" ? "hit" : "gather";
}
function stageWorkText(q: Quest, kind: Encounter, special: boolean) {
  if (kind === "battle") return null;
  if ([RESTORATION_QUEST, MOSS_QUEST].includes(q.id))
    return kind === "gather" ? "手の届く範囲を丁寧に取り除く" : "声を掛け合って作業を進める";
  const texts: Partial<Record<string, [string, string]>> = {
    [HOUSE_CALLS_QUEST]: ["往診の包みと水を運ぶ", "控えと空き瓶を確かめる"],
    [MEDICINE_RETURN_QUEST]: ["空き瓶を守って道を歩く", "道標と荷車の往来を確かめる"],
    [DELIVERY_PREP_QUEST]: ["瓶と布を確かめて荷造り", "荷札と包みを照らし合わせる"],
    [SIGNPOST_QUEST]: ["踏み跡と道筋を確かめる", "道標を元の道へ戻す"],
    [MOON_HERB_QUEST]: ["葉の裏を見比べて採る", "採った場所ごとに包みを分ける"],
    [WATERWAY_QUEST]: ["草を分けて水路の道筋を確かめる", "地図と苔の続く先を照らし合わせる"],
    [WETLAND_QUEST]: ["草葉を分けて苔を探す", "葉の形と湿り気を丁寧に確かめる"],
    [TOWER_QUEST]: ["道端の薬草を採る", "葉を見分けて丁寧に採る"],
    [NIGHT_QUEST]: ["苔灯で足元を照らす", "灯りを寄せて道を確かめる"],
  };
  return texts[q.id]?.[Number(special)] || null;
}
function actorEventText(q: Quest, kind: Encounter, hero: string, special: boolean) {
  const work = stageWorkText(q, kind, special);
  if (work) return work;
  if (q.id === TOWN_QUEST) return special ? "息を合わせて荷運び" : "荷札の確認・配達";
  if (special) return heroSkills[hero].name;
  return kind === "battle" ? "攻撃" : "採取・護衛";
}
function healFromActor(s: State, sq: Squad, r: Run, hero: string, special: boolean, at: number) {
  const target = lowestHealth(r, sq.members);
  if (!special || hero !== "mira" || !target) return;
  const heal = 5 + level(s.xp[hero] || 0),
    restored = healMember(r, target, heal);
  event(r, at, "heal", heroSkills[hero].name, restored, hero, target);
}
function actorTurn(
  s: State,
  sq: Squad,
  r: Run,
  q: Quest,
  kind: Encounter,
  actor: Actor,
  at: number,
) {
  if (memberHealth(r, actor.hero).hp <= 0) {
    actor.nextAt += actor.period;
    return;
  }
  const hero = actor.hero,
    member = memberStats(s, hero),
    bond = activeBonds(sq.members).reduce((value, item) => value + item.bonus, 0);
  actor.actions++;
  const special = actor.actions % specialInterval(hero) === 0,
    multiplier = techniqueMultiplier(s, hero, kind, special, specialMultiplier(hero));
  const hit = damageEnemy(
    r,
    (2 + member[statIndex(kind)] * 0.23 + bond * 0.1) * multiplier,
    penetration(s, hero),
  );
  r.hits++;
  actor.nextAt += actor.period;
  const text = techniqueText(s, hero, kind, special),
    useSpecial = special && (!s.techniques || !["aria", "leon"].includes(hero) || !!text);
  if (special && kind === "battle" && equippedTechnique(s, hero, "active") === "leon-guard")
    r.ward += Math.ceil(totalMaxHp(r) * 0.12);
  event(
    r,
    at,
    actorEventKind(q, kind, useSpecial),
    heroById(hero).name + "：" + (text || actorEventText(q, kind, hero, useSpecial)),
    hit.amount,
    hero,
    undefined,
    hit.enemy,
  );
  healFromActor(s, sq, r, hero, special, at);
}
type StepResult = { completed: boolean; gain: ReturnType<typeof reward> | null };
function runActorTurns(
  s: State,
  sq: Squad,
  r: Run,
  q: Quest,
  kind: Encounter,
  at: number,
): StepResult {
  // Each companion and the enemy have independent clocks. A slow companion never blocks another.
  for (const actor of r.actors) {
    if (actor.nextAt !== at) continue;
    actorTurn(s, sq, r, q, kind, actor, at);
    if (r.target <= 0) return { completed: true, gain: completeNode(s, sq, q, at) };
  }
  return { completed: false, gain: null };
}
function enemyTurn(s: State, sq: Squad, r: Run, q: Quest, kind: Encounter, at: number) {
  if (r.enemies?.length) {
    groupEnemyTurns(s, sq, r, q, at, event);
    return;
  }
  if (r.enemyAt !== at) return;
  r.enemyAt += 1450;
  if (kind !== "battle") return;
  const living = sq.members.filter((id) => memberHealth(r, id).hp > 0);
  if (!living.length) return;
  const target = living[Math.floor((at - r.started) / 1450) % living.length],
    hurt = Math.max(1, Math.round(q.need * 0.24 - stats(s, sq)[1] * 0.05)),
    blocked = Math.min(r.ward, hurt),
    damage = Math.min(memberHealth(r, target).hp, hurt - blocked);
  r.ward -= blocked;
  memberHealth(r, target).hp -= damage;
  event(
    r,
    at,
    "hurt",
    heroById(target).name + "：" + enemyText(q, blocked),
    damage,
    undefined,
    target,
  );
}
function finishStep(r: Run, at: number) {
  if (Object.values(r.health).some((health) => health.hp > 0)) {
    r.nextAt = nextEvent(r);
    return;
  }
  r.phase = "rest";
  r.phaseAt = at;
  r.nextAt = at + 15000;
  event(r, at, "rest", "全員が力尽き、いったん退いて回復中。応援で立て直そう。");
}
function step(s: State, sq: Squad) {
  const r = activeRun(sq),
    q = questById(r.quest),
    at = r.nextAt;
  if (r.phase === "rest") {
    recoverRun(s, sq, r, q, at);
    return null;
  }
  const kind = encounter(q, r.node);
  if (r.comboAt === at) {
    combination(s, sq, at);
    if (r.target <= 0) return completeNode(s, sq, q, at);
  }
  if (r.phase === "move") {
    r.phase = "work";
    event(
      r,
      at,
      "move",
      targetName(q, r.node, r.nodes) + (q.id === TOWN_QUEST ? "。" : "を発見！"),
    );
  }
  const actors = runActorTurns(s, sq, r, q, kind, at);
  if (actors.completed) return actors.gain;
  enemyTurn(s, sq, r, q, kind, at);
  finishStep(r, at);
  return null;
}
function collectReward(rewards: Rewards, gain: ReturnType<typeof reward> | null) {
  if (!gain) return false;
  if (gain.finished) rewards.count++;
  rewards.gold += gain.gold;
  rewards.xp += gain.xp;
  rewards.herbs += gain.herbs;
  rewards.ore += gain.ore;
  rewards.wood += gain.wood;
  return gain.finished;
}
function settleSquad(s: State, sq: Squad, end: number, rewards: Rewards) {
  let count = 0;
  while (sq.run && sq.run.nextAt <= end) {
    if (collectReward(rewards, step(s, sq))) count++;
  }
  if (count)
    addLog(s, `${squadName(sq)}が ${String(count)} 件の依頼を達成。報酬を受け取りました。`, end);
}
function shiftRun(r: Run, shift: number) {
  r.nextAt += shift;
  r.phaseAt += shift;
  r.started += shift;
  r.energyAt += shift;
  r.enemyAt += shift;
  r.comboAt += shift;
  r.scene = null;
  for (const actor of r.actors) {
    actor.nextAt += shift;
    actor.arrivesAt += shift;
  }
  r.events = [];
  for (const enemy of r.enemies || []) enemy.nextAt += shift;
}
function applyOfflineCap(s: State, elapsed: number, capped: boolean) {
  if (!capped) return;
  const shift = elapsed - 43200000;
  for (const sq of s.squads) {
    if (sq.run) shiftRun(sq.run, shift);
  }
}
export function settle(input: State, now: number) {
  const s = structuredClone(input),
    elapsed = Math.max(0, now - s.updatedAt),
    end = s.updatedAt + Math.min(elapsed, 43200000);
  const rewards: Rewards = {
    count: 0,
    gold: 0,
    xp: 0,
    herbs: 0,
    ore: 0,
    wood: 0,
    offline: elapsed > 90000,
    capped: elapsed > 43200000,
  };
  for (const sq of s.squads) settleSquad(s, sq, end, rewards);
  applyOfflineCap(s, elapsed, rewards.capped);
  s.updatedAt = Math.max(now, s.updatedAt);
  rewards.gold = s.gold - input.gold;
  rewards.herbs = s.herbs - input.herbs;
  rewards.ore = s.ore - input.ore;
  rewards.wood = s.wood - input.wood;
  return { state: s, rewards };
}
function upgradeSharedHealth(input: State | LegacySharedHealthState): State {
  if (input.squads.every((sq) => !sq.run || "health" in sq.run)) return input as State;
  const s = structuredClone(input) as unknown as State;
  for (const sq of s.squads) {
    const run = sq.run as Run | LegacySharedRun | null;
    if (!run || "health" in run) continue;
    const ratio = Math.max(0, Math.min(1, run.hp / run.maxHp)),
      health = Object.fromEntries(
        sq.members.map((id) => {
          const maxHp = memberMaxHp(s, id);
          return [id, { hp: Math.round(maxHp * ratio), maxHp }];
        }),
      );
    const upgraded = { ...run, health } as Run & { hp?: number; maxHp?: number };
    delete upgraded.hp;
    delete upgraded.maxHp;
    sq.run = upgraded;
  }
  return s;
}
function upgradePicnicRun(input: State): State {
  if (!input.squads.some((sq) => sq.run?.quest === PICNIC_QUEST && sq.run.enemies?.length === 0))
    return input;
  const s = structuredClone(input);
  // Old local picnic saves used gathering targets. Preserve their current progress as a legacy target.
  for (const sq of s.squads)
    if (sq.run?.quest === PICNIC_QUEST && sq.run.enemies?.length === 0) delete sq.run.enemies;
  return s;
}
type LegacyDetourRun = Run & { detour: { hero: string; claimed: boolean } | null };
const pendingDetour = (run: Run | null) => (run as LegacyDetourRun | null)?.detour;
function forgetDetour(r: Run, updatedAt: number) {
  const detour = pendingDetour(r);
  if (!detour) return;
  if (!detour.claimed) {
    const actor = r.actors.find((a) => a.hero === detour.hero);
    if (actor) actor.nextAt = Math.min(actor.nextAt, Math.max(updatedAt, actor.arrivesAt));
  }
  delete (r as Partial<LegacyDetourRun>).detour;
  if (r.phase !== "rest") r.nextAt = nextEvent(r);
}
// Story saves written before detours were dropped can still hold a pending one, with its explorer
// waiting on the discovery clock. Bring that companion back and forget the discovery, without loot.
function upgradePendingDetour(input: State): State {
  if (!input.squads.some((sq) => pendingDetour(sq.run))) return input;
  const s = structuredClone(input);
  for (const sq of s.squads) if (sq.run) forgetDetour(sq.run, s.updatedAt);
  return s;
}
// Only v4 records load now; the v1-v3 migration chain went with the legacy mode.
export function migrate(raw: State | LegacySharedHealthState): State {
  return upgradePendingDetour(upgradePicnicRun(upgradeSharedHealth(raw)));
}
function addOnce(list: string[], value: string) {
  if (!list.includes(value)) list.push(value);
}
// Mark the first stages as departed, completed, and read, with the joins they carry.
export function completeStoryStages(s: State, count: number) {
  const story = (s.story ??= storyProgress(s));
  for (const { quest } of storyStages.slice(0, Math.max(0, count))) {
    s.done[quest] = 1;
    addOnce(story.departed, quest);
    addOnce(story.completed, quest);
    addOnce(story.read, quest + "-departure");
    addOnce(story.read, quest + "-return");
    if (quest === DELIVERY_PREP_QUEST) joinStoryMira(s);
  }
}
// Builds an achievement-count record for the regression tests that still cover the legacy mode.
// The app never creates one: that mode is kept readable but is no longer maintained.
// Test records follow the story stages. The legacy achievement-count mode is no longer created.
export function testState(now: number, stages: number, lv: number, gold: number): State {
  const s = initialPrologueState(now);
  const count = Math.min(storyStages.length, Math.max(0, Math.floor(stages)));
  completeStoryStages(s, count);
  s.clears = count;
  s.gold = Math.min(10000000, Math.max(0, Math.floor(gold)));
  // Carry the materials those stages actually reward. Wood belongs to the legacy camp only.
  for (const { quest } of storyStages.slice(0, count)) {
    const q = questById(quest);
    s.herbs += q.herbs;
    s.ore += q.ore;
  }
  for (const id of s.owned) s.xp[id] = 30 * (Math.min(50, Math.max(1, Math.floor(lv))) - 1) ** 2;
  s.squads[0].lastQuest = nextStage(s).quest;
  s.log = [{ at: now, text: "テスト用の冒険。普段の記録には影響しません。" }];
  return s;
}
export type Action = {
  type:
    | "start"
    | "stop"
    | "repeat"
    | "assist"
    | "sync"
    | "readStory"
    | "buy"
    | "equip"
    | "learnTechnique"
    | "setTechnique"
    | "autoNextQuest";
  squad?: string;
  id?: string;
  name?: string;
  hero?: string;
  slot?: EquipmentSlot;
  techniqueSlot?: TechniqueSlot;
  members?: string[];
  value?: boolean;
  mode?: "strike" | "heal";
  readDeparture?: boolean;
};
type ActionHandler = (s: State, sq: Squad, a: Action, now: number) => void;
function hiddenQuest(s: State, q: Quest) {
  return s.clears < q.unlock || !isPrologueQuest(q.id) || !stageUnlocked(s, q.id);
}
function startQuest(s: State, sq: Squad, a: Action) {
  if (sq.run) throw Error("この隊は冒険中です。");
  const q = allQuests.find((item) => item.id === a.id);
  if (!q || hiddenQuest(s, q)) throw Error("この依頼はまだ見つかっていません。");
  if (q.availability === "once" && s.done[q.id]) throw Error("このクエストは達成済みです。");
  if (q.availability === "once" && s.squads.some((p) => p.run?.quest === q.id))
    throw Error("このクエストは、別の隊が冒険中です。");
  if (isPrologueQuest(q.id) && stageEndingPending(s))
    throw Error("達成後の物語を読み終えてから、次の出発へ進みましょう。");
  if (sq.members.length < 1) throw Error("仲間を1人以上編成してください。");
  return q;
}
function recordDeparture(s: State, sq: Squad, q: Quest) {
  s.story ??= storyProgress(s);
  if (together(sq.members) && !s.story.departed.includes(q.id)) s.story.departed.push(q.id);
}
function readDepartureStory(s: State, q: Quest) {
  const story = availableStories(s).find(
    (item) => item.quest === q.id && item.chapter === "departure",
  );
  if (story && !s.story?.read.includes(story.id)) s.story?.read.push(story.id);
}
function startAction(s: State, sq: Squad, a: Action, now: number) {
  const q = startQuest(s, sq, a);
  sq.members = trioQuest(q.id) ? ["aria", "leon", "mira"] : ["aria", "leon"];
  recordDeparture(s, sq, q);
  if (typeof a.value === "boolean") sq.repeat = a.value;
  sq.run = makeRun(s, sq, q, now);
  sq.lastQuest = q.id;
  if (a.readDeparture) readDepartureStory(s, q);
  addLog(s, `${squadName(sq)}が「${q.name}」に出発。`, now);
}
function readStoryAction(s: State, _sq: Squad, a: Action) {
  const id = a.id;
  if (!id || !availableStories(s).some((story) => story.id === id))
    throw Error("この思い出は、まだ開かれていません。");
  if (id === DELIVERY_PREP_QUEST + "-return" && s.squads.some((p) => p.run?.quest === "join-mira"))
    throw Error("ミラとの専用クエストから帰還してから、この物語を読み終えましょう。");
  s.story ??= storyProgress(s);
  if (s.story.read.includes(id)) return;
  s.story.read.push(id);
  if (id === DELIVERY_PREP_QUEST + "-return") joinStoryMira(s);
  advanceQuestDestination(s, id);
}
function joinStoryMira(s: State) {
  if (!s.owned.includes("mira")) {
    s.owned.push("mira");
    if (!Object.hasOwn(s.xp, "mira")) s.xp.mira = Math.min(s.xp.aria || 0, s.xp.leon || 0);
  }
  const party = s.squads.find((p) => p.lastQuest === DELIVERY_PREP_QUEST) || s.squads[0];
  if (!party.run && !party.members.includes("mira")) party.members.push("mira");
}
function stopAction(s: State, sq: Squad, _a: Action, now: number) {
  if (sq.run) sq.lastQuest ??= sq.run.quest;
  sq.run = null;
  addLog(s, `${squadName(sq)}が帰還。達成済みの報酬は持ち帰りました。`, now);
}
function autoNextQuestAction(s: State, _sq: Squad, a: Action) {
  if (typeof a.value !== "boolean") throw Error("設定を確認してください。");
  s.autoNextQuest = a.value;
}
function repeatAction(_s: State, sq: Squad, a: Action) {
  if (typeof a.value !== "boolean") throw Error("設定を確認してください。");
  sq.repeat = a.value;
}
function healAssist(s: State, sq: Squad, r: Run, now: number, targetId?: string) {
  if (targetId && !sq.members.includes(targetId)) throw Error("回復する仲間を確認してください。");
  const target = targetId || lowestHealth(r, sq.members);
  if (!target) return;
  const health = memberHealth(r, target);
  if (health.hp >= health.maxHp) return;
  const heal = Math.max(3, Math.ceil(health.maxHp * 0.05)),
    restored = healMember(r, target, heal);
  if (r.phase === "rest") {
    r.phase = "move";
    r.phaseAt = now;
    configureTarget(r, questById(r.quest));
    schedule(s, sq, r, now);
  }
  event(
    r,
    now,
    "heal",
    "手助けで" + heroById(target).name + "を回復！",
    restored,
    undefined,
    target,
  );
}
function strikeAssist(s: State, sq: Squad, r: Run, now: number) {
  if (r.phase === "rest") throw Error("回復で立て直しましょう。");
  const q = questById(r.quest),
    index = statIndex(encounter(q, r.node)),
    members = sq.members.filter((id) => memberHealth(r, id).hp > 0),
    power = members.reduce((sum, id) => sum + penetration(s, id), 0) / Math.max(1, members.length),
    hit = damageEnemy(r, Math.max(2, Math.round(2 + s.gear + stats(s, sq)[index] * 0.035)), power);
  event(r, now, "assist", "手助け！", hit.amount, undefined, undefined, hit.enemy);
}
function finishAssist(s: State, sq: Squad, r: Run, now: number) {
  if (r.target > 0) return;
  const gain = completeNode(s, sq, questById(r.quest), now);
  if (gain) addLog(s, squadName(sq) + "が区間の報酬を確保！ +" + String(gain.gold) + " G", now);
}
function assistAction(s: State, sq: Squad, a: Action, now: number) {
  const r = sq.run;
  if (!r) throw Error("冒険中に応援できます。");
  r.hits++;
  if (a.mode === "heal") healAssist(s, sq, r, now, a.id);
  else strikeAssist(s, sq, r, now);
  finishAssist(s, sq, r, now);
}
function syncAction() {
  /* Cloning the current state completes synchronization. */
}
function buyAction(s: State, _sq: Squad, a: Action, now: number) {
  const item = buyEquipment(s, a.id || "");
  addLog(s, `${item.name}を購入。バッグに入れた。`, now);
}
function equipAction(s: State, _sq: Squad, a: Action) {
  const hero = a.hero;
  if (!hero || !a.slot) throw Error("装備するキャラクターと場所を確認してください。");
  changeEquipment(s, hero, a.slot, a.id);
  for (const squad of s.squads) {
    const health = squad.run?.health[hero];
    if (!health) continue;
    const ratio = health.hp / health.maxHp;
    health.maxHp = memberMaxHp(s, hero);
    health.hp = health.maxHp * ratio;
  }
}
function learnTechniqueAction(s: State, _sq: Squad, a: Action) {
  learnTechnique(s, a.id || "");
}
function setTechniqueAction(s: State, _sq: Squad, a: Action) {
  if (!a.hero || !a.techniqueSlot) throw Error("セットする仲間と枠を確認してください。");
  setTechnique(s, a.hero, a.techniqueSlot, a.id);
}
const actionHandlers: Record<Action["type"], ActionHandler> = {
  autoNextQuest: autoNextQuestAction,
  learnTechnique: learnTechniqueAction,
  setTechnique: setTechniqueAction,
  sync: syncAction,
  start: startAction,
  readStory: readStoryAction,
  stop: stopAction,
  repeat: repeatAction,
  assist: assistAction,
  buy: buyAction,
  equip: equipAction,
};
export function act(input: State, a: Action, now: number) {
  const s = structuredClone(input),
    sq = s.squads.find((p) => p.id === a.squad) || s.squads[0];
  if (a.squad && !s.squads.some((p) => p.id === a.squad)) throw Error("パーティが見つかりません。");
  const handlers = actionHandlers as Partial<Record<string, ActionHandler>>,
    handler = Object.prototype.hasOwnProperty.call(handlers, a.type) ? handlers[a.type] : undefined;
  if (!handler) throw Error("操作を確認してください。");
  handler(s, sq, a, now);
  return s;
}
