import { chapterTwoStories } from "./chapter-two-stories.ts";
import { chapterThreeStories } from "./chapter-three-stories.ts";
import { chapterFourStories } from "./chapter-four-stories.ts";
import { storyArtAt } from "./story-art.ts";
import type { StoryStageCue } from "./story-stage-cues.ts";
import { buildLaterStage, type LaterStage } from "./story-stage-later-shared.ts";
import { medicineStages } from "./story-stage-medicine.ts";
import { puppetStages } from "./story-stage-puppets.ts";
import { berneStages } from "./story-stage-berne.ts";
import { manorStages } from "./story-stage-manor.ts";
import { interludeStages } from "./story-stage-interludes.ts";
import { brekkaStages } from "./story-stage-brekka.ts";
import { licoStages } from "./story-stage-lico.ts";
import { seedlingStages } from "./story-stage-seedlings.ts";
import { foundingStages } from "./story-stage-founding.ts";

const definitions: Partial<Record<string, LaterStage>> = {
  ...medicineStages,
  ...puppetStages,
  ...berneStages,
  ...manorStages,
  ...interludeStages,
  ...brekkaStages,
  ...licoStages,
  ...seedlingStages,
  ...foundingStages,
};
const stages = new Map<string, StoryStageCue[]>(),
  exits = new Map<string, StoryStageCue>();
for (const story of [...chapterTwoStories, ...chapterThreeStories, ...chapterFourStories]) {
  const definition = definitions[story.id];
  if (!definition) continue;
  const cues = buildLaterStage(story, definition);
  stages.set(story.id, cues);
  const last = cues.at(-1);
  const settled = last?.sequence?.at(-1) ?? last;
  if (last && settled && (definition.exit || definition.exitExtras))
    exits.set(story.id, {
      ...last,
      sequence: undefined,
      cut: false,
      items: settled.items,
      extras: definition.exitExtras ?? settled.extras ?? last.extras,
      description: `${story.place}。会話を終えて出発する。`,
      actors: settled.actors.map((a, i) =>
        definition.exit?.includes(a.id)
          ? {
              ...a,
              x: definition.exitSide === "left" ? -10 - i * 8 : 110 + i * 8,
              left: definition.exitSide === "left",
              via: undefined,
              lane: definition.exitLanes?.[a.id],
              inspect: false,
              seated: false,
              bed: undefined,
              wave: false,
              reaction: undefined,
              ...definition.exitRoutes?.[a.id],
            }
          : a,
      ),
    });
}
export const hasLaterStage = (id: string) => stages.has(id);
export const laterStageCue = (id: string, line: number): StoryStageCue | null =>
  storyArtAt(id, line) ? null : (stages.get(id)?.[line] ?? null);
export const laterExitCue = (id: string): StoryStageCue | null => exits.get(id) ?? null;
