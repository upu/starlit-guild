import { migrate as migrateV2, settle as settleV2, type State as V2State } from "./game-v2.ts";
import {
  heroes as baseHeroes,
  quests as baseQuests,
  bonds,
  level,
  type State as LegacyState,
} from "./game-v1.ts";
export { bonds, level };
export type Kind = "採取" | "護衛" | "討伐";
export const heroes = baseHeroes.map((h, i) => ({
  ...h,
  sprite: i,
  unlock: [0, 0, 3, 8, 16, 24, 35, 50][i],
  price: [0, 0, 100, 220, 450, 700, 950, 1300][i],
}));
export const quests = baseQuests.map((q, i) => ({
  ...q,
  unlock: [0, 2, 4, 10, 15, 20, 35, 45, 60][i],
  enemy: i === 8 ? 10 : i >= 3 ? 9 : 8,
}));
export type Quest = (typeof quests)[number];
export type Encounter = "battle" | "gather" | "escort";
export type GameEvent = {
  id: string;
  at: number;
  kind: "hit" | "gather" | "hurt" | "heal" | "clear" | "move" | "rest" | "assist";
  text: string;
  amount?: number;
  hero?: string;
};
export type Actor = { hero: string; arrivesAt: number; nextAt: number; period: number };
export type Run = {
  actors: Actor[];
  enemyAt: number;
  quest: string;
  round: number;
  node: number;
  phase: "move" | "work" | "rest";
  phaseAt: number;
  nextAt: number;
  started: number;
  hp: number;
  maxHp: number;
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
  members: string[];
  repeat: boolean;
  run: Run | null;
};
export type State = {
  version: 3;
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
export type Rewards = {
  count: number;
  gold: number;
  xp: number;
  herbs: number;
  ore: number;
  offline: boolean;
  capped: boolean;
};
function heroById(id: string) {
  const hero = heroes.find((h) => h.id === id);
  if (!hero) throw Error(`仲間「${id}」が見つかりません。`);
  return hero;
}
function questById(id: string) {
  const quest = quests.find((q) => q.id === id);
  if (!quest) throw Error(`依頼「${id}」が見つかりません。`);
  return quest;
}
function activeRun(sq: Squad) {
  if (!sq.run) throw Error(`隊「${sq.id}」は冒険中ではありません。`);
  return sq.run;
}
export function initialState(now: number): State {
  return {
    version: 3,
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
      { id: "party-1", name: "はじまりの隊", members: ["aria", "leon"], repeat: true, run: null },
    ],
    log: [{ at: now, text: "アリアとレオン、ふたりの旅が始まった。" }],
    receipts: [],
  };
}
export const activeBonds = (members: string[]) =>
  bonds.filter((b) => b.ids.every((id) => members.includes(id)));
export function memberStats(s: State, id: string) {
  const h = heroById(id);
  return h.stats.map((v) =>
    Math.round(v * (1 + 0.1 * (level(s.xp[id] || 0) - 1)) * (1 + 0.08 * s.gear)),
  );
}
export function stats(s: State, sq: Squad) {
  return [0, 1, 2].map(
    (i) =>
      sq.members.reduce((v, id) => v + memberStats(s, id)[i], 0) +
      activeBonds(sq.members).reduce((v, b) => v + b.bonus, 0),
  );
}
export const power = (s: State, sq: Squad, q: Quest) =>
  stats(s, sq)[["採取", "護衛", "討伐"].indexOf(q.kind)];
export const memberLimit = (s: State) => (s.clears >= 10 ? 3 : 2);
export const squadLimit = (s: State) => (s.owned.length >= 6 ? 3 : s.owned.length >= 4 ? 2 : 1);
export function encounter(q: Quest, node: number): Encounter {
  return q.kind === "採取"
    ? node === 1
      ? "battle"
      : "gather"
    : q.kind === "護衛"
      ? node === 1
        ? "escort"
        : "battle"
      : "battle";
}
function gatherTarget(q: Quest) {
  if (q.id === "crystal") return "青晶石";
  if (q.id === "blossom") return "千年樹の花";
  return "月しずく草";
}
function enemyTarget(q: Quest) {
  if (q.enemy === 10) return "星喰い竜";
  if (q.enemy === 9) return "霧狼";
  return "スライム";
}
export function targetName(q: Quest, node: number) {
  const kind = encounter(q, node);
  if (kind === "gather") return gatherTarget(q);
  if (kind === "escort") return "旅人を目的地へ";
  return enemyTarget(q);
}
export const stepMs = (s: State) => Math.round(1050 * (1 - 0.035 * s.camp));
export function estimate(s: State, sq: Squad, q: Quest) {
  const relevant = Math.max(5, power(s, sq, q));
  return Math.round(
    12 +
      (((q.need * 6.9) / Math.max(3, 2 + (relevant / Math.max(1, sq.members.length)) * 0.23)) *
        stepMs(s)) /
        1000 /
        Math.max(1, sq.members.length),
  );
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
) {
  r.events = [
    ...r.events,
    {
      id: `${String(r.round)}-${String(r.node)}-${String(at)}-${kind}-${String(r.hits)}-${hero || "leader"}`,
      at,
      kind,
      text,
      amount,
      hero,
    },
  ].slice(-12);
}
function configureTarget(r: Run, q: Quest) {
  r.targetMax = Math.round(q.need * (encounter(q, r.node) === "escort" ? 1.8 : 2.3));
  r.target = r.targetMax;
  r.hits = 0;
}
export function travelMs(id: string) {
  return 2200 + (heroes.findIndex((h) => h.id === id) % 4) * 310;
}
function schedule(s: State, sq: Squad, r: Run, at: number) {
  r.actors = sq.members.map((hero) => ({
    hero,
    arrivesAt: at + travelMs(hero),
    nextAt: at + travelMs(hero),
    period: Math.round(stepMs(s) * (0.8 + (heroes.findIndex((h) => h.id === hero) % 4) * 0.13)),
  }));
  r.enemyAt = at + 3700;
  r.nextAt = Math.min(...r.actors.map((a) => a.nextAt), r.enemyAt);
}
function makeRun(s: State, sq: Squad, q: Quest, at: number, round = 1): Run {
  const maxHp = 80 + stats(s, sq)[1] * 2;
  const r: Run = {
    actors: [],
    enemyAt: at + 3700,
    quest: q.id,
    round,
    node: 0,
    phase: "move",
    phaseAt: at,
    nextAt: at + 2200,
    started: at,
    hp: maxHp,
    maxHp,
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
function reward(s: State, sq: Squad, q: Quest, at: number) {
  const gold = Math.floor(
    q.gold * (sq.members.includes("finn") ? 1.1 : 1) * (sq.members.includes("noel") ? 1.1 : 1),
  );
  s.gold += gold;
  s.herbs += q.herbs;
  s.ore += q.ore;
  s.clears++;
  s.done[q.id] = (s.done[q.id] || 0) + 1;
  for (const id of sq.members) s.xp[id] = (s.xp[id] || 0) + q.xp;
  return { gold, xp: q.xp, herbs: q.herbs, ore: q.ore, at };
}
function completeNode(s: State, sq: Squad, q: Quest, at: number) {
  const r = activeRun(sq);
  event(r, at, "clear", `${targetName(q, r.node)}をクリア！`);
  if (r.node < 2) {
    r.node++;
    r.phase = "move";
    r.phaseAt = at;
    r.nextAt = at + 4000;
    r.hp = Math.min(r.maxHp, r.hp + r.maxHp * 0.15);
    configureTarget(r, q);
    schedule(s, sq, r, at);
    return null;
  }
  const gain = reward(s, sq, q, at);
  if (sq.repeat) {
    const events = r.events;
    sq.run = makeRun(s, sq, q, at, r.round + 1);
    sq.run.events = events;
  } else sq.run = null;
  return gain;
}
function recoverRun(s: State, sq: Squad, r: Run, q: Quest, at: number) {
  r.hp = r.maxHp;
  configureTarget(r, q);
  r.phase = "move";
  r.phaseAt = at;
  schedule(s, sq, r, at);
  event(r, at, "heal", "ひと休みして、もう一度。");
}
function statIndex(kind: Encounter) {
  return kind === "battle" ? 2 : kind === "gather" ? 0 : 1;
}
function actorTurn(s: State, sq: Squad, r: Run, kind: Encounter, actor: Actor, at: number) {
  const hero = actor.hero,
    member = memberStats(s, hero),
    bond = activeBonds(sq.members).reduce((value, item) => value + item.bonus, 0),
    damage = Math.max(1, Math.round(2 + member[statIndex(kind)] * 0.23 + bond * 0.1));
  r.target = Math.max(0, r.target - damage);
  r.hits++;
  actor.nextAt += actor.period;
  event(
    r,
    at,
    kind === "battle" ? "hit" : "gather",
    heroById(hero).name + (kind === "battle" ? "の攻撃" : "が作業中"),
    damage,
    hero,
  );
  if (hero === "mira" && r.hp < r.maxHp) {
    const heal = 5 + level(s.xp.mira || 0);
    r.hp = Math.min(r.maxHp, r.hp + heal);
    event(r, at, "heal", "ミラの癒やし", heal, hero);
  }
  return r.target <= 0;
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
    if (actorTurn(s, sq, r, kind, actor, at))
      return { completed: true, gain: completeNode(s, sq, q, at) };
  }
  return { completed: false, gain: null };
}
function enemyTurn(s: State, sq: Squad, r: Run, q: Quest, kind: Encounter, at: number) {
  if (r.enemyAt !== at) return;
  r.enemyAt += 1450;
  if (kind !== "battle") return;
  const hurt = Math.max(1, Math.round(q.need * 0.24 - stats(s, sq)[1] * 0.05));
  r.hp = Math.max(0, r.hp - hurt);
  event(r, at, "hurt", "魔物の攻撃", hurt);
}
function finishStep(r: Run, at: number) {
  if (r.hp > 0) {
    r.nextAt = Math.min(...r.actors.map((actor) => actor.nextAt), r.enemyAt);
    return;
  }
  r.phase = "rest";
  r.phaseAt = at;
  r.nextAt = at + 15000;
  event(r, at, "rest", "いったん退いて回復中。応援で立て直そう。");
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
  if (r.phase === "move") {
    r.phase = "work";
    event(r, at, "move", targetName(q, r.node) + "を発見！");
  }
  const actors = runActorTurns(s, sq, r, q, kind, at);
  if (actors.completed) return actors.gain;
  enemyTurn(s, sq, r, q, kind, at);
  finishStep(r, at);
  return null;
}
function collectReward(rewards: Rewards, gain: ReturnType<typeof reward> | null) {
  if (!gain) return false;
  rewards.count++;
  rewards.gold += gain.gold;
  rewards.xp += gain.xp;
  rewards.herbs += gain.herbs;
  rewards.ore += gain.ore;
  return true;
}
function shiftRun(r: Run, shift: number) {
  r.nextAt += shift;
  r.phaseAt += shift;
  r.started += shift;
  r.energyAt += shift;
  r.enemyAt += shift;
  for (const actor of r.actors) {
    actor.nextAt += shift;
    actor.arrivesAt += shift;
  }
  r.events = [];
}
function settleSquad(s: State, sq: Squad, end: number, elapsed: number, rewards: Rewards) {
  let count = 0;
  while (sq.run && sq.run.nextAt <= end) {
    if (collectReward(rewards, step(s, sq))) count++;
  }
  if (count) addLog(s, `${sq.name}が ${String(count)} 件の依頼を達成。報酬を受け取りました。`, end);
  if (sq.run && rewards.capped) shiftRun(sq.run, elapsed - 43200000);
}
export function settle(input: State, now: number) {
  const s = structuredClone(input),
    elapsed = Math.max(0, now - s.updatedAt),
    end = s.updatedAt + Math.min(elapsed, 43200000),
    rewards: Rewards = {
      count: 0,
      gold: 0,
      xp: 0,
      herbs: 0,
      ore: 0,
      offline: elapsed > 90000,
      capped: elapsed > 43200000,
    };
  for (const sq of s.squads) settleSquad(s, sq, end, elapsed, rewards);
  s.updatedAt = Math.max(now, s.updatedAt);
  return { state: s, rewards };
}
export function migrate(raw: State | V2State | LegacyState, now: number): State {
  if (raw.version === 3) return raw;
  const old = settleV2(migrateV2(raw, now), now).state;
  const s: State = { ...old, version: 3, squads: old.squads.map((sq) => ({ ...sq, run: null })) };
  for (let i = 0; i < old.squads.length; i++) {
    const run = old.squads[i].run;
    if (run) {
      const q = questById(run.quest);
      s.squads[i].run = makeRun(s, s.squads[i], q, now, run.round);
    }
  }
  addLog(s, "これまでの記録を引き継ぎました。", now);
  return s;
}
export function testState(now: number, clears: number, lv: number, gold: number): State {
  const s = initialState(now);
  s.clears = Math.min(1000, Math.max(0, Math.floor(clears)));
  s.gold = Math.min(10000000, Math.max(0, Math.floor(gold)));
  s.herbs = s.ore = s.clears * 15;
  s.owned = heroes.filter((h) => h.unlock <= s.clears).map((h) => h.id);
  for (const id of s.owned) s.xp[id] = 30 * (Math.min(50, Math.max(1, Math.floor(lv))) - 1) ** 2;
  s.log = [{ at: now, text: "テスト用の冒険。普段の記録には影響しません。" }];
  return s;
}
export type Action = {
  type:
    | "start"
    | "stop"
    | "party"
    | "recruit"
    | "gear"
    | "camp"
    | "daily"
    | "repeat"
    | "assist"
    | "newSquad"
    | "sync";
  squad?: string;
  id?: string;
  members?: string[];
  value?: boolean;
  mode?: "strike" | "heal";
};
type ActionHandler = (s: State, sq: Squad, a: Action, now: number) => void;
function syncAction() {
  /* Cloning the current state completes synchronization. */
}
function startAction(s: State, sq: Squad, a: Action, now: number) {
  if (sq.run) throw Error("この隊は冒険中です。");
  const q = quests.find((item) => item.id === a.id);
  if (!q || s.clears < q.unlock) throw Error("この依頼はまだ見つかっていません。");
  if (sq.members.length < 1) throw Error("仲間を1人以上編成してください。");
  sq.run = makeRun(s, sq, q, now);
  addLog(s, `${sq.name}が「${q.name}」に出発。`, now);
}
function stopAction(s: State, sq: Squad, _a: Action, now: number) {
  sq.run = null;
  addLog(s, `${sq.name}が帰還。達成済みの報酬は持ち帰りました。`, now);
}
function validParty(s: State, sq: Squad, ids: unknown): ids is string[] {
  return (
    Array.isArray(ids) &&
    ids.length >= 1 &&
    ids.length <= Math.max(memberLimit(s), sq.members.length) &&
    new Set(ids).size === ids.length &&
    ids.every((id) => typeof id === "string" && s.owned.includes(id))
  );
}
function partyAction(s: State, sq: Squad, a: Action) {
  if (sq.run) throw Error("帰還してから編成を変更できます。");
  const ids = a.members;
  if (!validParty(s, sq, ids)) throw Error("編成する仲間を確認してください。");
  if (s.squads.some((p) => p.id !== sq.id && p.members.some((id) => ids.includes(id))))
    throw Error("他の隊の仲間は、その隊の編成から外してください。");
  sq.members = ids;
}
function repeatAction(_s: State, sq: Squad, a: Action) {
  if (typeof a.value !== "boolean") throw Error("設定を確認してください。");
  sq.repeat = a.value;
}
function newSquadAction(s: State) {
  if (s.squads.length >= squadLimit(s)) throw Error("仲間が4人で2隊、6人で3隊を編成できます。");
  const id = s.owned.find((hero) => s.squads.every((p) => !p.members.includes(hero)));
  if (!id) throw Error("待機中の仲間を1人用意してください。");
  const n = s.squads.length + 1;
  s.squads.push({
    id: `party-${String(n)}`,
    name: n === 2 ? "木漏れ日の隊" : "星渡りの隊",
    members: [id],
    repeat: true,
    run: null,
  });
}
function healAssist(s: State, sq: Squad, r: Run, now: number) {
  const heal = Math.max(3, Math.ceil(r.maxHp * 0.025));
  r.hp = Math.min(r.maxHp, r.hp + heal);
  if (r.phase === "rest") {
    r.phase = "move";
    r.phaseAt = now;
    configureTarget(r, questById(r.quest));
    schedule(s, sq, r, now);
  }
  event(r, now, "heal", "団長の応援で回復！", heal);
}
function strikeAssist(s: State, sq: Squad, r: Run, now: number) {
  if (r.phase === "rest") throw Error("回復で立て直しましょう。");
  const q = questById(r.quest),
    index = q.kind === "採取" ? 0 : q.kind === "護衛" ? 1 : 2,
    hit = Math.max(2, Math.round(2 + s.gear + stats(s, sq)[index] * 0.035));
  r.target = Math.max(0, r.target - hit);
  event(r, now, "assist", "団長の手助け！", hit);
  if (r.target > 0) return;
  const gain = completeNode(s, sq, q, now);
  if (gain) addLog(s, sq.name + "が「" + q.name + "」を達成！ +" + String(gain.gold) + " G", now);
}
function assistAction(s: State, sq: Squad, a: Action, now: number) {
  const r = sq.run;
  if (!r) throw Error("冒険中に応援できます。");
  r.hits++;
  if (a.mode === "heal") healAssist(s, sq, r, now);
  else strikeAssist(s, sq, r, now);
}
function recruitAction(s: State, _sq: Squad, a: Action, now: number) {
  const hero = heroes.find((item) => item.id === a.id);
  if (!hero || s.owned.includes(hero.id) || s.clears < hero.unlock || s.gold < hero.price)
    throw Error("加入条件かお金を確認してください。");
  s.gold -= hero.price;
  s.owned.push(hero.id);
  addLog(s, `${hero.name}が仲間になりました。`, now);
}
function gearAction(s: State) {
  const cost = 100 * (s.gear + 1),
    ore = 5 * (s.gear + 1);
  if (s.clears < 3 || s.gear >= 15 || s.gold < cost || s.ore < ore)
    throw Error("お金か鉱石が足りません。");
  s.gold -= cost;
  s.ore -= ore;
  s.gear++;
}
function campAction(s: State) {
  const cost = 150 * (s.camp + 1),
    herbs = 12 * (s.camp + 1);
  if (s.clears < 10 || s.camp >= 10 || s.gold < cost || s.herbs < herbs)
    throw Error("お金か薬草が足りません。");
  s.gold -= cost;
  s.herbs -= herbs;
  s.camp++;
}
function dailyAction(s: State, _sq: Squad, _a: Action, now: number) {
  const day = new Date(now).toISOString().slice(0, 10);
  if (s.clears < 3 || s.lastDaily === day) throw Error("今日の差し入れは受取済みです。");
  s.lastDaily = day;
  s.gold += 80;
  s.herbs += 5;
}
const actionHandlers: Record<Action["type"], ActionHandler> = {
  sync: syncAction,
  start: startAction,
  stop: stopAction,
  party: partyAction,
  repeat: repeatAction,
  newSquad: newSquadAction,
  assist: assistAction,
  recruit: recruitAction,
  gear: gearAction,
  camp: campAction,
  daily: dailyAction,
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
