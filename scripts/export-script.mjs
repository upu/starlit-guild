import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { allQuests, heroes, initialPrologueState } from "../lib/game.ts";
import { originalCharacters } from "../lib/original-characters.ts";
import { idleBanter } from "../lib/idle-banter.ts";
import { storyStages } from "../lib/prologue.ts";
import { stories, journeyBanter, coupleCombo } from "../lib/stories.ts";
import { storyArt } from "../lib/story-art.ts";
import { interludes } from "../lib/interludes.ts";
import { chapterThreeSpeakers } from "../lib/chapter-three-dialogue.ts";
import { sourceForStageBanter, sourceForStory, validateStorySources } from "./script-sources.mjs";

const outputDirectory = new URL("../docs/story/game-script/", import.meta.url);
const chapterNames = new Map([
  ["1", "第一章"],
  ["2", "第二章"],
  ["3", "第三章"],
  ["4", "第四章"],
  ["5", "第五章"],
]);
const marker = "> 自動生成ファイルです。手で編集せず、`npm run script:export` で更新してください。";
const names = new Map([
  ...[...heroes, ...originalCharacters].map(({ id, name }) => [id, name]),
  ...Object.entries(chapterThreeSpeakers),
]);
const questNames = new Map(allQuests.map(({ id, name }) => [id, name]));

function relativePath(document, file) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const target = resolve(root, file);
  if (!existsSync(target)) throw new Error(`台本の出典パスが見つかりません: ${file}`);
  const from = resolve(fileURLToPath(outputDirectory), dirname(document));
  return relative(from, target).replaceAll("\\", "/");
}

function sourceLink(document, file) {
  return `[${file}](${relativePath(document, file)})`;
}

function formatLine(line) {
  const name = line.speaker ? names.get(line.speaker) : undefined;
  // The reader displays an unrecognized speaker as narration too.
  return name ? `${name}：${line.text}` : line.text;
}

function sceneLines(story, label, document, level = "###") {
  const art = storyArt[story.id];
  const source = sourceForStory(story);
  if (art && (art.revealAtLine < 0 || art.revealAtLine >= story.lines.length)) {
    throw new Error(`スチル表示行が範囲外です: ${story.id}`);
  }
  const lines = [
    `${level} ${label}：${story.title}`,
    "",
    `シーンID：\`${story.id}\``,
    `場所：${story.place}`,
    `本文の編集元：${sourceLink(document, source.file)}（\`${source.hint}\`）`,
    ...(source.third
      ? [
          `IDの接続元：${sourceLink(document, "lib/chapter-three-dialogue.ts")} の \`scene()\` → ${sourceLink(document, "lib/chapter-three.ts")} の \`${story.chapter === "interlude" ? "LUNCH_INTERLUDE" : "chapterThreeStages"}\``,
        ]
      : []),
    ...(art
      ? [
          `スチル定義：${sourceLink(document, "lib/story-art.ts")} の \`storyArt\`（\`${art.src}\`）`,
        ]
      : []),
    "",
  ];
  story.lines.forEach((line, index) => {
    if (art?.revealAtLine === index) {
      const alt = art.alt.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]");
      lines.push(
        `> スチル表示（${index + 1}行目）：${art.src} — ${art.alt}`,
        "",
        `![${alt}](${relativePath(document, `public${art.src}`)})`,
        "",
      );
    }
    lines.push(formatLine(line), "");
  });
  return lines;
}

function stageBanter(quest, document) {
  const state = initialPrologueState(0);
  const squad = state.squads[0];
  const variants = new Map();
  const nodeCounts = quest === "sweet-blockade" ? [15, 3] : [15];
  for (const nodes of nodeCounts) {
    for (const phase of ["travel", "rest"]) {
      for (let node = 0; node < nodes; node++) {
        squad.run = { quest, nodes, node, phase, started: 0, health: {} };
        const dialogue = journeyBanter(state, squad, 0);
        if (!dialogue.length) continue;
        const key = JSON.stringify(dialogue.map(formatLine));
        const variant = variants.get(key) || { dialogue, conditions: [] };
        variant.conditions.push({ nodes, phase, node: node + 1 });
        variants.set(key, variant);
      }
    }
  }
  const source = sourceForStageBanter(quest);
  const lines = [
    "### 道中の掛け合い",
    "",
    `本文の編集元：${sourceLink(document, source.file)}（\`${source.hint}\`）`,
    "表示条件は地点と休憩状態によって変わります。",
    "",
  ];
  for (const { dialogue, conditions } of variants.values()) {
    lines.push(`#### ${describeConditions(conditions)}`, "");
    for (const line of dialogue) lines.push(formatLine(line), "");
  }
  return lines;
}

function describeConditions(conditions) {
  const labels = [];
  for (const nodes of [...new Set(conditions.map((condition) => condition.nodes))]) {
    const travel = conditions
      .filter((condition) => condition.nodes === nodes && condition.phase === "travel")
      .map((condition) => condition.node);
    const rest = conditions
      .filter((condition) => condition.nodes === nodes && condition.phase === "rest")
      .map((condition) => condition.node);
    const same = JSON.stringify(travel) === JSON.stringify(rest);
    for (const [phase, points] of same
      ? [["移動・休憩", travel]]
      : [
          ["移動", travel],
          ["休憩", rest],
        ]) {
      if (!points.length) continue;
      const range =
        points.length > 2 && points.every((point, index) => point === points[0] + index)
          ? `${points[0]}〜${points.at(-1)}`
          : points.join("、");
      labels.push(`${nodes === 3 ? "短い区間・" : ""}${phase}：地点${range}`);
    }
  }
  return labels.join("／");
}

const chapterOf = (stage) => stage.number.split("-")[0];
const stageAnchor = (stage) => `stage-${stage.number}`;
const chapterFile = (chapter) => `chapter-${chapter}.md`;

function chapterName(chapter) {
  const name = chapterNames.get(chapter);
  if (!name) throw new Error(`章の呼び名が見つかりません: ${chapter}`);
  return name;
}

function renderStage(stage, byId, document) {
  const questName = questNames.get(stage.quest);
  if (!questName) throw new Error(`ステージ名が見つかりません: ${stage.quest}`);
  const departure = byId.get(`${stage.quest}-departure`);
  const ending = byId.get(`${stage.quest}-return`);
  if (!departure || !ending) throw new Error(`シーンが見つかりません: ${stage.quest}`);
  return [
    `<a id="${stageAnchor(stage)}"></a>`,
    "",
    `## ${stage.number} ${questName}`,
    "",
    ...sceneLines(departure, "出発前", document),
    ...stageBanter(stage.quest, document),
    ...sceneLines(ending, "達成後", document),
  ];
}

function renderInterlude(story, document) {
  return [`<a id="${story.id}"></a>`, "", ...sceneLines(story, "幕間", document, "##")];
}

// Interludes are read between stages, so each one sits just before the stage it unlocks.
function chapterEntries(stages, byId) {
  return stages.flatMap((stage) => [
    ...interludes
      .filter((entry) => entry.before === stage.quest)
      .map((entry) => {
        const story = byId.get(entry.id);
        if (!story) throw new Error(`幕間のシーンが見つかりません: ${entry.id}`);
        return { story };
      }),
    { stage },
  ]);
}

function renderChapter(chapter, stages, byId) {
  const document = chapterFile(chapter);
  const entries = chapterEntries(stages, byId);
  const lines = [
    `# ${chapterName(chapter)}のゲーム内台本`,
    "",
    marker,
    "",
    "各ステージの出発前・道中の掛け合い・達成後を、遊ぶ順に収録しています。幕間は解放される位置に置いています。",
    "",
    ...entries.map(({ stage, story }) =>
      stage
        ? `- [${stage.number} ${questNames.get(stage.quest)}](#${stageAnchor(stage)})`
        : `- [幕間 ${story.title}](#${story.id})`,
    ),
    "",
  ];
  for (const { stage, story } of entries) {
    lines.push(...(stage ? renderStage(stage, byId, document) : renderInterlude(story, document)));
  }
  return lines.join("\n");
}

function renderCommonBanter() {
  const lines = ["# 共通の掛け合い", "", marker, ""];
  for (const [heading, members, count] of [
    ["二人で待機中", ["aria", "leon"], 6],
    ["三人で待機中", ["aria", "leon", "mira"], 8],
    ["四人で待機中", ["aria", "leon", "mira", "finn"], 8],
  ]) {
    lines.push(
      `## ${heading}`,
      "",
      `本文の編集元：${sourceLink("banter.md", "lib/idle-banter.ts")} の \`idleBanter()\``,
      "",
    );
    for (let index = 0; index < count; index++) {
      lines.push(`### ${index + 1}`, "");
      for (const line of idleBanter(index * 30000, members)) lines.push(formatLine(line), "");
    }
  }
  for (const [friendship, label] of [
    [0, "関係値 0〜11"],
    [12, "関係値 12〜23"],
    [24, "関係値 24以上"],
  ]) {
    const state = initialPrologueState(0);
    state.friendship["aria-leon"] = friendship;
    const squad = state.squads[0];
    squad.run = { quest: "common", nodes: 15, node: 0, phase: "travel", started: 0, health: {} };
    lines.push(
      `## ${label}`,
      "",
      `本文の編集元：${sourceLink("banter.md", "lib/stories.ts")} の \`journeyBanter()\` / \`coupleCombo()\``,
      "",
    );
    for (const [heading, now] of [
      ["道中 A", 0],
      ["道中 B", 18000],
    ]) {
      lines.push(`### ${heading}`, "");
      for (const line of journeyBanter(state, squad, now)) lines.push(formatLine(line), "");
    }
    squad.run.phase = "rest";
    lines.push("### 休憩・体力低下時", "");
    for (const line of journeyBanter(state, squad, 0)) lines.push(formatLine(line), "");
    lines.push("### 協力技 A", "", ...coupleCombo(state, 0), "");
    lines.push("### 協力技 B", "", ...coupleCombo(state, 1), "");
  }
  return lines.join("\n");
}

export function renderScripts() {
  validateStorySources(stories);
  const byId = new Map(stories.map((story) => [story.id, story]));
  if (
    byId.size !==
    storyStages.length * 2 + stories.filter((story) => story.chapter === "interlude").length
  ) {
    throw new Error("ステージ一覧とシーン数が一致しません");
  }
  const placed = interludes.filter((entry) =>
    storyStages.some((stage) => stage.quest === entry.before),
  );
  if (placed.length !== stories.filter((story) => story.chapter === "interlude").length) {
    throw new Error("幕間の置き場所が見つかりません");
  }
  const chapters = Map.groupBy(storyStages, chapterOf);
  const files = new Map();
  const index = [
    "# ゲーム内台本",
    "",
    marker,
    "",
    "実行時の会話とスチル表示位置を、章ごとに遊ぶ順で収録しています。道中の掛け合いは、表示条件ごとの台詞を載せています。",
    "",
  ];
  for (const [chapter, stages] of chapters) {
    const path = chapterFile(chapter);
    files.set(path, renderChapter(chapter, stages, byId));
    index.push(
      `- [${chapterName(chapter)}](${path})（${stages[0].number}〜${stages.at(-1).number}）`,
      ...chapterEntries(stages, byId).map(({ stage, story }) =>
        stage
          ? `  - [${stage.number} ${questNames.get(stage.quest)}](${path}#${stageAnchor(stage)})`
          : `  - [幕間 ${story.title}](${path}#${story.id})`,
      ),
    );
  }
  index.push("- [共通の掛け合い](banter.md) — 待機中と関係値別の道中・協力技", "");
  files.set("banter.md", renderCommonBanter());
  files.set("README.md", index.join("\n"));
  return files;
}

async function checkOrWrite(files, check) {
  let stale = false;
  for (const [path, content] of files) {
    const target = new URL(path, outputDirectory);
    if (check) {
      const current = (await readFile(target, "utf8").catch(() => "")).replaceAll("\r\n", "\n");
      if (current !== content) {
        console.error(`${path} が古いです。npm run script:export を実行してください。`);
        stale = true;
      }
    } else {
      await mkdir(dirname(fileURLToPath(target)), { recursive: true });
      await writeFile(target, content, "utf8");
    }
  }
  const existing = await readdir(outputDirectory).catch(() => []);
  for (const filename of existing.filter((name) => name.endsWith(".md"))) {
    if (files.has(filename)) continue;
    const target = new URL(filename, outputDirectory);
    const content = await readFile(target, "utf8");
    if (!content.includes(marker)) continue;
    if (check) stale = true;
    else await rm(target);
  }
  if (stale) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const check = process.argv.includes("--check");
  await checkOrWrite(renderScripts(), check);
  if (!check) console.log("docs/story/game-script/ の台本を更新しました。");
}
