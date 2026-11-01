import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { stories } from "../lib/stories.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { restorationHandoffState } from "../lib/restoration-handoff.ts";
import { restorationVisualInput } from "../lib/restoration-visual-input.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { foundingRoadBackground } from "../lib/road-journey-cart.ts";
import { foundingWarehouseBackground } from "../lib/road-founding-arrival.ts";
import { roadX } from "../lib/road-layout.ts";

const quest = "starlit-guild-founding";

function verifyRendererRestart(visual, view) {
  const motion = new RoadMotion();
  const before = JSON.stringify(visual.squad);
  let result;
  for (let tick = 0; tick <= 30; tick++) {
    const frame = chapterRoadFrame({ ...visual, now: visual.now + tick * 100 }, false, 1400, view);
    result = motion.update(frame, "restart", view.width, false, view.height);
    if (result.look.foundingDraft?.visualComplete) break;
  }
  assert.equal(result.look.foundingDraft?.visualComplete, true, "a restarted renderer must finish");
  assert.equal(result.look.background, foundingWarehouseBackground);
  assert.equal(result.battle.journeyCart.cargo.letter, false);
  assert.equal(result.battle.journeyCart.cargo.basket, false);
  assert.equal(JSON.stringify(visual.squad), before);
}

test("the actual adventure selects the founding road while respecting explicit comparison choices", () => {
  const squad = { run: { quest } };
  assert.equal(storybookAdventureInput({ squad }).backgroundOverride, foundingRoadBackground);
  assert.equal(
    storybookAdventureInput({ squad, storybookHeroes: false }).backgroundOverride,
    undefined,
  );
  assert.equal(
    storybookAdventureInput({ squad, backgroundOverride: "/other.png" }).backgroundOverride,
    "/other.png",
  );
});

test("skipping the founding visual releases the handoff without changing the stored squad", () => {
  const squad = { id: "party", run: { quest, started: 1000, node: 14 } };
  const before = JSON.stringify(squad);
  const input = { squad: { ...squad, run: null }, startQuest: quest, ready: true };
  const visual = restorationVisualInput(input, {
    active: true,
    quest,
    squad,
    skipped: true,
    dialogue: "pending",
  });
  assert.equal(visual.squad.run, null);
  assert.equal(visual.questComplete, true);
  assert.equal(visual.skipVisual, true);
  assert.equal(JSON.stringify(squad), before);
  const handoff = restorationHandoffState({
    enabled: true,
    quest,
    squad: input.squad,
    snapshot: squad,
    ending: { quest },
    view: "adventure",
    sheet: null,
    ready: true,
    finished: "party:1000",
  });
  assert.equal(handoff.waiting, false);
});

for (const view of [
  { width: 390, height: 260 },
  { width: 936, height: 624 },
])
  test(`phone completion retains the founding road until the cart reaches the warehouse at ${view.width}px`, () => {
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
    let snapshot = state.squads[0];
    let identity;
    let after = 0;
    let waited = false;
    let switched = false;
    let restarted = false;
    let result;
    const shown = new Set();
    const motion = new RoadMotion();
    const ending = stories.find((story) => story.id === `${quest}-return`);
    for (let i = 0; i < 7000; i++) {
      if (state.squads[0].run) snapshot = state.squads[0];
      const handoff = restorationHandoffState({
        enabled: true,
        quest,
        squad: state.squads[0],
        snapshot,
        ending: state.done[quest] ? ending : null,
        view: "adventure",
        sheet: null,
        ready: true,
        finished: null,
      });
      const input = {
        squad: state.squads[0],
        startQuest: quest,
        now: state.updatedAt + after * 100,
        ready: true,
      };
      const visual = restorationVisualInput(input, {
        ...handoff,
        quest,
        squad: handoff.candidate,
        skipped: false,
        dialogue: "pending",
      });
      const before = JSON.stringify(state);
      const frame = chapterRoadFrame(visual, false, 1400, view);
      identity = roadPaintKey(snapshot.id, visual.squad.run ?? null, frame.look, identity);
      result = motion.update(frame, identity.key, view.width, false, view.height);
      if (result.look.foundingDraft?.arrivalScene && !switched) {
        switched = true;
        assert.equal(result.look.foundingDraft.fade, 1, "change scenes only at full black");
        for (const hero of result.battle.heroes) {
          const x = roadX(hero.x, result.battle.distance, view.width, result.battle.stage);
          assert.ok(x > 0 && x < view.width, `${hero.id} remains in the arrival view`);
        }
      }
      if (result.battle.waterwayActions?.props.some((prop) => prop.id?.startsWith("founding-")))
        shown.add(result.look.foundingDraft?.visualNode);
      assert.equal(JSON.stringify(state), before, "visual handoff must not modify the save");
      if (state.done[quest]) {
        if (!restarted) {
          verifyRendererRestart(visual, view);
          restarted = true;
        }
        assert.ok(handoff.waiting);
        assert.equal(
          visual.squad,
          snapshot,
          "keep the last observed run while visual work finishes",
        );
        assert.equal(visual.backgroundOverride, foundingRoadBackground);
        if (result.look.foundingDraft?.visualComplete) break;
        waited = true;
        after++;
      } else {
        state = settle(state, state.updatedAt + 100);
        if (state.squads[0].run)
          state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
      }
    }
    assert.ok(waited && state.done[quest] && result.look.foundingDraft?.visualComplete);
    assert.ok(shown.has(0), "finish the handoff already in view");
    assert.ok(switched);
    assert.ok(restarted);
    assert.ok(
      after <= 500,
      "accelerated progress does not leave the clear screen waiting for minutes",
    );
    assert.equal(result.battle.journeyCart.cargo.letter, false);
    assert.equal(result.battle.journeyCart.cargo.basket, false);
    assert.equal(result.look.background, foundingWarehouseBackground);
    const released = restorationHandoffState({
      enabled: true,
      quest,
      squad: state.squads[0],
      snapshot,
      ending,
      view: "adventure",
      sheet: null,
      ready: true,
      finished: `${snapshot.id}:${String(snapshot.run.started)}`,
    });
    assert.equal(released.waiting, false, "the completion dialogue opens after visual arrival");
  });
