import { trioQuest } from "./chapter-two.ts";
import { isChapterThreeQuest } from "./chapter-three.ts";
import {
  isChapterFourQuest,
  MERRILL_SEEDLINGS_QUEST,
  MOSS_TRANSPLANT_QUEST,
  GUILD_FOUNDING_QUEST,
  MOSS_TRAIL_QUEST,
  MOSS_BEDS_QUEST,
} from "./chapter-four.ts";

export function storyParty(id: string) {
  if (id === MOSS_TRAIL_QUEST) return ["aria", "leon"];
  if (id === MOSS_BEDS_QUEST) return ["aria", "leon", "mira"];
  if ([MERRILL_SEEDLINGS_QUEST, MOSS_TRANSPLANT_QUEST, GUILD_FOUNDING_QUEST].includes(id))
    return ["aria", "leon", "mira", "finn", "lico"];
  if (isChapterFourQuest(id) || isChapterThreeQuest(id)) return ["aria", "leon", "mira", "finn"];
  return trioQuest(id) ? ["aria", "leon", "mira"] : ["aria", "leon"];
}
