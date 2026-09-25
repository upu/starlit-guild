import { chapterThreeStages, LUNCH_INTERLUDE, BERNE_QUEST } from "./chapter-three.ts";
import { chapterFourStages, WALNUT_INTERLUDE, LINDE_REQUESTS_QUEST } from "./chapter-four.ts";
import type { State } from "./game.ts";
import { prologueStages, storyStages, stageUnlocked } from "./prologue.ts";
import { chapterTwoStages } from "./chapter-two.ts";
import { pendingInterlude } from "./interludes.ts";

export const questChapters = [
  { id: "one", label: "第一章" },
  { id: "two", label: "第二章" },
  { id: "three", label: "第三章" },
  { id: "four", label: "第四章" },
  { id: "other", label: "その他の依頼" },
] as const;
export type QuestChapter = (typeof questChapters)[number]["id"];
function chapterByStage(id: string) {
  if (prologueStages.some((stage) => stage.quest === id)) return "one";
  if (chapterTwoStages.some((stage) => stage.quest === id)) return "two";
  return null;
}
function chapterThreeContains(id: string) {
  return id === LUNCH_INTERLUDE || chapterThreeStages.some((stage) => stage.quest === id);
}
function chapterFourContains(id: string) {
  return id === WALNUT_INTERLUDE || chapterFourStages.some((stage) => stage.quest === id);
}
export function questChapter(id: string): QuestChapter {
  const early = chapterByStage(id);
  if (early) return early;
  if (chapterThreeContains(id)) return "three";
  if (chapterFourContains(id)) return "four";
  return "other";
}
function setInterludeDestination(s: State, interlude: string, next: string) {
  for (const sq of s.squads)
    if (!sq.run && (s.autoNextQuest || sq.lastQuest === interlude)) sq.lastQuest = next;
}
function nextDestination(s: State, index: number) {
  const interlude = pendingInterlude(s);
  if (interlude?.after === storyStages[index].quest) return interlude.id;
  const next = storyStages[index + 1]?.quest;
  return next && stageUnlocked(s, next) ? next : undefined;
}
function advanceInterludeDestination(s: State, storyId: string) {
  if (storyId === LUNCH_INTERLUDE && stageUnlocked(s, BERNE_QUEST)) {
    setInterludeDestination(s, LUNCH_INTERLUDE, BERNE_QUEST);
    return true;
  }
  if (storyId === WALNUT_INTERLUDE && stageUnlocked(s, LINDE_REQUESTS_QUEST)) {
    setInterludeDestination(s, WALNUT_INTERLUDE, LINDE_REQUESTS_QUEST);
    return true;
  }
  return false;
}
// Called only on the first reading of an ending, after the next stage unlocks.
export function advanceQuestDestination(s: State, storyId: string) {
  if (advanceInterludeDestination(s, storyId)) return;
  if (!s.autoNextQuest) return;
  const index = storyStages.findIndex((stage) => stage.quest + "-return" === storyId);
  if (index < 0) return;
  const current = storyStages[index].quest,
    next = nextDestination(s, index);
  if (!s.done[current] || !next || s.done[next]) return;
  for (const squad of s.squads) {
    if (!squad.run && squad.lastQuest === current) squad.lastQuest = next;
  }
}
