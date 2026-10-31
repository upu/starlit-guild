import test from "node:test";
import assert from "node:assert/strict";
import * as jsx from "react/jsx-runtime";
import * as stories from "../lib/stories.ts";
import * as consumables from "../lib/consumable-effects.ts";
import * as chapterFour from "../lib/chapter-four-battle-banter.ts";
import * as pumpety from "../lib/pumpety-battle-banter.ts";
import * as chapterThree from "../lib/chapter-three-banter.ts";
import * as town from "../lib/road-town-activity.ts";
import * as restorationMode from "../app/phone-restoration-mode.ts";
import { act, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";

const { AdventureBanter } = evaluateSourceModule(
  compileSourceModule("../app/phone-adventure-banter.tsx", import.meta.url),
  {
    react: { useCallback: (callback) => callback },
    "react/jsx-runtime": jsx,
    "@/lib/stories": stories,
    "@/lib/consumable-effects": consumables,
    "@/lib/chapter-four-battle-banter": chapterFour,
    "@/lib/pumpety-battle-banter": pumpety,
    "@/lib/chapter-three-banter": chapterThree,
    "@/lib/road-town-activity": town,
    "./phone-restoration-mode": restorationMode,
    "./story-scenes": { Banter: "Banter" },
  },
);

function fixture() {
  const quest = "brekka-moss-beds";
  let state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === quest),
    40,
    10000,
  );
  const interlude = pendingInterlude(state);
  if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
  state = act(
    state,
    { type: "start", id: quest, readDeparture: true, value: false },
    state.updatedAt,
  );
  const retained = state.squads[0];
  const model = {
    state,
    squad: { ...retained, run: null },
    run: null,
    ending: stories.stories.find((story) => story.id === quest + "-return"),
    clock: state.updatedAt,
    banter: [{ speaker: "mira", text: "お茶を待ちましょう。" }],
    ready: true,
    game: {},
  };
  const restoration = { active: false, waiting: false, quest, line() {} };
  return { model, restoration, retained };
}

test("a pending return does not start an unrelated camp exchange behind the completion dialog", () => {
  const { model, restoration } = fixture();
  assert.equal(AdventureBanter({ model, restoration }), null);
});

test("normal camp banter is still available after the return has been read", () => {
  const { model, restoration } = fixture();
  const rendered = AdventureBanter({ model: { ...model, ending: null }, restoration });
  assert.equal(rendered.type, "Banter");
  assert.equal(rendered.props.lines, model.banter);
});

test("a retained adventure exchange can finish before the return scene opens", () => {
  const { model, restoration, retained } = fixture();
  const rendered = AdventureBanter({
    model,
    restoration: { ...restoration, active: true, waiting: true, squad: retained },
  });
  assert.equal(rendered.type, "Banter");
  assert.notEqual(rendered.props.lines, model.banter);
  assert.equal(rendered.props.paused, false);
});
