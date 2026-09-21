import { chapterThreeStages, LUNCH_INTERLUDE } from "./chapter-three.ts";
import type { Story, StoryLine } from "./stories.ts";

// Stable gameplay IDs are assigned here; dialogue remains in a single source.
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
  if (number === "interlude")
    return { id: LUNCH_INTERLUDE, chapter: "interlude", title, place, lines };
  const quest = chapterThreeStages.find((stage) => stage.number === number)?.quest;
  if (!quest) throw Error("第三章のステージ番号を確認してください。");
  return { id: quest + "-" + chapter, quest, chapter, title, place, lines };
}
