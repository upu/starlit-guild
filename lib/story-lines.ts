import type { StoryLine } from "./stories.ts";
import type { PortraitExpression } from "./portrait-expressions.ts";

// Shared builders for dialogue. A spoken line always carries an expression; leaving it out means
// "neutral", the face the portrait shows by default.
export const line = (
  speaker: string,
  text: string,
  expression: PortraitExpression = "neutral",
): StoryLine => ({ speaker, text, expression });
export const narration = (text: string): StoryLine => ({ text });

const speaker =
  (id: string) =>
  (text: string, expression?: PortraitExpression): StoryLine =>
    line(id, text, expression);
export const aria = speaker("aria");
export const leon = speaker("leon");
export const mira = speaker("mira");
export const finn = speaker("finn");
export const lico = speaker("lico");
