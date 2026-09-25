import { trioQuest } from "./chapter-two.ts";
import { isChapterThreeQuest } from "./chapter-three.ts";
import {
  isChapterFourQuest,
  MERRILL_SEEDLINGS_QUEST,
  MOSS_TRANSPLANT_QUEST,
  GUILD_FOUNDING_QUEST,
} from "./chapter-four.ts";

export const storyParty = (id: string) =>
  isChapterFourQuest(id)
    ? [
        "aria",
        "leon",
        "mira",
        "finn",
        ...([MERRILL_SEEDLINGS_QUEST, MOSS_TRANSPLANT_QUEST, GUILD_FOUNDING_QUEST].includes(id)
          ? ["lico"]
          : []),
      ]
    : isChapterThreeQuest(id)
      ? ["aria", "leon", "mira", "finn"]
      : trioQuest(id)
        ? ["aria", "leon", "mira"]
        : ["aria", "leon"];
