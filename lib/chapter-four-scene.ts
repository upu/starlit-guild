import { chapterFourStages, WALNUT_INTERLUDE } from "./chapter-four.ts";
import type { Story, StoryLine } from "./stories.ts";

export const chapterFourSpeakers = {
  aria: "アリア",
  leon: "レオン",
  mira: "ミラ",
  finn: "フィン",
  lico: "リコ",
  merrill: "メリル",
};
export type ChapterFourSection = { number: string; title: string; scenes: Story[] };
export const line = (speaker: string, text: string): StoryLine => ({ speaker, text });
export const narration = (text: string): StoryLine => ({ text });
export function scene(
  number: string,
  chapter: Story["chapter"],
  title: string,
  place: string,
  lines: StoryLine[],
): Story {
  if (number === "interlude")
    return { id: WALNUT_INTERLUDE, chapter: "interlude", title, place, lines };
  const quest = chapterFourStages.find((stage) => stage.number === number)?.quest;
  if (!quest) throw Error("第四章のステージ番号を確認してください。");
  return { id: quest + "-" + chapter, quest, chapter, title, place, lines };
}
