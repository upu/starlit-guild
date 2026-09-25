import { sectionsPart1 } from "./chapter-four-stories-1.ts";
import { sectionsPart2 } from "./chapter-four-stories-2.ts";
import { sectionsPart3 } from "./chapter-four-stories-3.ts";
export { chapterFourSpeakers } from "./chapter-four-scene.ts";
export type { ChapterFourSection } from "./chapter-four-scene.ts";
export const chapterFourSections = [...sectionsPart1, ...sectionsPart2, ...sectionsPart3];
export const chapterFourStories = chapterFourSections.flatMap((section) => section.scenes);
