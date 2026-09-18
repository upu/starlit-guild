import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { allQuests, heroes } from "../lib/game.ts";
import { originalCharacters } from "../lib/original-characters.ts";
import { storyStages } from "../lib/prologue.ts";
import { stories } from "../lib/stories.ts";
import { storyArt } from "../lib/story-art.ts";

const output = new URL("../docs/generated/script.md", import.meta.url);
const names = new Map([...heroes, ...originalCharacters].map(({ id, name }) => [id, name]));
const questNames = new Map(allQuests.map(({ id, name }) => [id, name]));

export function renderScript() {
  const byId = new Map(stories.map((story) => [story.id, story]));
  const lines = [
    "# ゲーム内台本",
    "",
    "> 自動生成ファイルです。手で編集せず、`npm run script:export` で更新してください。会話・地の文は `lib/stories.ts` の実行時データ、スチル表示位置は `lib/story-art.ts` に基づきます。道中の状況別の掛け合いは含みません。",
    "",
  ];

  for (const stage of storyStages) {
    const questName = questNames.get(stage.quest);
    if (!questName) throw new Error(`ステージ名が見つかりません: ${stage.quest}`);
    lines.push(`## ${stage.number} ${questName}`, "");
    for (const chapter of ["departure", "return"]) {
      const id = `${stage.quest}-${chapter}`;
      const story = byId.get(id);
      if (!story) throw new Error(`シーンが見つかりません: ${id}`);
      const art = storyArt[id];
      if (art && (art.revealAtLine < 0 || art.revealAtLine >= story.lines.length)) {
        throw new Error(`スチル表示行が範囲外です: ${id}`);
      }
      lines.push(`### ${chapter === "departure" ? "出発前" : "達成後"}：${story.title}`, "");
      lines.push(`シーンID：\`${id}\``, `場所：${story.place}`, "");
      story.lines.forEach((line, index) => {
        if (art?.revealAtLine === index) {
          lines.push(`> スチル表示（${index + 1}行目）：${art.src} — ${art.alt}`, "");
        }
        const name = line.speaker ? names.get(line.speaker) : undefined;
        // The reader displays an unrecognized speaker as narration too.
        lines.push(name ? `${name}：${line.text}` : line.text, "");
      });
    }
  }
  if (byId.size !== storyStages.length * 2) {
    throw new Error("ステージ一覧にないシーンが含まれています");
  }
  return lines.join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const generated = renderScript();
  if (process.argv.includes("--check")) {
    const current = (await readFile(output, "utf8").catch(() => "")).replaceAll("\r\n", "\n");
    if (current !== generated) {
      console.error(
        "docs/generated/script.md が古いです。npm run script:export を実行してください。",
      );
      process.exitCode = 1;
    }
  } else {
    await mkdir(dirname(fileURLToPath(output)), { recursive: true });
    await writeFile(output, generated, "utf8");
    console.log("docs/generated/script.md を更新しました。");
  }
}
