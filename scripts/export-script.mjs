import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { allQuests, heroes, initialPrologueState } from "../lib/game.ts";
import { idleBanter } from "../lib/idle-banter.ts";
import { originalCharacters } from "../lib/original-characters.ts";
import { storyStages } from "../lib/prologue.ts";
import { stories, journeyBanter, coupleCombo } from "../lib/stories.ts";
import { storyArt } from "../lib/story-art.ts";

const outputDirectory = new URL("../docs/generated/", import.meta.url);
const marker = "> 自動生成ファイルです。手で編集せず、`npm run script:export` で更新してください。";
const names = new Map([...heroes, ...originalCharacters].map(({ id, name }) => [id, name]));
const questNames = new Map(allQuests.map(({ id, name }) => [id, name]));

function formatLine(line) {
  const name = line.speaker ? names.get(line.speaker) : undefined;
  // The reader displays an unrecognized speaker as narration too.
  return name ? `${name}：${line.text}` : line.text;
}

function sceneLines(story, label) {
  const art = storyArt[story.id];
  if (art && (art.revealAtLine < 0 || art.revealAtLine >= story.lines.length)) {
    throw new Error(`スチル表示行が範囲外です: ${story.id}`);
  }
  const lines = [
    `## ${label}：${story.title}`,
    "",
    `シーンID：\`${story.id}\``,
    `場所：${story.place}`,
    "",
  ];
  story.lines.forEach((line, index) => {
    if (art?.revealAtLine === index) {
      lines.push(`> スチル表示（${index + 1}行目）：${art.src} — ${art.alt}`, "");
    }
    lines.push(formatLine(line), "");
  });
  return lines;
}

function stageBanter(quest) {
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
  const lines = ["## 道中の掛け合い", "", "表示条件は地点と休憩状態によって変わります。", ""];
  for (const { dialogue, conditions } of variants.values()) {
    lines.push(`### ${describeConditions(conditions)}`, "");
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

function renderStage(stage, byId) {
  const questName = questNames.get(stage.quest);
  if (!questName) throw new Error(`ステージ名が見つかりません: ${stage.quest}`);
  const lines = [`# ${stage.number} ${questName}`, "", marker, ""];
  const departure = byId.get(`${stage.quest}-departure`);
  const ending = byId.get(`${stage.quest}-return`);
  if (!departure || !ending) throw new Error(`シーンが見つかりません: ${stage.quest}`);
  lines.push(...sceneLines(departure, "出発前"));
  lines.push(...stageBanter(stage.quest));
  lines.push(...sceneLines(ending, "達成後"));
  return lines.join("\n");
}

function renderCommonBanter() {
  const lines = ["# 共通の掛け合い", "", marker, ""];
  for (const [heading, members, count] of [
    ["二人で待機中", ["aria", "leon"], 6],
    ["三人で待機中", ["aria", "leon", "mira"], 8],
  ]) {
    lines.push(`## ${heading}`, "");
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
    lines.push(`## ${label}`, "");
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
  const byId = new Map(stories.map((story) => [story.id, story]));
  if (byId.size !== storyStages.length * 2) {
    throw new Error("ステージ一覧とシーン数が一致しません");
  }
  const files = new Map();
  const index = [
    "# ゲーム内台本",
    "",
    marker,
    "",
    "実行時の会話とスチル表示位置を収録しています。道中の掛け合いは、表示条件ごとの台詞を載せています。",
    "",
  ];
  for (const stage of storyStages) {
    const path = `stages/${stage.number}.md`;
    files.set(path, renderStage(stage, byId));
    index.push(`- [${stage.number} ${questNames.get(stage.quest)}](${path})`);
  }
  index.push("", "- [共通の掛け合い](banter.md)", "");
  files.set("banter.md", renderCommonBanter());
  files.set("script.md", index.join("\n"));
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
  const stageDirectory = new URL("stages/", outputDirectory);
  const existing = await readdir(stageDirectory).catch(() => []);
  for (const filename of existing.filter((name) => name.endsWith(".md"))) {
    if (files.has(`stages/${filename}`)) continue;
    const target = new URL(filename, stageDirectory);
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
  if (!check) console.log("docs/generated/ の台本を更新しました。");
}
