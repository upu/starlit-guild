import type { Story, StoryLine } from "./stories.ts";

// Draft IDs never enter quest progress or saves. Assign quest IDs when gameplay is connected.
export type ChapterThreeSection = { number: string; title: string; scenes: Story[] };
export const chapterThreeSpeakers = {
  aria: "アリア",
  leon: "レオン",
  mira: "ミラ",
  finn: "フィン",
};
const speaker =
  (id: keyof typeof chapterThreeSpeakers) =>
  (text: string, expression?: StoryLine["expression"]): StoryLine => ({
    speaker: id,
    text,
    ...(expression ? { expression } : {}),
  });
export const a = speaker("aria");
export const l = speaker("leon");
export const m = speaker("mira");
export const f = speaker("finn");
export const n = (text: string): StoryLine => ({ text });
export function scene(
  number: string,
  chapter: Story["chapter"],
  title: string,
  place: string,
  lines: StoryLine[],
): Story {
  return { id: `chapter-three-draft-${number}-${chapter}`, chapter, title, place, lines };
}
