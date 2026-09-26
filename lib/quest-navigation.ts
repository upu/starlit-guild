import { chapterThreeStages, LUNCH_INTERLUDE, BERNE_QUEST } from "./chapter-three.ts";
import type { Squad, State } from "./game.ts";
import { prologueStages, storyStages, stageUnlocked } from "./prologue.ts";
import { chapterTwoStages } from "./chapter-two.ts";
import { pendingInterlude } from "./interludes.ts";

export const questChapters = [
  { id: "one", label: "第一章" },
  { id: "two", label: "第二章" },
  { id: "three", label: "第三章" },
  { id: "other", label: "その他の依頼" },
] as const;
export type QuestChapter = (typeof questChapters)[number]["id"];
export function questChapter(id: string): QuestChapter {
  if (prologueStages.some((stage) => stage.quest === id)) return "one";
  if (id === LUNCH_INTERLUDE || chapterThreeStages.some((stage) => stage.quest === id))
    return "three";
  return chapterTwoStages.some((stage) => stage.quest === id) ? "two" : "other";
}
function setInterludeDestination(s: State) {
  const moved = s.squads.filter(
    (sq) => !sq.run && (s.autoNextQuest || sq.lastQuest === LUNCH_INTERLUDE),
  );
  for (const sq of moved) sq.lastQuest = BERNE_QUEST;
  return moved;
}
function nextDestination(s: State, index: number) {
  const interlude = pendingInterlude(s);
  if (interlude?.after === storyStages[index].quest) return interlude.id;
  const next = storyStages[index + 1]?.quest;
  return next && stageUnlocked(s, next) ? next : undefined;
}
// Called only on the first reading of an ending, after the next stage unlocks.
// Returns the parties whose destination moved, so Auto-Next can send them off.
export function advanceQuestDestination(s: State, storyId: string): Squad[] {
  if (storyId === LUNCH_INTERLUDE && stageUnlocked(s, BERNE_QUEST))
    return setInterludeDestination(s);
  if (!s.autoNextQuest) return [];
  const index = storyStages.findIndex((stage) => stage.quest + "-return" === storyId);
  if (index < 0) return [];
  const current = storyStages[index].quest,
    next = nextDestination(s, index);
  if (!s.done[current] || !next) return [];
  const moved = s.squads.filter((squad) => !squad.run && squad.lastQuest === current);
  for (const squad of moved) squad.lastQuest = next;
  return moved;
}
// Auto-Next: finishing a stage whose ending was already read moves on in story order,
// whether the following stage is cleared or not.
export function replayQuestDestination(s: State, sq: Squad, quest: string) {
  if (!s.autoNextQuest || sq.run || !s.story?.read.includes(quest + "-return")) return false;
  const index = storyStages.findIndex((stage) => stage.quest === quest),
    next = index < 0 ? undefined : nextDestination(s, index);
  if (!next) return false;
  sq.lastQuest = next;
  return true;
}
