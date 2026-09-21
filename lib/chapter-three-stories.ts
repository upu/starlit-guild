import { chapterThreeOpening } from "./chapter-three-opening-stories.ts";
import { chapterThreePreparation } from "./chapter-three-preparation-stories.ts";
import { chapterThreeFinale } from "./chapter-three-finale-stories.ts";

// Read-only preview content: intentionally not added to stories, storyStages, or the roster.
export const chapterThreeSections = [
  ...chapterThreeOpening,
  ...chapterThreePreparation,
  ...chapterThreeFinale,
];
export const chapterThreeStories = chapterThreeSections.flatMap((section) => section.scenes);
