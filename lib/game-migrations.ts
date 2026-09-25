import { BERNE_QUEST, LUNCH_INTERLUDE, isChapterThreeQuest } from "./chapter-three.ts";
import { DELIVERY_PREP_QUEST, PICNIC_QUEST } from "./chapter-two.ts";
import { nextStage, storyStages } from "./prologue.ts";
import { storyProgress } from "./stories.ts";
import type { LegacySharedHealthState, LegacySharedRun, Run, State } from "./game-types.ts";
import { initialPrologueState, memberMaxHp, questById } from "./game-rules.ts";
import { nextEvent } from "./game-run.ts";
import { joinStoryMira, joinStoryFinn } from "./game-actions.ts";
import { grantMiraEquipment } from "./equipment.ts";

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
  let s = upgradePendingDetour(upgradePicnicRun(upgradeSharedHealth(raw)));
  if (s.owned.includes("mira") && !s.inventory?.items["familiar-staff"]) {
    s = structuredClone(s);
    grantMiraEquipment(s);
  }
  return s;
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
    if (isChapterThreeQuest(quest)) addOnce(story.read, LUNCH_INTERLUDE);
    if (quest === BERNE_QUEST) joinStoryFinn(s);
  }
}
// Test records follow the story stages.
export function testState(now: number, stages: number, lv: number, gold: number): State {
  const s = initialPrologueState(now);
  const count = Math.min(storyStages.length, Math.max(0, Math.floor(stages)));
  completeStoryStages(s, count);
  s.clears = count;
  s.gold = Math.min(10000000, Math.max(0, Math.floor(gold)));
  // Carry the materials those stages actually reward.
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
