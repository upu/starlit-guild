import { chapterThreeOpening } from "./chapter-three-opening-stories.ts";
import { chapterThreePreparation } from "./chapter-three-preparation-stories.ts";
import { chapterThreeFinale } from "./chapter-three-finale-stories.ts";

// Runtime and generated scripts share these scene objects.
export const chapterThreeSections = [
  ...chapterThreeOpening,
  ...chapterThreePreparation,
  ...chapterThreeFinale,
];
export const chapterThreeStories = chapterThreeSections.flatMap((section) => section.scenes);
