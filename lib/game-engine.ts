import { isChapterThreeQuest } from "./chapter-three.ts";
import { enemyText, groupEnemyTurns } from "./enemy-turns.ts";
import { damageEnemy, penetration } from "./combat.ts";
import {
  advanceChapterRoad,
  roadActorReady,
  roadActionKind,
  roadComplete,
  roadTransport,
} from "./chapter-road.ts";
import {
  TOWN_QUEST,
  TOWER_QUEST,
  NIGHT_QUEST,
  WETLAND_QUEST,
  WATERWAY_QUEST,
  RESTORATION_QUEST,
  MOSS_QUEST,
} from "./prologue.ts";
import {
  DELIVERY_PREP_QUEST,
  HOUSE_CALLS_QUEST,
  MEDICINE_RETURN_QUEST,
  MOON_HERB_QUEST,
  SIGNPOST_QUEST,
} from "./chapter-two.ts";
import {
  equippedTechnique,
  techniqueHealing,
  techniqueMultiplier,
  techniqueText,
} from "./techniques.ts";
import { level } from "./roster.ts";
import { continueAutoNext } from "./game-actions.ts";
import type { Quest } from "./game-content.ts";
import type { Actor, Encounter, GameEvent, Run, Squad, State } from "./game-types.ts";
import {
  activeBonds,
  activeRun,
  encounter,
  healMember,
  heroById,
  lowestHealth,
  memberHealth,
  memberStats,
  questById,
  resistanceFor,
  specialInterval,
  specialMultiplier,
  squadName,
  statIndex,
  stats,
  targetName,
  totalMaxHp,
} from "./game-rules.ts";
import {
  addLog,
  combination,
  completeNode,
  finishRoadScene,
  event,
  heroSkills,
  nextEvent,
  recoverRun,
  reward,
} from "./game-run.ts";

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
  if (isChapterThreeQuest(q.id) && kind !== "battle") return "gather";
  if (quietStageWork(q, kind)) return "gather";
  if (special) return "skill";
  return kind === "battle" ? "hit" : "gather";
}
function stageWorkText(q: Quest, kind: Encounter, special: boolean) {
  if (kind === "battle") return null;
  if (isChapterThreeQuest(q.id)) return "声を掛け合って作業を進める";
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
  const heal = techniqueHealing(s, hero, 5 + level(s.xp[hero] || 0)),
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
  if (!roadActorReady(q, r, actor.hero)) {
    actor.nextAt += 100;
    return;
  }
  kind = roadActionKind(q, r, actor.hero);
  const hero = actor.hero,
    member = memberStats(s, hero),
    bond = activeBonds(sq.members).reduce((value, item) => value + item.bonus, 0);
  actor.actions++;
  const special = actor.actions % specialInterval(hero) === 0,
    multiplier = techniqueMultiplier(s, hero, kind, special, specialMultiplier(hero));
  if (roadTransport(r) && kind !== "battle") {
    actor.nextAt += actor.period;
    healFromActor(s, sq, r, hero, special, at);
    return;
  }
  const hit = damageEnemy(
    r,
    (2 + member[statIndex(kind)] * 0.23 + bond * 0.1) * multiplier,
    penetration(s, hero),
    resistanceFor(q, kind),
    hero,
    !!r.road && kind !== "battle",
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
    if (roadComplete(r)) return { completed: true, gain: completeNode(s, sq, q, at) };
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
  if (r.road?.scene) return finishRoadScene(s, sq, q, at);
  if (r.phase === "rest") {
    recoverRun(s, sq, r, q, at);
    return null;
  }
  const kind = encounter(q, r.node);
  advanceChapterRoad(q, r, at);
  if (roadComplete(r)) return completeNode(s, sq, q, at);
  if (r.comboAt === at) {
    combination(s, sq, at);
    if (roadComplete(r)) return completeNode(s, sq, q, at);
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
function settleSquad(s: State, sq: Squad, end: number) {
  let count = 0;
  while (sq.run && sq.run.nextAt <= end) {
    const quest = sq.run.quest,
      gain = step(s, sq);
    if (!gain?.finished) continue;
    count++;
    continueAutoNext(s, sq, quest, gain.at);
  }
  if (count)
    addLog(s, `${squadName(sq)}が ${String(count)} 件の依頼を達成。報酬を受け取りました。`, end);
}
function shiftRun(r: Run, shift: number) {
  if (r.road) {
    if (r.road.scene) r.road.scene.at += shift;
    r.road.at += shift;
    r.road.previousAt += shift;
    r.road.nextAt += shift;
  }
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
// Simulates every party up to `now`, however long that is.
export function settle(input: State, now: number) {
  const s = structuredClone(input),
    end = Math.max(now, s.updatedAt);
  for (const sq of s.squads) settleSquad(s, sq, end);
  s.updatedAt = end;
  return s;
}
// Moves every clock forward to `now` without playing: time the game was not on screen.
// Each party resumes exactly where it stopped.
export function skipTo(input: State, now: number) {
  const s = structuredClone(input),
    skipped = now - s.updatedAt;
  if (skipped <= 0) return s;
  for (const sq of s.squads) {
    if (sq.run) shiftRun(sq.run, skipped);
  }
  s.updatedAt = now;
  return s;
}
// On screen the game ticks every 200ms. A longer gap means it was not on screen even though no
// resume was noticed (e.g. a device that slept with the page visible), so it is skipped whole.
export const ON_SCREEN_LIMIT = 5000;
export function settleOnScreen(input: State, now: number) {
  return now - input.updatedAt > ON_SCREEN_LIMIT ? skipTo(input, now) : settle(input, now);
}
