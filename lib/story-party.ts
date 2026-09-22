import { trioQuest } from "./chapter-two.ts";
import { isChapterThreeQuest } from "./chapter-three.ts";

export const storyParty = (id: string) =>
  isChapterThreeQuest(id)
    ? ["aria", "leon", "mira", "finn"]
    : trioQuest(id)
      ? ["aria", "leon", "mira"]
      : ["aria", "leon"];
