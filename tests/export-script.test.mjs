import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { allQuests, heroes, initialPrologueState } from "../lib/game.ts";
import { idleBanter } from "../lib/idle-banter.ts";
import { originalCharacters } from "../lib/original-characters.ts";
import { storyStages } from "../lib/prologue.ts";
import { stories, journeyBanter, coupleCombo } from "../lib/stories.ts";
import { storyArt } from "../lib/story-art.ts";
import { chapterThreeSections } from "../lib/chapter-three-stories.ts";
import { renderScripts } from "../scripts/export-script.mjs";
import {
  sourceForStageBanter,
  sourceForStory,
  validateStorySources,
} from "../scripts/script-sources.mjs";

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
  assert.equal(files.size, storyStages.length + 3);
  for (const [path, content] of files) assert.equal(readGenerated(path), content, path);
  const index = files.get("script.md");
  assert.ok(index.split("\n").length < 45);
  assert.deepEqual(
    [...index.matchAll(/^- \[(.+)\]\(stages\/(.+)\.md\)$/gm)].map((match) => match[1]),
    storyStages.map(
      (stage) => `${stage.number} ${allQuests.find((quest) => quest.id === stage.quest)?.name}`,
    ),
  );
  assert.match(index, /\[共通の掛け合い\]\(banter\.md\)/);
});

test("each stage preserves its two scenes and every still reveal", () => {
  assert.equal(stories.filter((st) => st.chapter !== "interlude").length, storyStages.length * 2);
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
        const imagePath = art ? `../../../public${art.src}` : "";
        const still =
          art?.revealAtLine === index
            ? [
                `> スチル表示（${index + 1}行目）：${art.src} — ${art.alt}`,
                `![${art.alt}](${imagePath})`,
              ]
            : [];
        if (still.length) {
          assert.ok(
            existsSync(
              new URL(
                imagePath,
                new URL(`../docs/generated/stages/${stage.number}.md`, import.meta.url),
              ),
            ),
            id,
          );
        }
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
    [["aria", "leon", "mira", "finn"], 8],
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

test("every scene and route has a checked editing source", () => {
  validateStorySources(stories);
  const byId = new Map(stories.map((story) => [story.id, story]));
  for (const [id, file] of [
    ["village-trade-departure", "lib/prologue-early-stories.ts"],
    ["tower-moss-removal-return", "lib/tower-finale-stories.ts"],
    ["hilltop-picnic-departure", "lib/chapter-two-stories.ts"],
    ["waiting-households-return", "lib/chapter-two-finale-stories.ts"],
    ["interlude-walnut-lunch", "lib/chapter-three-opening-stories.ts"],
    ["berne-road-departure", "lib/chapter-three-opening-stories.ts"],
  ]) {
    assert.equal(sourceForStory(byId.get(id)).file, file, id);
  }
  for (const [quest, file] of [
    [storyStages[0].quest, "lib/stories.ts"],
    [storyStages[7].quest, "lib/waterway-banter.ts"],
    [storyStages[9].quest, "lib/chapter-two.ts"],
    [storyStages[18].quest, "lib/chapter-three-banter.ts"],
  ]) {
    assert.equal(sourceForStageBanter(quest).file, file, quest);
  }
  assert.throws(() => sourceForStory({ id: "unknown" }), /本文出典/);
  assert.throws(() => sourceForStageBanter("unknown"), /掛け合いの出典/);
  assert.throws(() => validateStorySources(stories.slice(1)), /使われない本文出典/);
});

test("generated source links resolve, and art links appear only for scenes with stills", () => {
  const files = renderScripts();
  for (const [path, content] of files) {
    const document = new URL(`../docs/generated/${path}`, import.meta.url);
    for (const match of content.matchAll(/\[lib\/[^\]]+\]\(([^)]+)\)/g))
      assert.ok(existsSync(new URL(match[1], document)), `${path}: ${match[1]}`);
  }
  for (const stage of storyStages) {
    const content = files.get(`stages/${stage.number}.md`);
    assert.equal([...content.matchAll(/^本文の編集元：/gm)].length, 3, stage.number);
    assert.equal(
      [...content.matchAll(/^IDの接続元：/gm)].length,
      stage.number.startsWith("3-") ? 2 : 0,
      stage.number,
    );
    assert.equal(
      [...content.matchAll(/^スチル定義：/gm)].length,
      ["departure", "return"].filter((part) => storyArt[`${stage.quest}-${part}`]).length,
      stage.number,
    );
  }
  const third = chapterThreeSections.flatMap((section) => section.scenes);
  const draft = files.get("chapter-three.md");
  assert.match(draft, /scene\("interlude", "return", …\)/);
  assert.equal([...draft.matchAll(/^本文の編集元：/gm)].length, third.length);
  assert.equal([...draft.matchAll(/^IDの接続元：/gm)].length, third.length);
  assert.equal(
    [...draft.matchAll(/^スチル定義：/gm)].length,
    third.filter((s) => storyArt[s.id]).length,
  );
  assert.equal([...files.get("banter.md").matchAll(/^本文の編集元：/gm)].length, 6);
});
