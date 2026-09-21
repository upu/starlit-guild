import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { format } from "prettier";
import { trainedChapter } from "./check-combat-balance.mjs";
import { chapterRoute } from "./check-chapter-two-balance.mjs";
import { chapterThreeRoute } from "./check-chapter-three-balance.mjs";
import { prologueStages } from "../lib/prologue.ts";
import { chapterTwoStages } from "../lib/chapter-two.ts";
import { chapterThreeStages } from "../lib/chapter-three.ts";

// Add each new chapter's standard route here, passing on the full earned state.
export function generateTestPresets() {
  const first = trainedChapter(true);
  const second = chapterRoute("standard", first.state);
  const third = chapterThreeRoute(second.state);
  return [
    [prologueStages, first],
    [chapterTwoStages, second],
    [chapterThreeStages, third],
  ].map(([stages, result], index) => {
    const state = structuredClone(result.state);
    if (
      state.squads.some((squad) => squad.run) ||
      stages.some(({ quest }) => !state.story.read.includes(quest + "-return"))
    )
      throw Error(`第${index + 1}章の標準試走が完了していません。`);
    state.updatedAt = 0;
    state.log = [];
    return { chapter: index + 1, quests: stages.map((stage) => stage.quest), state };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = new URL("../lib/generated/chapter-test-states.json", import.meta.url);
  const output = await format(JSON.stringify(generateTestPresets()), {
    parser: "json",
    printWidth: 100,
  });
  if (process.argv.includes("--check")) {
    if (readFileSync(target, "utf8").replaceAll("\r\n", "\n") !== output)
      throw Error(
        "テスト開始データが古いです。npm run presets:generate を実行し、章の基準も確認してください。",
      );
  } else {
    mkdirSync(new URL("../lib/generated/", import.meta.url), { recursive: true });
    writeFileSync(target, output);
  }
}
