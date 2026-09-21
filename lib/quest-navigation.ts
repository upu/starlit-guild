import { chapterThreeStages, LUNCH_INTERLUDE, BERNE_QUEST } from "./chapter-three.ts";
import type { State } from "./game.ts";
import { prologueStages, storyStages, stageUnlocked } from "./prologue.ts";
import { chapterTwoStages } from "./chapter-two.ts";

export const questChapters = [
  { id: "one", label: "第一章" },
  { id: "two", label: "第二章" },
  { id: "three", label: "第三章" },
  { id: "other", label: "その他の依頼" },
] as const;
export type QuestChapter = (typeof questChapters)[number]["id"];
export function questChapter(id: string): QuestChapter {
  if (prologueStages.some((stage) => stage.quest === id)) return "one";
  if (chapterThreeStages.some((stage) => stage.quest === id)) return "three";
  return chapterTwoStages.some((stage) => stage.quest === id) ? "two" : "other";
}
function setInterludeDestination(s: State) {
  for (const sq of s.squads) if (!sq.run) sq.lastQuest = BERNE_QUEST;
}
// Called only on the first reading of an ending, after the next stage unlocks.
export function advanceQuestDestination(s: State, storyId: string) {
  if (!s.autoNextQuest) return;
  if (storyId === LUNCH_INTERLUDE && stageUnlocked(s, BERNE_QUEST)) {
    setInterludeDestination(s);
    return;
  }
  const index = storyStages.findIndex((stage) => stage.quest + "-return" === storyId);
  if (index < 0) return;
  const current = storyStages[index].quest,
    next = storyStages[index + 1]?.quest;
  if (!s.done[current] || !next || s.done[next] || !stageUnlocked(s, next)) return;
  for (const squad of s.squads) {
    if (!squad.run && squad.lastQuest === current) squad.lastQuest = next;
  }
}
