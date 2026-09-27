import { storyParty } from "./story-party.ts";
import { isInterlude, interludeUnlocked } from "./interludes.ts";
import { isChapterThreeQuest, BERNE_QUEST } from "./chapter-three.ts";
import { MERRILL_SEEDLINGS_QUEST, MOSS_TRAIL_QUEST, isChapterFourQuest } from "./chapter-four.ts";
import { advanceQuestDestination, replayQuestDestination } from "./quest-navigation.ts";
import {
  buyEquipment,
  changeEquipment,
  grantMiraEquipment,
  grantFinnEquipment,
  type EquipmentSlot,
} from "./equipment.ts";
import { damageEnemy, penetration } from "./combat.ts";
import { isPrologueQuest, stageEndingPending, stageUnlocked } from "./prologue.ts";
import { DELIVERY_PREP_QUEST } from "./chapter-two.ts";
import { learnTechnique, setTechnique, type TechniqueSlot } from "./techniques.ts";
import { availableStories, departureStory, storyProgress, together } from "./stories.ts";
import { allQuests, type Quest } from "./game-content.ts";
import type { Run, Squad, State } from "./game-types.ts";
import { roadComplete, roadActionKind } from "./chapter-road.ts";
import {
  encounter,
  healMember,
  heroById,
  lowestHealth,
  memberHealth,
  memberMaxHp,
  questById,
  resistanceFor,
  squadName,
  statIndex,
  stats,
} from "./game-rules.ts";
import { addLog, completeNode, configureTarget, event, makeRun, schedule } from "./game-run.ts";

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
  return !isPrologueQuest(q.id) || !stageUnlocked(s, q.id);
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
  if (q.id === MOSS_TRAIL_QUEST) s.story.mossTrailSplit = true;
  if (together(sq.members) && !s.story.departed.includes(q.id)) s.story.departed.push(q.id);
}
function readDepartureStory(s: State, q: Quest) {
  const story = availableStories(s).find(
    (item) => item.quest === q.id && item.chapter === "departure",
  );
  if (story && !s.story?.read.includes(story.id)) s.story?.read.push(story.id);
}
function prepareChapterFourParty(s: State, q: Quest) {
  if (isChapterThreeQuest(q.id) || isChapterFourQuest(q.id)) joinStoryFinn(s);
  if (
    q.id === MERRILL_SEEDLINGS_QUEST ||
    (isChapterFourQuest(q.id) && s.done[MERRILL_SEEDLINGS_QUEST])
  )
    joinStoryLico(s);
}
function startAction(s: State, sq: Squad, a: Action, now: number) {
  if (a.id && isInterlude(a.id)) {
    if (sq.run || !interludeUnlocked(s, a.id) || s.story?.read.includes(a.id))
      throw Error("この幕間には、今は出発できません。");
    if (!a.readDeparture) throw Error("幕間の会話を読み終えましょう。");
    sq.lastQuest = a.id;
    readStoryAction(s, sq, a, now);
    return;
  }
  const q = startQuest(s, sq, a);
  prepareChapterFourParty(s, q);
  sq.members = storyParty(q.id);
  recordDeparture(s, sq, q);
  if (typeof a.value === "boolean") sq.repeat = a.value;
  sq.run = makeRun(s, sq, q, now);
  sq.lastQuest = q.id;
  if (a.readDeparture) readDepartureStory(s, q);
  addLog(s, `${squadName(sq)}が「${q.name}」に出発。`, now);
}
function readStoryAction(s: State, _sq: Squad, a: Action, now: number) {
  const id = a.id;
  if (!id || !availableStories(s).some((story) => story.id === id))
    throw Error("この思い出は、まだ開かれていません。");
  if (id === DELIVERY_PREP_QUEST + "-return" && s.squads.some((p) => p.run?.quest === "join-mira"))
    throw Error("ミラとの専用クエストから帰還してから、この物語を読み終えましょう。");
  s.story ??= storyProgress(s);
  if (s.story.read.includes(id)) return;
  s.story.read.push(id);
  if (id === DELIVERY_PREP_QUEST + "-return") joinStoryMira(s);
  for (const squad of advanceQuestDestination(s, id)) departNextStage(s, squad, now);
}
function autoDepartable(s: State, sq: Squad, id: string) {
  return (
    !sq.run &&
    sq.members.length > 0 &&
    isPrologueQuest(id) &&
    stageUnlocked(s, id) &&
    !stageEndingPending(s) &&
    !departureStory(s, sq, id)
  );
}
// Auto-Next departs at once, except into an unseen departure conversation the screen shows first.
function departNextStage(s: State, sq: Squad, now: number) {
  const id = sq.lastQuest;
  if (!s.autoNextQuest || !id || !autoDepartable(s, sq, id)) return;
  startAction(s, sq, { type: "start", id, value: false }, now);
}
// Called when a party finishes a quest; a replayed stage leads on to the one after it.
export function continueAutoNext(s: State, sq: Squad, quest: string, now: number) {
  if (replayQuestDestination(s, sq, quest)) departNextStage(s, sq, now);
}
export function joinStoryMira(s: State) {
  if (!s.owned.includes("mira")) {
    s.owned.push("mira");
    if (!Object.hasOwn(s.xp, "mira")) s.xp.mira = Math.min(s.xp.aria || 0, s.xp.leon || 0);
  }
  const party = s.squads.find((p) => p.lastQuest === DELIVERY_PREP_QUEST) || s.squads[0];
  grantMiraEquipment(s);
  if (!party.run && !party.members.includes("mira")) party.members.push("mira");
}
export function joinStoryFinn(s: State) {
  if (!s.owned.includes("finn")) {
    s.owned.push("finn");
    s.xp.finn = Math.min(s.xp.aria || 0, s.xp.leon || 0, s.xp.mira || 0);
  }
  grantFinnEquipment(s);
  const party = s.squads.find((p) => p.lastQuest === BERNE_QUEST) || s.squads[0];
  if (!party.run && !party.members.includes("finn")) party.members.push("finn");
}
export function joinStoryLico(s: State) {
  if (!s.owned.includes("lico")) {
    s.owned.push("lico");
    s.xp.lico = Math.min(...["aria", "leon", "mira", "finn"].map((id) => s.xp[id] || 0));
  }
  const party = s.squads[0];
  if (!party.run && !party.members.includes("lico")) party.members.push("lico");
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
    index = statIndex(roadActionKind(q, r)),
    members = sq.members.filter((id) => memberHealth(r, id).hp > 0),
    power = members.reduce((sum, id) => sum + penetration(s, id), 0) / Math.max(1, members.length),
    hit = damageEnemy(
      r,
      Math.max(2, Math.round(2 + stats(s, sq)[index] * 0.035)),
      power,
      resistanceFor(q, encounter(q, r.node, r.nodes)),
      undefined,
      !!r.road && roadActionKind(q, r) !== "battle",
    );
  event(r, now, "assist", "手助け！", hit.amount, undefined, undefined, hit.enemy);
}
function finishAssist(s: State, sq: Squad, r: Run, now: number) {
  if (!roadComplete(r)) return;
  const gain = completeNode(s, sq, questById(r.quest), now);
  if (gain) addLog(s, squadName(sq) + "が区間の報酬を確保！ +" + String(gain.gold) + " G", now);
  if (gain?.finished) continueAutoNext(s, sq, r.quest, now);
}
function assistAction(s: State, sq: Squad, a: Action, now: number) {
  const r = sq.run;
  if (!r) throw Error("冒険中に応援できます。");
  if (r.road?.scene) return;
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
