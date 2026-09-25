import { earlyPrologueStories } from "../lib/prologue-early-stories.ts";
import { latePrologueStories } from "../lib/prologue-late-stories.ts";
import { waterwayStories } from "../lib/waterway-stories.ts";
import { towerFinaleStories } from "../lib/tower-finale-stories.ts";
import { chapterTwoStories } from "../lib/chapter-two-stories.ts";
import { deliveryStories } from "../lib/chapter-two-delivery-stories.ts";
import { finaleStories } from "../lib/chapter-two-finale-stories.ts";
import { chapterThreeOpening } from "../lib/chapter-three-opening-stories.ts";
import { chapterThreePreparation } from "../lib/chapter-three-preparation-stories.ts";
import { chapterThreeFinale } from "../lib/chapter-three-finale-stories.ts";
import { chapterFourSections } from "../lib/chapter-four-stories.ts";
import { chapterTwoStages } from "../lib/chapter-two.ts";
import { chapterThreeStages } from "../lib/chapter-three.ts";
import { chapterFourStages } from "../lib/chapter-four.ts";
import { prologueStages, WATERWAY_QUEST, RESTORATION_QUEST, MOSS_QUEST } from "../lib/prologue.ts";

// Only the exporter uses this provenance map. Story objects and game saves stay unchanged.
const sceneGroups = [
  ["lib/prologue-early-stories.ts", earlyPrologueStories],
  ["lib/prologue-late-stories.ts", latePrologueStories],
  ["lib/waterway-stories.ts", waterwayStories],
  ["lib/tower-finale-stories.ts", towerFinaleStories],
  [
    "lib/chapter-two-stories.ts",
    chapterTwoStories.filter(
      (story) => !deliveryStories.includes(story) && !finaleStories.includes(story),
    ),
  ],
  ["lib/chapter-two-delivery-stories.ts", deliveryStories],
  ["lib/chapter-two-finale-stories.ts", finaleStories],
];
const thirdGroups = [
  ["lib/chapter-three-opening-stories.ts", chapterThreeOpening],
  ["lib/chapter-three-preparation-stories.ts", chapterThreePreparation],
  ["lib/chapter-three-finale-stories.ts", chapterThreeFinale],
];
const sources = new Map();

function register(story, file, hint, third = false, fourth = false) {
  if (sources.has(story)) throw new Error(`台本の出典が重複しています: ${story.id}`);
  sources.set(story, { file, hint, third, fourth });
}

for (const [file, group] of sceneGroups)
  for (const story of group) register(story, file, `title: "${story.title}"`);
for (const [file, sections] of thirdGroups)
  for (const section of sections)
    for (const story of section.scenes)
      register(
        story,
        file,
        `scene("${section.number === "幕間" ? "interlude" : section.number}", "${section.number === "幕間" ? "return" : story.chapter}", …)`,
        true,
      );
function fourthSourceFile(number) {
  const stage = Number(number.slice(2));
  if (number === "interlude" || stage <= 3) return "lib/chapter-four-stories-1.ts";
  if (stage <= 7) return "lib/chapter-four-stories-2.ts";
  return "lib/chapter-four-stories-3.ts";
}
for (const section of chapterFourSections)
  for (const story of section.scenes)
    register(
      story,
      fourthSourceFile(section.number),
      `scene("${section.number}", "${story.chapter}", …)`,
      false,
      true,
    );

export function sourceForStory(story) {
  const source = sources.get(story);
  if (!source) throw new Error(`台本の本文出典が見つかりません: ${story.id}`);
  return source;
}

export function validateStorySources(stories) {
  const actual = new Set(stories);
  for (const story of stories) sourceForStory(story);
  for (const story of sources.keys())
    if (!actual.has(story)) throw new Error(`台本に使われない本文出典があります: ${story.id}`);
}

const waterwayQuests = new Set([WATERWAY_QUEST, RESTORATION_QUEST, MOSS_QUEST]);
export function sourceForStageBanter(quest) {
  if (chapterFourStages.some((stage) => stage.quest === quest))
    return { file: "lib/chapter-four-banter.ts", hint: "chapterFourBanter()" };
  if (chapterThreeStages.some((stage) => stage.quest === quest))
    return {
      file: "lib/chapter-three-banter.ts",
      hint: `chapterThreeBanter() / routes["${quest}"]`,
    };
  if (chapterTwoStages.some((stage) => stage.quest === quest))
    return { file: "lib/chapter-two.ts", hint: "chapterTwoBanter()" };
  if (waterwayQuests.has(quest))
    return { file: "lib/waterway-banter.ts", hint: "waterwayBanter()" };
  if (prologueStages.some((stage) => stage.quest === quest))
    return { file: "lib/stories.ts", hint: "routeBanter()" };
  throw new Error(`道中の掛け合いの出典が見つかりません: ${quest}`);
}
