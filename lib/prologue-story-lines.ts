import type { StoryLine } from "./stories.ts";

export const a = (text: string, expression?: StoryLine["expression"]): StoryLine => ({
  speaker: "aria",
  text,
  ...(expression ? { expression } : {}),
});
export const l = (text: string, expression?: StoryLine["expression"]): StoryLine => ({
  speaker: "leon",
  text,
  ...(expression ? { expression } : {}),
});
export const n = (text: string): StoryLine => ({ text });
