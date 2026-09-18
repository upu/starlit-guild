import type { Story } from "./stories.ts";
import { towerFinaleStories } from "./tower-finale-stories.ts";
import { waterwayStories } from "./waterway-stories.ts";
import { earlyPrologueStories } from "./prologue-early-stories.ts";
import { latePrologueStories } from "./prologue-late-stories.ts";

export const prologueStories: Story[] = [
  ...earlyPrologueStories,
  ...latePrologueStories,
  ...waterwayStories,
  ...towerFinaleStories,
];
