import { access, mkdir, writeFile } from "node:fs/promises";
import { stories } from "../lib/stories.ts";
import { storyStages } from "../lib/prologue.ts";
import { allQuests } from "../lib/game.ts";
import { storyArtAt } from "../lib/story-art.ts";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { adventureCoverageInput } from "./storybook-adventure-coverage.mjs";
import { worksiteArt } from "../lib/road-worksite-art.ts";
import { prepareStorybookWork, storybookWorkAppearance } from "../lib/road-storybook-work.ts";

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};
const scenes = [];
for (const story of stories) {
  const row = {
    id: story.id,
    chapter: story.chapter,
    quest: story.quest,
    title: story.title,
    pages: story.lines.length,
    stillPages: [],
    paintedPages: [],
    legacyPages: [],
    dialogueOnlyPages: [],
    backgrounds: [],
    missingAssets: [],
  };
  const arts = new Set();
  for (let page = 0; page < story.lines.length; page++) {
    const still = storyArtAt(story.id, page);
    if (still) {
      row.stillPages.push(page);
      arts.add(still.src);
      continue;
    }
    const cue = studyCue(story.id, page, true);
    if (!cue) {
      row.dialogueOnlyPages.push(page);
      continue;
    }
    const presentation = storybookPresentation(story.id, cue.background, page);
    if (!presentation) {
      row.legacyPages.push({ page, background: cue.background });
      continue;
    }
    row.paintedPages.push(page);
    const asset = `/storybook-study/${presentation.art}.png`;
    arts.add(asset);
    if (!row.backgrounds.some((b) => b.asset === asset))
      row.backgrounds.push({ asset, mode: presentation.mode });
  }
  for (const asset of arts) if (!(await exists(`public${asset}`))) row.missingAssets.push(asset);
  scenes.push(row);
}
const adventures = storyStages.map((stage) => {
  const quest = allQuests.find((q) => q.id === stage.quest);
  const painted = adventureCoverageInput(stage.quest);
  return {
    stage: stage.number,
    quest: stage.quest,
    title: stage.title,
    sourceBackground: quest?.background,
    painted: painted.storybookHeroes === true,
    paintedBackground: painted.backgroundOverride,
  };
});
for (const adventure of adventures) {
  adventure.missingAsset = adventure.paintedBackground
    ? !(await exists(`public${adventure.paintedBackground}`))
    : false;
}
const worksites = Object.entries(worksiteArt).map(([kind, work]) => {
  const look = { storybookHeroes: true, work: { ...work } };
  prepareStorybookWork(look);
  return { kind, original: work.asset, painted: storybookWorkAppearance(look)?.asset ?? null };
});
const report = {
  scope:
    "Source registration only. This does not certify PC/mobile motion, contact, scale, pacing or visual quality.",
  scenes,
  adventures,
  worksites,
};
await mkdir("work", { recursive: true });
await writeFile("work/storybook-coverage.json", JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      scenes: scenes.length,
      paintedPages: scenes.reduce((n, s) => n + s.paintedPages.length, 0),
      stillPages: scenes.reduce((n, s) => n + s.stillPages.length, 0),
      legacyScenes: scenes
        .filter((s) => s.legacyPages.length)
        .map((s) => ({
          id: s.id,
          pages: s.legacyPages.length,
          from: s.legacyPages[0].page,
          to: s.legacyPages.at(-1).page,
        })),
      missingAssets: scenes.flatMap((s) => s.missingAssets),
      adventures: adventures.filter((a) => a.painted).length,
      totalAdventures: adventures.length,
      missingAdventureAssets: adventures
        .filter((a) => a.missingAsset)
        .map((a) => a.paintedBackground),
      unconvertedWorksites: worksites.filter((w) => !w.painted).map((w) => w.kind),
    },
    null,
    2,
  ),
);
