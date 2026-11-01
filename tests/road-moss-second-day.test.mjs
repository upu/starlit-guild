import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadX, roadY } from "../lib/road-layout.ts";
import { brekkaLedgerLayout } from "../lib/road-brekka-ledger-layout.ts";
import { mossTrailAssets, mossTrailBackdrop } from "../lib/road-moss-trail.ts";
import { stories } from "../lib/stories.ts";
import { restorationHandoffState } from "../lib/restoration-handoff.ts";
import { restorationVisualInput } from "../lib/restoration-visual-input.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";

const quest = "glowing-moss-trail-next-day";
test("the portrait fork keeps the blue cloth within the crop", () => {
  for (const view of [
    { width: 390, height: 700 },
    { width: 390, height: 844 },
  ]) {
    const centered = brekkaLedgerLayout(view).backdrop;
    const fork = mossTrailBackdrop(centered, view, { fork: true });
    const clothX = fork.x + (70 / 1024) * fork.width;
    assert.ok(clothX > 0 && clothX < view.width);
    assert.ok(fork.x + fork.width >= view.width);
    assert.deepEqual(mossTrailBackdrop(centered, view, { fork: false }), centered);
  }
  const desktop = { width: 936, height: 624 };
  const centered = brekkaLedgerLayout(desktop).backdrop;
  assert.deepEqual(mossTrailBackdrop(centered, desktop, { fork: true }), centered);
});

function start() {
  let state = testState(
    1000,
    storyStages.findIndex((s) => s.quest === quest),
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

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 700 },
])
  test(`four travellers follow the second day's cart in two readable rows at ${view.width}x${view.height}`, () => {
    let state = start();
    const motion = new RoadMotion(),
      backgrounds = new Set(),
      seen = new Set();
    for (let i = 0; state.squads[0].run && i < 9000; i++) {
      const before = JSON.stringify(state);
      const input = {
        squad: state.squads[0],
        startQuest: quest,
        now: state.updatedAt,
        ready: true,
        paused: false,
        storybookHeroes: true,
        backgroundOverride: mossTrailAssets.bank,
      };
      const frame = motion.update(
        chapterRoadFrame(input, false, 1400, view),
        "day-two",
        view.width,
        false,
        view.height,
      );
      assert.equal(JSON.stringify(state), before);
      assert.deepEqual(frame.battle.heroes.map((hero) => hero.id).sort(), [
        "aria",
        "finn",
        "leon",
        "mira",
      ]);
      assert.equal(frame.look.mossTrail.secondDay, true);
      const cart = frame.battle.waterwayActions.props.find(
        (item) => item.id === "trail-basket-cart",
      );
      const cartX = roadX(cart.point.x, frame.battle.distance, view.width);
      const heroes = frame.battle.heroes.map((hero) => ({
        id: hero.id,
        x: roadX(hero.x, frame.battle.distance, view.width),
        y: roadY(hero.lane, view.height, view.width),
      }));
      for (const hero of heroes) assert.ok(hero.x < cartX && hero.x > 0 && hero.x < view.width);
      const size = brekkaLedgerLayout(view).figureSize;
      for (let a = 0; a < heroes.length; a++)
        for (let b = a + 1; b < heroes.length; b++)
          assert.ok(
            Math.abs(heroes[a].x - heroes[b].x) > size * 0.4 ||
              Math.abs(heroes[a].y - heroes[b].y) > size * 0.6,
            `${heroes[a].id} and ${heroes[b].id} remain separately visible`,
          );
      backgrounds.add(frame.look.mossTrail.fork ? "fork" : "brewery");
      seen.add(frame.look.mossTrail.node);
      state = settle(state, state.updatedAt + 100);
    }
    assert.ok(state.done[quest]);
    assert.equal(seen.size, 15);
    assert.deepEqual([...backgrounds], ["brewery", "fork"]);
  });

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 700 },
])
  test(`the second day's actual completion waits for the pursuit at ${view.width}x${view.height}`, () => {
    let state = start(),
      snapshot = state.squads[0],
      identity,
      output,
      after = 0,
      waited = false;
    const motion = new RoadMotion(),
      ending = stories.find((s) => s.id === `${quest}-return`);
    for (let i = 0; i < 9000; i++) {
      if (state.squads[0].run) snapshot = state.squads[0];
      const args = {
        enabled: true,
        quest,
        squad: state.squads[0],
        snapshot,
        ending: state.done[quest] ? ending : null,
        view: "adventure",
        sheet: null,
        ready: true,
        finished: null,
      };
      const handoff = restorationHandoffState(args);
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
      assert.equal(visual.backgroundOverride, mossTrailAssets.bank);
      const frame = chapterRoadFrame(visual, false, 1400, view);
      identity = roadPaintKey(snapshot.id, visual.squad.run, frame.look, identity);
      output = motion.update(frame, identity.key, view.width, false, view.height);
      assert.equal(JSON.stringify(state), before);
      if (state.done[quest]) {
        assert.ok(handoff.waiting && visual.squad.run);
        if (output.look.mossTrail.visualComplete) {
          assert.equal(output.look.mossTrail.fade, 1);
          assert.equal(restorationHandoffState({ ...args, finished: handoff.key }).waiting, false);
          assert.equal(restorationHandoffState({ ...args, snapshot: null }).waiting, false);
          assert.equal(restorationHandoffState({ ...args, view: "memories" }).waiting, false);
          const skipped = restorationVisualInput(base, {
            ...handoff,
            quest,
            squad: handoff.candidate,
            skipped: true,
            dialogue: "pending",
          });
          assert.equal(skipped.squad.run, null);
          assert.equal(skipped.skipVisual, true);
          break;
        }
        waited = true;
        after++;
      } else {
        state = settle(state, state.updatedAt + 50);
        if (state.squads[0].run)
          state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
      }
    }
    assert.ok(waited && state.done[quest] && output.look.mossTrail.visualComplete);
  });
