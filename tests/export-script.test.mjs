import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allQuests, heroes, initialPrologueState } from "../lib/game.ts";
import { idleBanter } from "../lib/idle-banter.ts";
import { originalCharacters } from "../lib/original-characters.ts";
import { storyStages } from "../lib/prologue.ts";
import { stories, journeyBanter, coupleCombo } from "../lib/stories.ts";
import { storyArt } from "../lib/story-art.ts";
import { renderScripts } from "../scripts/export-script.mjs";

const names = new Map([...heroes, ...originalCharacters].map(({ id, name }) => [id, name]));
const formatLine = (line) =>
  line.speaker && names.has(line.speaker) ? `${names.get(line.speaker)}：${line.text}` : line.text;
const readGenerated = (path) =>
  readFileSync(new URL(`../docs/generated/${path}`, import.meta.url), "utf8").replaceAll(
    "\r\n",
    "\n",
  );

test("generated index links all stages and every generated file is current", () => {
  const files = renderScripts();
  assert.equal(files.size, storyStages.length + 2);
  for (const [path, content] of files) assert.equal(readGenerated(path), content, path);
  const index = files.get("script.md");
  assert.ok(index.split("\n").length < 30);
  assert.deepEqual(
    [...index.matchAll(/^- \[(.+)\]\(stages\/(.+)\.md\)$/gm)].map((match) => match[1]),
    storyStages.map(
      (stage) => `${stage.number} ${allQuests.find((quest) => quest.id === stage.quest)?.name}`,
    ),
  );
  assert.match(index, /\[共通の掛け合い\]\(banter\.md\)/);
});

test("each stage preserves its two scenes and every still reveal", () => {
  assert.equal(stories.length, storyStages.length * 2);
  for (const stage of storyStages) {
    const content = readGenerated(`stages/${stage.number}.md`);
    assert.match(content, /自動生成ファイルです。手で編集せず/);
    assert.ok(content.indexOf("## 出発前") < content.indexOf("## 道中の掛け合い"));
    assert.ok(content.indexOf("## 道中の掛け合い") < content.indexOf("## 達成後"));
    for (const chapter of ["departure", "return"]) {
      const id = `${stage.quest}-${chapter}`;
      const scene = stories.find((story) => story.id === id);
      assert.ok(scene, id);
      const section = content
        .split(chapter === "departure" ? "## 出発前" : "## 達成後")[1]
        .split(chapter === "departure" ? "## 道中の掛け合い" : "\n## ")[0];
      assert.ok(section.includes(`シーンID：\`${id}\``), id);
      const actual = section
        .split(/\n\n/)
        .map((text) => text.trim())
        .filter(Boolean)
        .slice(2);
      const expected = scene.lines.flatMap((line, index) => {
        const art = storyArt[id];
        const still =
          art?.revealAtLine === index
            ? [`> スチル表示（${index + 1}行目）：${art.src} — ${art.alt}`]
            : [];
        return [...still, formatLine(line)];
      });
      assert.deepEqual(actual, expected, id);
    }
  }
});

test("stage files include every route banter variant from runtime", () => {
  for (const stage of storyStages) {
    const content = readGenerated(`stages/${stage.number}.md`);
    const state = initialPrologueState(0);
    const squad = state.squads[0];
    for (const nodes of stage.quest === "sweet-blockade" ? [15, 3] : [15]) {
      for (const phase of ["travel", "rest"]) {
        for (let node = 0; node < nodes; node++) {
          squad.run = { quest: stage.quest, nodes, node, phase, started: 0, health: {} };
          const lines = journeyBanter(state, squad, 0).map(formatLine).join("\n\n");
          assert.ok(content.includes(lines), `${stage.number}: ${phase} ${node}`);
        }
      }
    }
  }
});

test("shared banter includes both idle parties, relationship tiers and combo lines", () => {
  const content = readGenerated("banter.md");
  for (const [members, count] of [
    [["aria", "leon"], 6],
    [["aria", "leon", "mira"], 8],
  ]) {
    for (let index = 0; index < count; index++) {
      assert.ok(
        content.includes(
          idleBanter(index * 30000, members)
            .map(formatLine)
            .join("\n\n"),
        ),
      );
    }
  }
  for (const friendship of [0, 12, 24]) {
    const state = initialPrologueState(0);
    state.friendship["aria-leon"] = friendship;
    const squad = state.squads[0];
    squad.run = { quest: "common", nodes: 15, node: 0, phase: "travel", started: 0, health: {} };
    for (const now of [0, 18000]) {
      assert.ok(content.includes(journeyBanter(state, squad, now).map(formatLine).join("\n\n")));
    }
    squad.run.phase = "rest";
    assert.ok(content.includes(journeyBanter(state, squad, 0).map(formatLine).join("\n\n")));
    for (const variant of [0, 1])
      assert.ok(content.includes(coupleCombo(state, variant).join("\n")));
  }
});
