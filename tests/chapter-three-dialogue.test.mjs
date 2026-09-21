import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as jsx from "react/jsx-runtime";
import { chapterThreeSections, chapterThreeStories } from "../lib/chapter-three-stories.ts";
import { storySpeakers } from "../lib/story-speakers.ts";
import { expressionPortrait, portraitAtlases } from "../lib/portrait-expressions.ts";
import { stories, availableStories } from "../lib/stories.ts";
import { allQuests, heroes, initialPrologueState } from "../lib/game.ts";
import { renderScripts } from "../scripts/export-script.mjs";

test("draft dialogue is complete, renderable, and stays outside game progression", () => {
  assert.equal(chapterThreeSections.length, 10);
  assert.equal(chapterThreeStories.length, 19);
  assert.equal(new Set(chapterThreeStories.map((scene) => scene.id)).size, 19);
  const state = initialPrologueState(0);
  const before = JSON.stringify(state);
  for (const section of chapterThreeSections.slice(1)) {
    assert.deepEqual(
      section.scenes.map((scene) => scene.chapter),
      ["departure", "return"],
    );
  }
  for (const scene of chapterThreeStories) {
    assert.ok(scene.lines.length > 0);
    assert.equal(scene.quest, undefined);
    assert.ok(!stories.some((live) => live.id === scene.id));
    assert.ok(!allQuests.some((quest) => quest.id === scene.quest));
    for (const line of scene.lines) {
      assert.ok(line.text.trim());
      if (!line.speaker) continue;
      const speaker = storySpeakers.find((entry) => entry.id === line.speaker);
      assert.ok(speaker, line.speaker);
      assert.ok(expressionPortrait(speaker.sprite, line.expression));
      if (line.expression)
        assert.ok(portraitAtlases[line.speaker].expressions.includes(line.expression));
    }
  }
  assert.ok(!heroes.some((hero) => hero.id === "finn"));
  assert.ok(availableStories(state).every((scene) => !scene.id.startsWith("chapter-three-draft-")));
  assert.equal(JSON.stringify(state), before);
});

test("exported draft contains each scene in reading order and names Finn", () => {
  const files = renderScripts();
  const draft = files.get("chapter-three.md");
  assert.match(files.get("script.md"), /\(chapter-three\.md\)/);
  assert.match(draft, /フィン：/);
  let previous = -1;
  for (const scene of chapterThreeStories) {
    const position = draft.indexOf(`シーンID：\`${scene.id}\``);
    assert.ok(position > previous, scene.id);
    previous = position;
    for (const line of scene.lines) assert.ok(draft.includes(line.text));
  }
});

test("direct preview access requires the exact runtime capability, including after disabling it", () => {
  const source = readFileSync(
    new URL("../app/story-preview/chapter-three/page.tsx", import.meta.url),
    "utf8",
  );
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const env = {};
  const modules = {
    "cloudflare:workers": { env },
    "next/navigation": {
      notFound: () => {
        throw new Error("404");
      },
    },
    "@/lib/chapter-three-stories": { chapterThreeSections },
    "./preview": { ChapterThreePreview: "preview" },
    "react/jsx-runtime": jsx,
  };
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (id) => {
      assert.ok(id in modules, id);
      return modules[id];
    },
  });
  assert.equal(exports.dynamic, "force-dynamic");
  for (const value of [
    undefined,
    "",
    "false",
    "TRUE",
    "1",
    " true",
    "true ",
    true,
    "true",
    "false",
  ]) {
    env.ENABLE_TEST_TOOLS = value;
    if (value === "true") assert.equal(exports.default().props.sections, chapterThreeSections);
    else assert.throws(() => exports.default(), /404/);
  }
});
