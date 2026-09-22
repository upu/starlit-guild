import { chapterThreeStages, LUNCH_INTERLUDE, BERNE_QUEST } from "./chapter-three.ts";
import type { State } from "./game.ts";
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
  for (const sq of s.squads)
    if (!sq.run && (s.autoNextQuest || sq.lastQuest === LUNCH_INTERLUDE))
      sq.lastQuest = BERNE_QUEST;
}
// Called only on the first reading of an ending, after the next stage unlocks.
export function advanceQuestDestination(s: State, storyId: string) {
  if (storyId === LUNCH_INTERLUDE && stageUnlocked(s, BERNE_QUEST)) {
    setInterludeDestination(s);
    return;
  }
  if (!s.autoNextQuest) return;
  const index = storyStages.findIndex((stage) => stage.quest + "-return" === storyId);
  if (index < 0) return;
  const current = storyStages[index].quest,
    interlude = pendingInterlude(s),
    next = interlude?.after === current ? interlude.id : storyStages[index + 1]?.quest;
  if (
    !s.done[current] ||
    !next ||
    s.done[next] ||
    (next !== interlude?.id && !stageUnlocked(s, next))
  )
    return;
  for (const squad of s.squads) {
    if (!squad.run && squad.lastQuest === current) squad.lastQuest = next;
  }
}
