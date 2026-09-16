import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import * as game from "../lib/game.ts";
import * as prologue from "../lib/prologue.ts";
import * as chapterTwo from "../lib/chapter-two.ts";
import * as navigation from "../lib/quest-navigation.ts";
import * as scenery from "../lib/scenery.ts";

const source =
  readFileSync(new URL("../app/quest-picker.tsx", import.meta.url), "utf8") +
  "\nexport {QuestSummary};";
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
  },
}).outputText;
function nodes(node) {
  return !node || typeof node !== "object"
    ? []
    : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
}
function harness(state, selected = prologue.TRADE_QUEST) {
  let chapter,
    confirmed = [],
    selection = "",
    pointer;
  const exports = {},
    props = {
      state,
      squad: state.squads[0],
      selected,
      ready: true,
      onSelect: (id) => {
        props.selected = id;
      },
      onConfirm: (id) => {
        confirmed.push(id);
      },
      onAutoNextChange: (value) => {
        props.state = game.act(
          props.state,
          { type: "autoNextQuest", value },
          props.state.updatedAt,
        );
      },
    };
  const modules = {
    react: {
      useState: (initial) => [
        (chapter ??= initial()),
        (value) => {
          chapter = value;
        },
      ],
      useRef: (initial) => (pointer ??= { current: initial }),
    },
    "react/jsx-runtime": jsxRuntime,
    "@/lib/chapter-two": chapterTwo,
    "@/lib/game": game,
    "@/lib/prologue": prologue,
    "@/lib/quest-navigation": navigation,
    "@/lib/scenery": scenery,
    "@/lib/original-characters": { originalCharacters: [] },
    "next/image": { default: "img" },
    "lucide-react": { Check: "check", LockKeyhole: "lock" },
    "./sprite": { Sprite: "sprite" },
    "./quest-progression-setting": { QuestProgressionSetting: "setting" },
  };
  vm.runInNewContext(code, {
    exports,
    require: (id) => modules[id],
    window: { getSelection: () => ({ toString: () => selection }) },
  });
  const all = () => nodes(exports.QuestPicker(props));
  return {
    props,
    confirmed,
    all,
    setText: (value) => {
      selection = value;
    },
    button: (id) => all().find((node) => node.type === "button" && node.key === id),
    cards: () => all().filter((node) => node.props?.className === "quest-option"),
    setting: () => all().find((node) => node.type === "setting"),
    summary: () =>
      exports.QuestSummary({
        quest: game.allQuests.find((q) => q.id === props.selected),
        ready: props.ready,
        onConfirm: props.onConfirm,
      }),
  };
}
function chapterTwoState() {
  const s = game.initialPrologueState(1000);
  for (const stage of prologue.prologueStages) {
    s.done[stage.quest] = 1;
    s.story.completed.push(stage.quest);
    s.story.read.push(stage.quest + "-return");
  }
  return s;
}

test("opens the selected destination chapter and filters cards; switching only previews", () => {
  const h = harness(chapterTwoState(), chapterTwo.PICNIC_QUEST);
  assert.equal(h.button("two").props["aria-pressed"], true);
  assert.deepEqual(
    h.cards().map((node) => node.key),
    [chapterTwo.PICNIC_QUEST],
  );
  h.button("one").props.onClick();
  assert.equal(h.cards().length, 9);
  assert.equal(h.props.selected, prologue.TRADE_QUEST);
  assert.equal(h.confirmed.length, 0);
  h.button("two").props.onClick();
  assert.equal(h.props.selected, chapterTwo.PICNIC_QUEST);
  h.button(chapterTwo.PICNIC_QUEST).props.onClick();
  assert.deepEqual(h.confirmed, [chapterTwo.PICNIC_QUEST]);
  const image = nodes(h.cards()[0]).find((node) => node.props?.src);
  assert.equal(
    image.props.src,
    scenery.questScenery(
      {
        id: chapterTwo.PICNIC_QUEST,
        background: game.allQuests.find((q) => q.id === chapterTwo.PICNIC_QUEST).background,
      },
      "thumbnail",
    ),
  );
});

test("locked chapter hides its quests; the switch writes the same persisted preference", () => {
  const h = harness(game.initialPrologueState(1000));
  assert.equal(h.button("two").props.disabled, true);
  assert.equal(h.cards().length, 1);
  assert.equal(h.setting().props.checked, false);
  h.setting().props.onChange(true);
  assert.equal(h.setting().props.checked, true);
  assert.equal(h.props.state.autoNextQuest, true);
  h.props.ready = false;
  assert.equal(h.setting().props.disabled, true);
  assert.equal(h.summary().props.disabled, true);
  h.button(prologue.TRADE_QUEST).props.onClick();
  assert.equal(h.confirmed.length, 0);
});

test("detail confirms on tap and keyboard but not drag, pointer cancellation or text selection", () => {
  const h = harness(game.initialPrologueState(1000));
  let card = h.summary();
  card.props.onPointerDown({ clientX: 10, clientY: 10 });
  card.props.onClick({ detail: 1 });
  assert.deepEqual(h.confirmed, [prologue.TRADE_QUEST]);
  card.props.onPointerDown({ clientX: 10, clientY: 10 });
  card.props.onPointerMove({ clientX: 10, clientY: 60 });
  card.props.onClick({ detail: 1 });
  assert.equal(h.confirmed.length, 1);
  card.props.onPointerDown({ clientX: 10, clientY: 10 });
  card.props.onPointerCancel();
  card.props.onClick({ detail: 1 });
  assert.equal(h.confirmed.length, 1);
  card.props.onClick({ detail: 0 });
  assert.equal(h.confirmed.length, 2);
  h.setText("description");
  card.props.onPointerDown({ clientX: 10, clientY: 10 });
  card.props.onClick({ detail: 1 });
  assert.equal(h.confirmed.length, 2);
  h.setText("");
  h.props.ready = false;
  card = h.summary();
  card.props.onClick({ detail: 0 });
  assert.equal(h.confirmed.length, 2);
});
