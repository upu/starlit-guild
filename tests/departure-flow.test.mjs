import * as storyParty from "../lib/story-party.ts";
import * as interludes from "../lib/interludes.ts";
import * as navigation from "../lib/quest-navigation.ts";
import * as chapterThree from "../lib/chapter-three.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import * as game from "../lib/game.ts";
import * as story from "../lib/stories.ts";
import * as prologue from "../lib/prologue.ts";
import * as journey from "../lib/journey.ts";
import * as equipment from "../lib/equipment.ts";
import * as techniques from "../lib/techniques.ts";
import { adventureFrame } from "../lib/adventure-presentation.ts";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";

const ui = (...names) => Object.fromEntries(names.map((name) => [name, name]));
const pickerExports = evaluateSourceModule(
  compileSourceModule("../app/quest-picker.tsx", import.meta.url),
  {
    react: { useState: (value) => [typeof value === "function" ? value() : value, () => {}] },
    "@/lib/quest-navigation": navigation,
    "react/jsx-runtime": jsxRuntime,
    "@/lib/story-party": storyParty,
    "@/lib/game": game,
    "@/lib/prologue": prologue,
    "@/lib/scenery": { questScenery: () => "" },
    "next/image": { default: "img" },
    "lucide-react": ui("Check", "LockKeyhole"),
    "./quest-progression-setting": ui("QuestProgressionSetting"),
  },
);
const code = compileSourceModule("../app/phone-game.tsx", import.meta.url),
  frameCode = compileSourceModule("../app/phone-game-frame.tsx", import.meta.url),
  sheetsCode = compileSourceModule("../app/phone-game-sheets.tsx", import.meta.url);
function harness(initialState) {
  const slots = [],
    exports = {};
  let cursor = 0,
    model;
  const api = {
    s: initialState,
    clock: initialState.updatedAt,
    ready: true,
    otherTab: false,
    failAction: null,
    profile: { id: "flow-test" },
    dispatch(action, onSuccess) {
      if (api.failAction === action.type) return false;
      api.s = game.act(api.s, action, api.clock);
      onSuccess?.(api.s);
      return true;
    },
  };
  const modules = {
    "@/lib/interludes": interludes,
    "@/lib/chapter-three": chapterThree,
    "@/lib/techniques": techniques,
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
        return [
          slots[i],
          (value) => {
            slots[i] = typeof value === "function" ? value(slots[i]) : value;
          },
        ];
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "@/lib/game": game,
    "@/lib/stories": story,
    "@/lib/prologue": prologue,
    "@/lib/journey": journey,
    "@/lib/equipment": equipment,
    "next/image": { default: "img" },
    "lucide-react": ui("House", "BookOpen", "ChevronRight", "Heart", "Lightbulb", "Images"),
    "@/components/ui/tabs": ui("Tabs", "TabsList", "TabsTrigger", "TabsContent"),
    "@/components/ui/dialog": ui(
      "Dialog",
      "DialogContent",
      "DialogHeader",
      "DialogTitle",
      "DialogDescription",
    ),
    "@/components/ui/alert-dialog": ui(
      "AlertDialog",
      "AlertDialogContent",
      "AlertDialogHeader",
      "AlertDialogTitle",
      "AlertDialogDescription",
      "AlertDialogFooter",
      "AlertDialogCancel",
      "AlertDialogAction",
    ),
    "@/components/ui/sonner": ui("Toaster"),
    "./equipment-panels": ui("CharacterPanel", "InventoryPanel"),
    "./shop-entry": ui("ShopEntry"),
    "./shop-panel": ui("ShopPanel"),
    "./quest-completion": ui("QuestCompletion"),
    "./map-stage": ui("MapStage"),
    "./story-scenes": ui("Banter", "StoryLibrary", "StoryAlbum", "StoryReader"),
    "./story-heading": ui("StoryHeading"),
    "./sprite": ui("Sprite"),
    "./save-panel": ui("SavePanel"),
    "./install-guide": { useInstallPrompt: () => ({}), InstallGuide: "InstallGuide" },
    "./use-story-advance": { useStoryAdvance: () => ({}) },
    "./use-game-music": { useGameMusic: () => ({}) },
    "./use-journey-hints": { useJourneyHints: () => ({}) },
    "./quest-picker": pickerExports,
  };
  const sheetExports = evaluateSourceModule(sheetsCode, modules);
  modules["./phone-game-sheets"] = sheetExports;
  const frameExports = evaluateSourceModule(frameCode, modules);
  modules["./phone-game-frame"] = frameExports;
  Object.assign(exports, evaluateSourceModule(code, modules), {
    AdventureDestination: frameExports.AdventureDestination,
    collectionSheet: sheetExports.collectionSheet,
  });
  function render() {
    cursor = 0;
    model = exports.PhoneGame({ game: api }).props.model;
    return model;
  }
  function nodes(node) {
    return !node || typeof node !== "object"
      ? []
      : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
  }
  function text(node) {
    return typeof node === "string"
      ? node
      : !node || typeof node !== "object"
        ? ""
        : [node.props?.children].flat(Infinity).map(text).join("");
  }
  function departButton() {
    return nodes(exports.AdventureDestination({ model })).find(
      (node) => node.type === "button" && node.props.children === "出発",
    );
  }
  function guide() {
    return nodes(exports.AdventureDestination({ model })).find(
      (node) => node.props?.role === "status",
    );
  }
  function guideText() {
    return text(guide());
  }
  function questButton(id) {
    const props = exports.collectionSheet(model).content.props;
    return nodes(pickerExports.QuestPicker(props)).find(
      (node) => node.type === "button" && node.key === id,
    );
  }
  render();
  return {
    render,
    api,
    departButton,
    guide,
    guideText,
    questButton,
    get model() {
      return model;
    },
    background() {
      return adventureFrame({
        squad: model.squad,
        startQuest: model.quest.id,
        now: api.clock,
        ready: true,
        paused: !!model.sheet,
      }).background;
    },
  };
}
function afterTrade() {
  let s = game.act(
    game.initialState(1000),
    { type: "start", id: prologue.TRADE_QUEST, readDeparture: true },
    1000,
  );
  s = game.settle(s, 3601000).state;
  return game.act(s, { type: "readStory", id: prologue.TRADE_QUEST + "-return" }, s.updatedAt);
}

test("choosing a destination previews it without departing; the separate button opens its story on that background", () => {
  const s = afterTrade(),
    before = structuredClone(s),
    h = harness(s);
  assert.equal(h.background(), "/scenery/forest-background.webp");
  h.model.openQuests();
  h.render();
  h.model.setCandidateQuest(prologue.RETURN_QUEST);
  h.render();
  // Browsing a candidate does not commit the destination.
  assert.equal(h.background(), "/scenery/forest-background.webp");
  h.model.selectQuest();
  h.render();
  assert.equal(h.model.sheet, null);
  assert.equal(h.model.pendingDeparture, null);
  assert.equal(h.model.run, null);
  assert.equal(h.background(), "/scenery/evening-trade-road-background.webp");
  assert.deepEqual(h.api.s, before);
  const depart = h.departButton();
  assert.ok(depart);
  assert.equal(depart.props.disabled, false);
  depart.props.onClick();
  h.render();
  assert.equal(h.model.reading.id, prologue.RETURN_QUEST + "-departure");
  assert.equal(h.model.sheet, "story");
  assert.equal(h.background(), "/scenery/evening-trade-road-background.webp");
  assert.equal(h.api.s.squads[0].run, null);
  h.model.closeStory();
  h.render();
  assert.deepEqual(h.api.s, before);
  assert.equal(h.background(), "/scenery/evening-trade-road-background.webp");
  h.departButton().props.onClick();
  h.render();
  assert.equal(h.model.finishStory(), true);
  h.model.closeStory();
  h.render();
  assert.equal(h.api.s.squads[0].run.quest, prologue.RETURN_QUEST);
  assert.ok(h.api.s.story.read.includes(prologue.RETURN_QUEST + "-departure"));
  assert.equal(h.departButton(), undefined);
});

test("changing a running destination returns without warning and opens an unseen departure story", () => {
  const s = game.act(
      afterTrade(),
      { type: "start", id: prologue.TRADE_QUEST, readDeparture: true },
      3601000,
    ),
    h = harness(s);
  h.model.openQuests();
  h.render();
  h.questButton(prologue.RETURN_QUEST).props.onClick();
  h.render();
  assert.equal(h.model.sheet, "quests");
  assert.equal(h.model.candidateQuest, prologue.RETURN_QUEST);
  assert.equal(h.api.s.squads[0].run.quest, prologue.TRADE_QUEST);
  h.questButton(prologue.RETURN_QUEST).props.onClick();
  h.render();
  assert.equal(h.model.returnIntent, null);
  assert.equal(h.model.sheet, "story");
  assert.equal(h.model.run, null);
  assert.equal(h.model.pendingDeparture.id, prologue.RETURN_QUEST);
  assert.equal(h.background(), "/scenery/evening-trade-road-background.webp");
  assert.equal(h.api.s.gold, s.gold);
  h.model.finishStory();
  h.model.closeStory();
  h.render();
  assert.equal(h.model.sheet, null);
  assert.equal(h.model.run.quest, prologue.RETURN_QUEST);
  assert.equal(h.model.squad.repeat, false);
});

test("two consecutive taps on another quest restart a visited destination and preserve earned rewards", () => {
  const s = game.act(
      afterTrade(),
      { type: "start", id: prologue.RETURN_QUEST, readDeparture: true },
      3601000,
    ),
    h = harness(s);
  h.model.openQuests();
  h.render();
  h.questButton(prologue.TRADE_QUEST).props.onClick();
  h.render();
  assert.equal(h.model.run.quest, prologue.RETURN_QUEST);
  h.questButton(prologue.TRADE_QUEST).props.onClick();
  h.render();
  assert.equal(h.model.sheet, null);
  assert.equal(h.model.returnIntent, null);
  assert.equal(h.model.pendingDeparture, null);
  assert.equal(h.model.run.quest, prologue.TRADE_QUEST);
  assert.equal(h.model.run.node, 0);
  assert.equal(h.api.s.gold, s.gold);
  assert.deepEqual(h.api.s.done, s.done);
  assert.equal(h.departButton(), undefined);
});

test("retapping the active quest closes the picker without restarting the run", () => {
  const s = game.act(
      afterTrade(),
      { type: "start", id: prologue.TRADE_QUEST, readDeparture: true },
      3601000,
    ),
    h = harness(s);
  h.model.openQuests();
  h.render();
  h.questButton(prologue.TRADE_QUEST).props.onClick();
  h.render();
  assert.equal(h.model.sheet, null);
  assert.deepEqual(h.api.s, s);
});

test("picker controls respect inactive tabs and a failed return leaves the picker and run intact", () => {
  const s = game.act(
      afterTrade(),
      { type: "start", id: prologue.TRADE_QUEST, readDeparture: true },
      3601000,
    ),
    h = harness(s);
  h.model.openQuests(prologue.RETURN_QUEST);
  h.render();
  h.api.otherTab = true;
  h.render();
  assert.equal(h.questButton(prologue.RETURN_QUEST).props.disabled, true);
  h.questButton(prologue.RETURN_QUEST).props.onClick();
  h.render();
  assert.deepEqual(h.api.s, s);
  assert.equal(h.model.sheet, "quests");
  h.api.otherTab = false;
  h.api.failAction = "stop";
  h.render();
  h.questButton(prologue.RETURN_QUEST).props.onClick();
  h.render();
  assert.deepEqual(h.api.s, s);
  assert.equal(h.model.sheet, "quests");
  assert.equal(h.model.returnIntent, null);
});

test("fresh profiles are guided from choosing a quest to departing without changing their save early", () => {
  const s = game.initialState(1000),
    h = harness(s);
  assert.equal(h.departButton(), undefined);
  assert.match(h.guideText(), /クエスト.*行き先を選ぼう/);
  assert.deepEqual(h.api.s, s);
  h.model.openQuests();
  h.render();
  assert.equal(h.guide(), undefined);
  h.questButton(prologue.TRADE_QUEST).props.onClick();
  h.render();
  assert.ok(h.departButton());
  assert.match(h.guideText(), /出発.*冒険開始/);
  assert.deepEqual(h.api.s, s);
  h.api.otherTab = true;
  h.render();
  assert.equal(h.departButton().props.disabled, true);
  h.api.otherTab = false;
  h.render();
  h.departButton().props.onClick();
  h.render();
  assert.equal(h.model.sheet, "story");
  assert.equal(h.model.reading.id, prologue.TRADE_QUEST + "-departure");
  assert.deepEqual(h.api.s, s);
  h.model.finishStory();
  h.model.closeStory();
  h.render();
  assert.equal(h.model.run.quest, prologue.TRADE_QUEST);
});
test("idle dialogue has six complete, distinct exchanges and never changes the save", () => {
  const s = game.initialState(1000),
    before = structuredClone(s),
    exchanges = [];
  for (let i = 0; i < 6; i++) {
    const lines = story.journeyBanter(s, s.squads[0], i * 30000);
    assert.ok(lines.length >= 2);
    assert.ok(lines.every((line) => ["aria", "leon"].includes(line.speaker)));
    assert.deepEqual(story.journeyBanter(s, s.squads[0], i * 30000 + 29999), lines);
    exchanges.push(JSON.stringify(lines));
  }
  assert.equal(new Set(exchanges).size, 6);
  assert.equal(JSON.stringify(story.journeyBanter(s, s.squads[0], 180000)), exchanges[0]);
  assert.deepEqual(s, before);
});

test("interlude waits for quest selection and departure, remains after cancel and vanishes only on finishing", () => {
  for (const autoNextQuest of [false, true]) {
    const s = game.testState(1000, 18, 17, 5000);
    s.autoNextQuest = autoNextQuest;
    const h = harness(s),
      id = chapterThree.LUNCH_INTERLUDE;
    assert.equal(h.model.ending, null);
    assert.equal(h.model.reading, null);
    assert.ok(game.availableQuests(s).some((q) => q.id === id));
    h.model.selectQuest(id);
    h.render();
    h.departButton().props.onClick();
    h.render();
    assert.equal(h.model.reading.id, id);
    assert.equal(h.api.s.squads[0].run, null);
    h.model.closeStory();
    h.render();
    assert.deepEqual(h.api.s, s);
    h.departButton().props.onClick();
    h.render();
    h.model.finishStory();
    h.model.closeStory();
    h.render();
    assert.ok(h.api.s.story.read.includes(id));
    assert.equal(h.model.quest.id, chapterThree.BERNE_QUEST);
    assert.equal(harness(h.api.s).model.quest.id, chapterThree.BERNE_QUEST);
    assert.equal(h.model.run, null);
    assert.equal(h.api.s.gold, s.gold);
    assert.deepEqual(h.api.s.xp, s.xp);
    assert.deepEqual(h.api.s.done, s.done);
    assert.ok(!game.availableQuests(h.api.s).some((q) => q.id === id));
  }
});

test("reading the first ending replaces a previous UI choice with the saved next destination without departing", () => {
  let s = game.act(game.initialState(1000), { type: "autoNextQuest", value: true }, 1000);
  s = game.settle(
    game.act(s, { type: "start", id: prologue.TRADE_QUEST, readDeparture: true }, 1000),
    3601000,
  ).state;
  const h = harness(s);
  h.model.selectQuest(prologue.TRADE_QUEST);
  h.render();
  h.api.failAction = "readStory";
  assert.equal(h.model.readStory(prologue.TRADE_QUEST + "-return"), false);
  h.render();
  assert.equal(h.model.quest.id, prologue.TRADE_QUEST);
  h.api.failAction = null;
  assert.equal(h.model.readStory(prologue.TRADE_QUEST + "-return"), true);
  h.render();
  assert.equal(h.model.quest.id, prologue.RETURN_QUEST);
  assert.equal(h.api.s.squads[0].lastQuest, prologue.RETURN_QUEST);
  assert.equal(h.model.run, null);
  assert.equal(harness(h.api.s).model.quest.id, prologue.RETURN_QUEST);
});
