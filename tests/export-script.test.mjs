import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allQuests, heroes } from "../lib/game.ts";
import { originalCharacters } from "../lib/original-characters.ts";
import { storyStages } from "../lib/prologue.ts";
import { stories } from "../lib/stories.ts";
import { storyArt } from "../lib/story-art.ts";
import { renderScript } from "../scripts/export-script.mjs";

test("generated script preserves every scene line and still reveal in stage order", () => {
  const generated = readFileSync(
    new URL("../docs/generated/script.md", import.meta.url),
    "utf8",
  ).replaceAll("\r\n", "\n");
  assert.equal(generated, renderScript());
  assert.match(generated, /自動生成ファイルです。手で編集せず/);

  const names = new Map([...heroes, ...originalCharacters].map(({ id, name }) => [id, name]));
  const sections = generated
    .split(/^### /m)
    .slice(1)
    .map((section) => section.split(/^## /m)[0]);
  const expectedScenes = storyStages.flatMap(({ quest }) => [
    `${quest}-departure`,
    `${quest}-return`,
  ]);
  assert.equal(sections.length, expectedScenes.length);
  assert.equal(stories.length, expectedScenes.length);
  assert.deepEqual(
    [...generated.matchAll(/^## (.+)$/gm)].map((match) => match[1]),
    storyStages.map(
      (stage) => `${stage.number} ${allQuests.find((quest) => quest.id === stage.quest)?.name}`,
    ),
  );

  expectedScenes.forEach((id, sceneIndex) => {
    const scene = stories.find((story) => story.id === id);
    assert.ok(scene, id);
    const section = sections[sceneIndex];
    assert.ok(section.includes(`シーンID：\`${id}\``), id);
    const paragraphs = section
      .split(/\n\n/)
      .map((text) => text.trim())
      .filter(Boolean);
    const actualLines = paragraphs.slice(2);
    const expectedLines = scene.lines.flatMap((line, index) => {
      const art = storyArt[id];
      const still =
        art?.revealAtLine === index
          ? [`> スチル表示（${index + 1}行目）：${art.src} — ${art.alt}`]
          : [];
      const name = line.speaker ? names.get(line.speaker) : undefined;
      return [...still, name ? `${name}：${line.text}` : line.text];
    });
    assert.deepEqual(actualLines, expectedLines, id);
  });
});
