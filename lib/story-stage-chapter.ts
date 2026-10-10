import { prologueStories } from "./prologue-stories.ts";
import { storyArtAt } from "./story-art.ts";
import type { StoryStageCue } from "./story-stage-cues.ts";
import { buildChapterStage, type ChapterStage } from "./story-stage-chapter-shared.ts";
import { towerStages } from "./story-stage-tower.ts";
import { forestStages } from "./story-stage-forest.ts";
import { waterwayStages } from "./story-stage-waterway.ts";

const definitions: Partial<Record<string, ChapterStage>> = {
  ...towerStages,
  ...forestStages,
  ...waterwayStages,
};
const stages = new Map<string, StoryStageCue[]>();
const exits = new Map<string, StoryStageCue>();
for (const story of prologueStories) {
  const definition = definitions[story.id];
  if (!definition) continue;
  const cues = buildChapterStage(story, definition);
  stages.set(story.id, cues);
  const last = cues.at(-1);
  if (!last) continue;
  if (definition.exit)
    exits.set(story.id, {
      ...last,
      description: `${story.place}。会話を終え、二人が歩き出す。`,
      actors: last.actors.map((actor, index) => ({
        ...actor,
        x: definition.exit === "apart" && index === 0 ? -12 : 110 + index * 22,
        left: definition.exit === "apart" && index === 0,
        inspect: false,
        wave: false,
        reaction: undefined,
      })),
      extras: last.extras?.map((extra) => ({ ...extra, pose: "wave", speaking: false })),
    });
}

export const chapterStageCue = (id: string, line: number): StoryStageCue | null =>
  storyArtAt(id, line) ? null : (stages.get(id)?.[line] ?? null);
export const chapterExitCue = (id: string): StoryStageCue | null => exits.get(id) ?? null;
