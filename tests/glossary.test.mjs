import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { storyStages, prologueStages } from "../lib/prologue.ts";
import * as prologue from "../lib/prologue.ts";
import * as chapterTwo from "../lib/chapter-two.ts";
import { allQuests } from "../lib/game.ts";
import { stories } from "../lib/stories.ts";
import { storyArt } from "../lib/story-art.ts";

const glossary = readFileSync(new URL("../docs/glossary.md", import.meta.url), "utf8");

// Rows look like: | 1-1 交易路（昼） | 街への交易 | `village-trade` | `TRADE_QUEST` | 街へ続く交易路 |
function rows(heading) {
  const section = glossary.split(`## ${heading}`)[1];
  assert.ok(section, `見出し「${heading}」が見つかりません`);
  return section
    .split("\n## ")[0]
    .split("\n")
    .filter((line) => line.startsWith("|") && !/^\|[\s:-]+\|/.test(line))
    .slice(1)
    .map((line) =>
      line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim().replace(/^`|`$/g, "")),
    );
}

test("the stage table lists every story stage once, in order, with the real names and ids", () => {
  const table = rows("ステージとクエストID");
  assert.equal(table.length, storyStages.length, "行数がステージ数と一致しない");
  const constants = { ...prologue, ...chapterTwo };
  for (const [index, [number, name, id, constant, region]] of table.entries()) {
    const stage = storyStages[index],
      quest = allQuests.find((q) => q.id === stage.quest);
    assert.equal(number, stage.number, `${id}: 番号`);
    assert.equal(id, stage.quest, `${number}: クエストID`);
    assert.equal(name, quest.name, `${id}: 表示名`);
    assert.equal(region, quest.region, `${id}: 地域`);
    assert.equal(constants[constant], stage.quest, `${id}: 定数 ${constant}`);
  }
  // The chapter split in the table matches where the first chapter ends.
  assert.ok(table[prologueStages.length - 1][0].startsWith("1-"));
  assert.ok(table[prologueStages.length][0].startsWith("2-"));
});

test("stages carry a number and the quest name, with no second display name", () => {
  for (const stage of storyStages) {
    assert.match(stage.number, /^\d-\d$/, `${stage.quest}: 番号の形`);
    assert.ok(!("label" in stage), `${stage.quest}: label が残っている`);
  }
});

test("the story text says 章 everywhere, never 部", () => {
  const files = [
    "prologue-stories",
    "waterway-stories",
    "tower-finale-stories",
    "chapter-two-stories",
    "chapter-two-delivery-stories",
    "chapter-two-finale-stories",
    "journey",
  ];
  for (const name of files) {
    const source = readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /第[一二三四五]部/, `lib/${name}.ts に「部」が残っている`);
  }
  const places = stories.flatMap((story) => (story.place ? [story.place] : []));
  for (const place of places.filter((text) => text.startsWith("第")))
    assert.match(place, /^第[一二]章 \d-\d · /, `場所表示の形が揃っていない: ${place}`);
});

test("the scene id rule matches the stories and stills that exist", () => {
  const known = new Set(stories.map((story) => story.id));
  for (const { quest } of storyStages)
    for (const chapter of ["departure", "return"])
      assert.ok(known.has(`${quest}-${chapter}`), `${quest}-${chapter} が物語データにない`);
  for (const id of Object.keys(storyArt))
    assert.ok(known.has(id), `スチルのシーンID ${id} に対応する物語がない`);
});

test("the glossary points at files that exist and keeps character ids in one place", () => {
  for (const [, cell] of rows("置き場の対応"))
    for (const file of cell.split("、").map((name) => name.replace(/`/g, "").trim()))
      assert.ok(
        readFileSync(new URL("../" + file, import.meta.url), "utf8").length > 0,
        `${file} が読めない`,
      );
  assert.match(glossary, /\[キャラクター一覧\]\(characters\/README\.md\)/);
  for (const id of ["aria", "leon", "mira"])
    assert.doesNotMatch(glossary, new RegExp(`\\|\\s*\`${id}\`\\s*\\|`), `${id} を写している`);
});
