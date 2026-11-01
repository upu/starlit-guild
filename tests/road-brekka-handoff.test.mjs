import { test } from "node:test";
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
import { BREKKA_VISIT_BANK } from "../lib/road-brekka-ledger.ts";
import { roadHeroSize, roadScale } from "../lib/road-layout.ts";

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 700 },
])
  test(`Brekka's real handoff retains queued investigation at ${view.width}x${view.height}`, () => {
    const quest = "brekka-arrival";
    let state = testState(
      1000,
      storyStages.findIndex((s) => s.quest === quest),
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
    const ending = stories.find((story) => story.id === `${quest}-return`);
    let snapshot = state.squads[0],
      identity,
      last,
      after = 0,
      waited = false,
      wasBrewery = false,
      returnedFromBrewery = false;
    const inspected = new Set(),
      motion = new RoadMotion();
    for (let i = 0; i < 9000; i++) {
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
      const base = {
        squad: state.squads[0],
        startQuest: quest,
        now: state.updatedAt + after * 50,
        ready: true,
        paused: false,
      };
      const visual = storybookAdventureInput(
        restorationVisualInput(base, {
          ...handoff,
          quest,
          squad: handoff.candidate,
          skipped: false,
          dialogue: "pending",
        }),
      );
      const before = JSON.stringify(state);
      assert.equal(visual.backgroundOverride, BREKKA_VISIT_BANK);
      const frame = chapterRoadFrame(visual, false, 1400, view);
      identity = roadPaintKey(snapshot.id, visual.squad.run, frame.look, identity);
      last = motion.update(frame, identity.key, view.width, false, view.height);
      assert.equal(JSON.stringify(state), before, "rendering must not change the saved state");
      assert.equal(
        last.look.destination,
        false,
        "the generic destination sign is not part of the courtyard",
      );
      if (wasBrewery && !last.look.brekkaLedger && last.battle.journeyCart) {
        const mira = last.battle.heroes.find((hero) => hero.id === "mira");
        const dx =
          Math.abs(mira.x - last.battle.journeyCart.x) * roadScale(view.width, last.battle.stage);
        assert.ok(
          dx > roadHeroSize(view.width, view.height) * 0.9,
          "Mira does not reappear behind the cargo",
        );
        returnedFromBrewery = true;
      }
      wasBrewery = !!last.look.brekkaLedger;
      if (
        (last.look.brekkaNotes || last.look.brekkaLedger) &&
        Object.keys(last.battle.waterwayActions.poses).length
      )
        inspected.add(last.look.brekkaJourney.displayNode);
      if (state.done[quest]) {
        assert.ok(handoff.waiting);
        assert.ok(
          visual.squad.run,
          "the last live frame remains available during the visual ending",
        );
        if (last.look.brekkaJourney.visualComplete) break;
        waited = true;
        after++;
      } else {
        state = settle(state, state.updatedAt + 50);
        if (state.squads[0].run)
          state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
      }
    }
    assert.ok(state.done[quest] && waited && last.look.brekkaJourney.visualComplete);
    assert.ok(returnedFromBrewery);
    assert.deepEqual([...inspected], [2, 5, 8, 11, 14]);
    const finished = `${snapshot.id}:${String(snapshot.run.started)}`;
    const handoffBase = {
      enabled: true,
      quest,
      squad: state.squads[0],
      snapshot,
      ending,
      view: "adventure",
      sheet: null,
      ready: true,
      finished,
    };
    assert.equal(restorationHandoffState(handoffBase).waiting, false);
    assert.equal(
      restorationHandoffState({ ...handoffBase, view: "memories", finished: null }).waiting,
      false,
    );
    assert.equal(
      restorationHandoffState({ ...handoffBase, snapshot: null, finished: null }).waiting,
      false,
    );
    const skipped = restorationVisualInput(
      {
        squad: state.squads[0],
        startQuest: quest,
        now: state.updatedAt,
        ready: true,
        paused: false,
      },
      { active: true, quest, squad: snapshot, skipped: true, dialogue: "pending" },
    );
    assert.equal(skipped.squad.run, null);
    assert.equal(skipped.skipVisual, true);
    assert.equal(skipped.questComplete, true);
  });

test("Brekka defaults to the painted view while explicit comparisons remain respected", () => {
  const base = { squad: { run: { quest: "brekka-arrival" } }, startQuest: "brekka-arrival" };
  assert.equal(storybookAdventureInput(base).backgroundOverride, BREKKA_VISIT_BANK);
  const off = { ...base, storybookHeroes: false };
  assert.equal(storybookAdventureInput(off), off);
  assert.equal(
    storybookAdventureInput({ ...base, backgroundOverride: "/comparison.png" }).backgroundOverride,
    "/comparison.png",
  );
});

test("opening a completed Brekka scene without a live handoff stays at the arrival", () => {
  const quest = "brekka-arrival";
  let state = testState(
    1000,
    storyStages.findIndex((s) => s.quest === quest),
    40,
    10000,
  );
  const input = storybookAdventureInput({
    squad: state.squads[0],
    startQuest: quest,
    now: state.updatedAt,
    ready: true,
    paused: false,
    questComplete: true,
  });
  const view = { width: 390, height: 700 },
    motion = new RoadMotion();
  for (let elapsed = 0; elapsed < 6000; elapsed += 50) {
    const frame = chapterRoadFrame({ ...input, now: state.updatedAt + elapsed }, false, 1400, view);
    const result = motion.update(frame, "completed-brekka", view.width, false, view.height);
    assert.equal(result.look.brekkaLedger, undefined);
    assert.equal(result.look.brekkaNotes, undefined);
    assert.equal(result.look.brekkaJourney.arrival, true);
    assert.equal(result.look.brekkaJourney.visualComplete, true);
    assert.ok(result.battle.journeyCart);
  }
});
