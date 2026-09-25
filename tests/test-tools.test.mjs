import * as chapterPresets from "../lib/test-presets.ts";
import * as prologue from "../lib/prologue.ts";
import * as game from "../lib/game.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as jsx from "react/jsx-runtime";
import * as React from "react";

function load(file, modules) {
  const code = ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (id) => {
      assert.ok(id in modules, `Unexpected import ${id}`);
      return modules[id];
    },
  });
  return exports;
}

function loadSavePanel(modules) {
  modules["./save-test-controls"] = load("../app/save-test-controls.tsx", modules);
  modules["./save-records"] = load("../app/save-records.tsx", modules);
  modules["./save-cloud-panel"] = load("../app/save-cloud-panel.tsx", modules);
  modules["./save-panel-tabs"] = load("../app/save-panel-tabs.tsx", modules);
  return load("../app/save-panel.tsx", modules);
}

test("page reads the runtime flag on each request and enables only the exact string true", () => {
  const env = {},
    Game = () => null;
  const { default: Home, dynamic } = load("../app/page.tsx", {
    "cloudflare:workers": { env },
    "./game": { default: Game },
    "react/jsx-runtime": jsx,
  });
  assert.equal(dynamic, "force-dynamic");
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
    const element = Home();
    assert.equal(element.type, Game);
    assert.equal(element.props.testToolsEnabled, value === "true");
  }
});

test("game passes the server capability to local game operations and defaults to disabled", () => {
  let received;
  const { default: Game } = load("../app/game.tsx", {
    react: { useState: () => [false, () => {}] },
    "react/jsx-runtime": jsx,
    "./use-local-game": {
      useLocalGame: (enabled) => {
        received = enabled;
        return {};
      },
    },
    "./phone-game": { PhoneGame: () => null },
    "./start-screen": { StartScreen: () => null },
    "./use-game-viewport": { useGameViewport: () => {} },
  });
  for (const enabled of [undefined, false, true]) {
    Game({ testToolsEnabled: enabled });
    assert.equal(received, enabled === true);
  }
});

// Inspect the actual React element tree without opening a browser or touching storage.
function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (React.isValidElement(node) && typeof node.type === "function")
    return elements(node.type(node.props));
  return React.isValidElement(node) ? [node, ...elements(node.props.children)] : [];
}
test("save panel hides test creation and adjustment when disabled, including existing test profiles", () => {
  const ui = new Proxy({}, { get: (_target, name) => name });
  const modules = {
    react: { useState: (v) => [v, () => {}], useRef: (v) => ({ current: v }) },
    "react/jsx-runtime": jsx,
    "lucide-react": ui,
    sonner: { toast: {} },
    "./music-settings": ui,
    "./quest-progression-setting": ui,
    "@/lib/test-presets": chapterPresets,
    "@/lib/prologue": prologue,
    "@/lib/game": game,
    "@/lib/external-input": {},
  };
  for (const name of ["dialog", "alert-dialog", "select", "tabs", "input", "switch"])
    modules[`@/components/ui/${name}`] = ui;
  const { SavePanel, TestControls } = loadSavePanel(modules);
  for (const enabled of [false, true]) {
    const profile = {
        id: "test",
        test: true,
        name: "test",
        state: { clears: 0, done: {}, xp: { aria: 0 }, gold: 60 },
      },
      calls = [];
    const game = {
      s: profile.state,
      testToolsEnabled: enabled,
      bundle: { active: "test", profiles: [profile] },
      profile,
      createProfile: (v, preset) => calls.push([v, preset]),
    };
    const tree = elements(SavePanel({ game }));
    const buttons = tree.filter(
      (e) =>
        e.type === "button" &&
        elements(e.props.children).some(
          (c) =>
            c.type === "b" && chapterPresets.testPresets.some((p) => p.name === c.props.children),
        ),
    );
    assert.equal(buttons.length, enabled ? 4 : 0);
    if (enabled) {
      for (const button of buttons) button.props.onClick();
      assert.deepEqual(
        calls,
        chapterPresets.testPresets.map((p) => [true, p.id]),
      );
    }
    assert.equal(TestControls({ game, onAdjust: () => {} }) !== null, enabled);
    assert.equal(
      TestControls({ game: { ...game, profile: { ...profile, test: false } }, onAdjust: () => {} }),
      null,
    );
  }
});

test("save panel offers deletion for every record and disables it for the last record", () => {
  const ui = new Proxy({}, { get: (_target, name) => name }),
    calls = [];
  const modules = {
    react: { useState: (v) => [v, () => {}], useRef: (v) => ({ current: v }) },
    "react/jsx-runtime": jsx,
    "lucide-react": ui,
    sonner: { toast: {} },
    "./music-settings": ui,
    "./quest-progression-setting": ui,
    "@/lib/test-presets": chapterPresets,
    "@/lib/prologue": prologue,
    "@/lib/game": game,
    "@/lib/external-input": {},
  };
  for (const name of ["dialog", "alert-dialog", "select", "tabs", "input", "switch"])
    modules[`@/components/ui/${name}`] = ui;
  const { SavePanel } = loadSavePanel(modules);
  const profiles = [
    {
      id: "first",
      test: false,
      name: "最初の冒険",
      state: { clears: 3, done: {}, xp: { aria: 0 }, gold: 60 },
    },
    {
      id: "second",
      test: false,
      name: "読み込んだ冒険",
      state: { clears: 8, done: {}, xp: { aria: 0 }, gold: 60 },
    },
  ];
  const makeGame = (list) => ({
    s: list[0].state,
    testToolsEnabled: false,
    bundle: { active: list[0].id, profiles: list },
    profile: list[0],
    otherTab: false,
    copies: [],
    deleteProfile: (id) => {
      calls.push(id);
      return true;
    },
  });
  const tree = elements(SavePanel({ game: makeGame(profiles), music: {} }));
  const deletes = tree.filter(
    (e) => e.type === "button" && String(e.props["aria-label"] || "").endsWith("を削除"),
  );
  assert.equal(deletes.length, 2);
  assert.ok(deletes.every((button) => button.props.disabled === false));
  const actions = tree.filter(
    (e) => e.type === "AlertDialogAction" && e.props.children === "削除する",
  );
  actions[1].props.onClick();
  assert.deepEqual(calls, ["second"]);
  const only = elements(SavePanel({ game: makeGame(profiles.slice(0, 1)), music: {} })).find(
    (e) => e.type === "button" && String(e.props["aria-label"] || "").endsWith("を削除"),
  );
  assert.equal(only.props.disabled, true);
});

test("test records always follow the story stages", () => {
  const { testState } = game;
  const { storyStages, prologueStages, stageUnlocked, nextStage } = prologue;
  const fresh = testState(1000, 0, 1, 60);
  assert.deepEqual(fresh.story.read, []);
  assert.equal(nextStage(fresh).quest, storyStages[0].quest);

  const firstChapter = testState(1000, prologueStages.length, 8, 5000);
  assert.equal(firstChapter.clears, prologueStages.length);
  assert.equal(stageUnlocked(firstChapter, storyStages[prologueStages.length].quest), true);
  assert.equal(nextStage(firstChapter).quest, storyStages[prologueStages.length].quest);
  assert.ok(!firstChapter.owned.includes("mira"));

  const every = testState(1000, storyStages.length, 20, 20000);
  assert.equal(every.story.read.length, storyStages.length * 2 + 1);
  assert.ok(every.owned.includes("mira"), "2-3を読了するとミラが加入する");
  assert.deepEqual(every.owned, ["aria", "leon", "mira", "finn"], "旧加入の仲間は配られない");
  const earned = storyStages.reduce(
    (total, { quest }) => total + game.allQuests.find((q) => q.id === quest).herbs,
    0,
  );
  assert.equal(every.herbs, earned, "素材は実際のステージ報酬だけを配る");
  assert.equal(every.ore, 0);

  // Counts beyond the story stop at the last stage.
  const beyond = testState(1000, 1000, 20, 20000);
  assert.equal(beyond.clears, storyStages.length);
  assert.deepEqual(beyond.story.read, every.story.read);
});
