import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadFigureDepth, roadX, roadY } from "../lib/road-layout.ts";
import { mossBedsLayout } from "../lib/road-moss-beds-layout.ts";
import { mossBedsAssets, mossBedsPhase, mossBedsTarget } from "../lib/road-moss-beds.ts";
import { waterwayAt } from "../lib/road-waterway-contacts.ts";
import { mossBedsBanterCue, chapterFourBanter } from "../lib/chapter-four-banter.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";

const quest = "brekka-moss-beds";
function start() {
  let state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === quest),
    40,
    10000,
  );
  const interlude = pendingInterlude(state);
  if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
  return act(
    state,
    { type: "start", id: quest, readDeparture: true, value: false },
    state.updatedAt,
  );
}

test("the portrait garden matches its original and covers the intended aspect ratio", async () => {
  const source = await readFile("assets/source/storybook/moss-beds-portrait-v1.png");
  const output = await readFile("public/storybook-study/moss-beds-portrait-v1.png");
  assert.deepEqual(output, source);
  const meta = await sharp(output).metadata();
  assert.equal(meta.width, 1024);
  assert.equal(meta.height, 1536);
  for (const view of [
    { width: 390, height: 740 },
    { width: 320, height: 620 },
  ]) {
    const b = mossBedsLayout(view).backdrop;
    assert.ok(b.x <= 0 && b.x + b.width >= view.width);
    assert.ok(b.y <= 0 && b.y + b.height >= view.height);
  }
});

test("displayed water and label dialogue chooses the matching survey", () => {
  assert.equal(mossBedsPhase(8, "water"), 0);
  assert.equal(mossBedsPhase(2, "label"), 1);
  assert.equal(mossBedsPhase(2, "around"), 3);
  assert.equal(mossBedsPhase(2, "other"), 2);
  const run = { quest, phase: "work", node: 0, enemies: [] };
  for (const line of chapterFourBanter(run)) assert.equal(mossBedsBanterCue(line), "water");
  const labels = chapterFourBanter({ ...run, node: 6 });
  for (const line of labels.slice(0, 2)) assert.equal(mossBedsBanterCue(line), "label");
  assert.equal(mossBedsBanterCue(labels[2]), "around");
  assert.equal(mossBedsBanterCue({ speaker: "mira", text: "違う話" }), "other");
});

test("4-6 uses the garden in the normal adventure while respecting comparison choices", () => {
  const state = start(),
    input = { squad: state.squads[0], startQuest: quest, now: 1000, ready: true };
  assert.equal(storybookAdventureInput(input).backgroundOverride, mossBedsAssets.bank);
  const disabled = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(disabled), disabled);
  assert.equal(
    storybookAdventureInput({ ...input, backgroundOverride: "/comparison.png" }).backgroundOverride,
    "/comparison.png",
  );
});

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 740 },
]) {
  test(`Mira walks to the label when its line becomes visible at ${view.width}x${view.height}`, () => {
    const state = start(),
      motion = new RoadMotion(),
      layout = mossBedsLayout(view);
    const input = {
      squad: state.squads[0],
      startQuest: quest,
      ready: true,
      storybookHeroes: true,
      backgroundOverride: mossBedsAssets.bank,
    };
    let walked = false,
      mira;
    for (let i = 0; i < 160; i++) {
      const frame = chapterRoadFrame(
        { ...input, now: state.updatedAt + i * 50, mossBedsDialogue: i < 20 ? "water" : "label" },
        false,
        1400,
        view,
      );
      const drawn = motion.update(frame, "cue", view.width, false, view.height);
      mira = drawn.battle.heroes.find((hero) => hero.id === "mira");
      if (i >= 20 && mira.walking) walked = true;
    }
    assert.ok(walked);
    assert.ok(waterwayAt(mira, layout.world(...mossBedsTarget("mira", 1, layout.portrait)), view));
  });
  test(`Mira circles to read the label on her reply at ${view.width}x${view.height}`, () => {
    const state = start(),
      motion = new RoadMotion(),
      layout = mossBedsLayout(view);
    const input = {
      squad: state.squads[0],
      startQuest: quest,
      ready: true,
      storybookHeroes: true,
      backgroundOverride: mossBedsAssets.bank,
    };
    let walked = false,
      mira;
    for (let i = 0; i < 140; i++) {
      const frame = chapterRoadFrame(
        { ...input, now: state.updatedAt + i * 50, mossBedsDialogue: i < 20 ? "label" : "around" },
        false,
        1400,
        view,
      );
      const drawn = motion.update(frame, "around", view.width, false, view.height);
      mira = drawn.battle.heroes.find((hero) => hero.id === "mira");
      if (i >= 20 && mira.walking) walked = true;
    }
    assert.ok(walked);
    assert.ok(waterwayAt(mira, layout.world(...mossBedsTarget("mira", 3, layout.portrait)), view));
  });
  test(`the three surveyors use the same ground and scale at ${view.width}x${view.height}`, () => {
    let state = start();
    const motion = new RoadMotion(),
      seen = new Set(),
      nodes = new Set();
    assert.deepEqual(state.squads[0].members, ["aria", "leon", "mira"]);
    for (let i = 0; i < 2000 && state.squads[0].run; i++) {
      nodes.add(state.squads[0].run.node);
      const before = JSON.stringify(state);
      const input = {
        squad: state.squads[0],
        startQuest: quest,
        now: state.updatedAt,
        ready: true,
        storybookHeroes: true,
        backgroundOverride: mossBedsAssets.bank,
      };
      const frame = motion.update(
        chapterRoadFrame(input, false, 1400, view),
        "survey",
        view.width,
        false,
        view.height,
      );
      assert.equal(JSON.stringify(state), before);
      assert.equal(frame.look.background, mossBedsAssets.bank);
      assert.ok(frame.battle.waterwayActions.debrisHidden);
      const layout = mossBedsLayout(view);
      for (const hero of frame.battle.heroes) {
        const x = roadX(hero.x, 0, view.width),
          y = roadY(hero.lane, view.height, view.width);
        assert.ok(x > 0 && x < view.width && y > layout.figureSize && y < view.height);
        assert.ok(roadFigureDepth(hero.lane, view, frame.look) > 1);
      }
      for (const id of Object.keys(frame.battle.waterwayActions.poses)) seen.add(id);
      state = settle(state, state.updatedAt + 50);
    }
    assert.deepEqual([...seen].sort(), ["aria", "leon", "mira"]);
    assert.deepEqual(
      [...nodes],
      Array.from({ length: 15 }, (_, i) => i),
    );
    assert.equal(state.squads[0].run, null);
  });
}
