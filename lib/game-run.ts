import { applyDepartureConsumables, consumableExperience } from "./consumable-effects.ts";
import { paralyzed } from "./chapter-four-battles.ts";
import { beginRoadExit, startRoadScene } from "./road-scenes.ts";
import { questNodes, shortRoute } from "./puppet-battles.ts";
import { createEnemies, damageEnemy, penetration, syncEnemyTotals } from "./combat.ts";
import { isPrologueQuest } from "./prologue.ts";
import { techniqueHerbs } from "./techniques.ts";
import { coupleCombo, storyProgress, together } from "./stories.ts";
import type { Quest } from "./game-content.ts";
import type { GameEvent, Run, Squad, State } from "./game-types.ts";
import {
  ensureChapterRoad,
  placeRoadEnemies,
  roadImpact,
  roadActionKind,
  roadTransport,
  roadHasEnemies,
  CHAPTER_ROAD_STEP,
} from "./chapter-road.ts";
import {
  activeBonds,
  activeRun,
  actorPeriod,
  encounter,
  healAll,
  heroById,
  memberHealth,
  memberMaxHp,
  questById,
  resistanceFor,
  targetName,
  totalMaxHp,
  travelMs,
  workTarget,
} from "./game-rules.ts";

export function addLog(s: State, text: string, at: number) {
  s.log = [{ text, at }, ...s.log].slice(0, 40);
}
export function event(
  r: Run,
  at: number,
  kind: GameEvent["kind"],
  text: string,
  amount?: number,
  hero?: string,
  target?: string,
  enemy?: string,
) {
  roadImpact(r, kind, hero, target, enemy);
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
export function configureTarget(r: Run, q: Quest) {
  if (r.road) delete r.road.ambushNode;
  r.enemies =
    encounter(q, r.node, r.nodes) === "battle"
      ? createEnemies(q, r.node, r.phaseAt, shortRoute(r.nodes), r.nodes)
      : [];
  r.targetMax = Math.round(workTarget(q, encounter(q, r.node, r.nodes)));
  r.target = r.targetMax;
  r.hits = 0;
  syncEnemyTotals(r);
  placeRoadEnemies(r);
}
export function schedule(s: State, sq: Squad, r: Run, at: number) {
  if (r.road) {
    r.road.at = at;
    r.road.previousAt = at;
    r.road.nextAt = at + CHAPTER_ROAD_STEP;
    r.road.previousCamera = r.road.camera;
    for (const position of Object.values(r.road.members)) position.previousX = position.x;
  }
  r.actors = sq.members.map((hero) => ({
    hero,
    actions: 0,
    arrivesAt: at + travelMs(hero),
    nextAt: at + travelMs(hero),
    period: Math.round(actorPeriod(hero)),
  }));
  r.enemyAt = at + 3700;
  for (const [index, enemy] of (r.enemies || []).entries())
    enemy.nextAt = at + initialEnemyDelay(enemy, index);
  syncEnemyTotals(r);
  if (r.comboAt <= at) r.comboAt = at + 14500;
  r.nextAt = nextEvent(r);
}
function initialEnemyDelay(enemy: NonNullable<Run["enemies"]>[number], index: number) {
  if (enemy.trick === "merrill") return 1000;
  return enemy.role ? 2800 + enemy.period : 3700 + index * 450;
}
export function makeRun(s: State, sq: Squad, q: Quest, at: number, round = 1): Run {
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
  ensureChapterRoad(r, sq, q, at);
  schedule(s, sq, r, at);
  applyDepartureConsumables(s, sq, r, at, event);
  return r;
}
export function nextEvent(r: Run) {
  return Math.min(
    ...r.actors.map((a) => a.nextAt),
    r.enemyAt,
    r.comboAt,
    r.road?.nextAt ?? Infinity,
  );
}
export const heroSkills: Record<string, { style: string; name: string; description: string }> = {
  lico: {
    style: "ranged",
    name: "発光試料の目くらまし",
    description: "薬液の光で敵の動きを鈍らせる。採取と調査も得意。",
  },
  finn: {
    style: "melee",
    name: "隙を突く一刺し",
    description: "短剣で素早く間合いに入り、4回ごとに隙を突く一撃。",
  },
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
  for (const id of sq.members)
    s.xp[id] = (s.xp[id] || 0) + consumableExperience(activeRun(sq), id, xp);
}
function awardFriendship(s: State, sq: Squad) {
  for (const bond of activeBonds(sq.members)) {
    const key = bondKey(bond.ids);
    s.friendship[key] = (s.friendship[key] || 0) + 1;
  }
}
export function reward(s: State, sq: Squad, q: Quest, at: number, finished: boolean) {
  const r = activeRun(sq),
    portions = r.nodes === questNodes(q.id) ? Math.ceil(r.nodes / 3) : 5,
    part = Math.floor(r.node / 3);
  const totalGold = q.gold,
    gold =
      portions === 5
        ? Math.floor(totalGold / 5)
        : Math.floor((totalGold * (part + 1)) / portions) -
          Math.floor((totalGold * part) / portions);
  // A single roadside herb arrives whole at the first reward; gathering keeps its existing yield.
  const herbs =
      (q.herbs === 1 ? Number(part === 0) : q.herbs / portions) * techniqueHerbs(s, sq.members),
    ore = q.ore / portions,
    xp = q.xp / portions;
  s.gold += gold;
  s.herbs += herbs;
  s.ore += ore;
  if (finished) finishQuest(s, sq, q);
  awardExperience(s, sq, xp);
  awardFriendship(s, sq);
  return { gold, xp, herbs, ore, at, finished };
}
function rewardRoadPortions(s: State, sq: Squad, q: Quest, at: number) {
  const r = activeRun(sq);
  const lastNode = r.road?.ambushNode ?? r.node;
  let gain: ReturnType<typeof reward> | null = null;
  // The work and its ambush consume the same original two portions, exactly once.
  while (r.node <= lastNode) {
    if ((r.node + 1) % 3 === 0 || r.node === r.nodes - 1)
      gain = reward(s, sq, q, at, r.node === r.nodes - 1);
    if (r.node === lastNode) break;
    r.node++;
    healAll(r, 0.15);
  }
  return gain;
}
export function completeNode(s: State, sq: Squad, q: Quest, at: number, afterScene = false) {
  const r = activeRun(sq);
  if (!afterScene && beginRoadExit(r, at)) return null;
  event(
    r,
    at,
    "clear",
    r.enemies?.some((enemy) => enemy.role === "puppeteer")
      ? "人形が止まり、少女は糸を引いて退いた"
      : targetName(q, r.node, r.nodes) + "をクリア！",
  );
  const gain = rewardRoadPortions(s, sq, q, at);
  const finished = r.node === r.nodes - 1;
  if (gain) event(r, at, "clear", "区間の報酬を確保！ +" + String(gain.gold) + " G");
  if (!finished) {
    r.node++;
    r.phase = "move";
    r.phaseAt = at;
    healAll(r, 0.15);
    configureTarget(r, q);
    schedule(s, sq, r, at);
    if (afterScene) startRoadScene(r, "enter", at);
    return gain;
  }
  sq.lastQuest ??= q.id;
  const canRepeat = !isPrologueQuest(q.id) || s.story?.read.includes(q.id + "-return");
  if (sq.repeat && q.availability !== "once" && canRepeat) {
    const { events, scene } = r;
    sq.run = makeRun(s, sq, q, at, r.round + 1);
    sq.run.events = [...events, ...sq.run.events].slice(-12);
    sq.run.scene = scene;
  } else sq.run = null;
  return gain;
}
function combinationLines(level: number, first: string, second: string, original: string[]) {
  if (level === 1) return original;
  if (level === 2) return [first + "「いつもの合図で、いくよ！」", second + "「息はぴったりだ！」"];
  return [first + "「この先も、一緒に！」", second + "「どんな冒険だって！」"];
}
export function combination(s: State, sq: Squad, at: number) {
  const r = activeRun(sq),
    bs = activeBonds(sq.members);
  r.comboAt = at + 14500;
  if (roadTransport(r) && !roadHasEnemies(r)) return;
  if (!bs.length) return;
  const b = bs[(r.node + r.round) % bs.length],
    lv = bondLevel(s, b.ids),
    q = questById(r.quest),
    k = roadActionKind(q, r),
    first = heroById(b.ids[0]).name,
    second = heroById(b.ids[1]).name;
  if (
    b.ids.some(
      (id) =>
        memberHealth(r, id).hp <= 0 ||
        paralyzed(
          r.actors.find((a) => a.hero === id),
          at,
        ),
    )
  )
    return;
  const lines = combinationLines(lv, first, second, b.lines);
  r.scene = {
    title: b.name + " · 連携 Lv." + String(lv),
    lines: together(b.ids) ? coupleCombo(s, r.node + r.round) : lines,
    at,
    kind: "combo",
  };
  const base =
      k === "battle" && r.enemies?.length ? 10 + lv * 4 : r.targetMax * (0.12 + 0.035 * lv),
    power = b.ids.reduce((sum, id) => sum + penetration(s, id), 0) / b.ids.length,
    hit = damageEnemy(r, base, power, resistanceFor(q, k));
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
export function recoverRun(s: State, sq: Squad, r: Run, q: Quest, at: number) {
  for (const health of Object.values(r.health)) health.hp = health.maxHp;
  configureTarget(r, q);
  r.phase = "move";
  r.phaseAt = at;
  schedule(s, sq, r, at);
  event(r, at, "heal", "みんなでひと休みして、もう一度。");
}

export function finishRoadScene(s: State, sq: Squad, q: Quest, at: number) {
  const r = activeRun(sq),
    kind = r.road?.scene?.kind;
  if (r.road) delete r.road.scene;
  if (kind !== "enter") return completeNode(s, sq, q, at, true);
  schedule(s, sq, r, at);
  return null;
}
