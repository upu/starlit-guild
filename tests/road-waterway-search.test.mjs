import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { waterwaySearchAssets as assets, waterwaySearchFeet } from "../lib/road-waterway-search.ts";
import { waterwayLayout } from "../lib/road-waterway-layout.ts";
import { roadY, roadScale, roadX, roadHeroSize } from "../lib/road-layout.ts";
import { waterwayAt } from "../lib/road-waterway-contacts.ts";
import { restorationVisualInput } from "../lib/restoration-visual-input.ts";
import {
  waterwaySearchReturnPoints,
  WATERWAY_SEARCH_RETURN_SCALE,
} from "../lib/road-waterway-search-return.ts";
import { foundationLayout } from "../lib/road-housecalls-layout.ts";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { RoadWaterwaySearchCompletion } from "../lib/road-waterway-search-completion.ts";

for (const width of [374, 936])
  test(`search follows dry bank with map and no repair crew at ${width}`, () => {
    const view = { width, height: (width * 2) / 3 },
      motion = new RoadMotion(),
      layout = waterwayLayout(width, (width * 2) / 3);
    let state = act(
      testState(0, 6, 40, 10000),
      { type: "start", id: "old-waterway", readDeparture: true, value: false },
      0,
    );
    const sites = new Set(),
      steps = new Set();
    let fighting = false,
      arrived = false;
    for (let time = 0; time < 130000; time += 50) {
      state = settle(state, time);
      const saved = JSON.stringify(state);
      const input = storybookAdventureInput({
        squad: state.squads[0],
        startQuest: "old-waterway",
        questComplete: !!state.done["old-waterway"],
        now: time,
        ready: true,
        paused: false,
      });
      const frame = chapterRoadFrame(input, false, 1400, view);
      assert.equal(frame.look.background, assets.bank);
      assert.equal(frame.look.waterway.phase, "blocked");
      const { battle, look } = motion.update(frame, "search", width, false, view.height),
        scene = battle.waterwayActions;
      assert.ok(!battle.journeyCart);
      assert.ok(!scene.worker);
      assert.equal(scene.actors?.length ?? 0, 0);
      assert.equal(scene.props.length, 0);
      assert.equal(JSON.stringify(state), saved);
      for (const hero of battle.heroes) {
        assert.ok(roadY(hero.lane, view.height, width) < view.height - 2, "feet inside viewport");
        const p = scene.poses[hero.id];
        if (p?.asset === assets.walk) {
          assert.ok(hero.walking);
          steps.add(p.frame);
        }
        if (p?.asset === assets.inspect) {
          assert.equal(p.frame, 1, "inspect without pulling a plant");
          assert.equal(hero.walking, false);
          const feet = waterwaySearchFeet(look.waterway.node);
          assert.ok(waterwayAt(hero, layout.world(feet[0], feet[1]), view));
          sites.add(Math.min(2, Math.floor(look.waterway.node / 5)));
        }
      }
      if (battle.enemies.some((e) => e.hp > 0)) {
        fighting = true;
        assert.deepEqual(scene.poses, {});
        for (const enemy of battle.enemies.filter((e) => e.hp > 0)) {
          const x = roadX(enemy.x, battle.distance, width),
            margin = roadHeroSize(width, view.height) * 0.65;
          assert.ok(x > margin && x < width - margin, "enemy body and name stay inside phone crop");
        }
      }
      if (!state.squads[0].run) {
        arrived = true;
        break;
      }
    }
    assert.ok(arrived && fighting);
    assert.deepEqual([...sites].sort(), [0, 1, 2]);
    assert.equal(steps.size, 4);
    const feet = waterwaySearchFeet(14);
    assert.ok(feet[0] < 1150 && feet[2] < 1200, "searchers stay to dry side of outlet and log");
    assert.ok(roadScale(width) > 0);
  });

for (const [width, height] of [
  [374, 249],
  [936, 624],
  [388, 740],
]) {
  test(`rapid search finishes its inspection before revealing the outlet at ${width}x${height}`, () => {
    const view = { width, height },
      motion = new RoadMotion();
    let state = act(
      testState(1000, 6, 40, 10000),
      { type: "start", id: "old-waterway", readDeparture: true, value: false },
      1000,
    );
    let snapshot,
      sawInspection = false,
      sawBlack = false,
      complete = false,
      waited = false;
    for (let time = 1000; time < 150000; time += 50) {
      if (state.squads[0].run) snapshot = state.squads[0];
      state = settle(state, time);
      if (state.squads[0].run && time % 200 === 0)
        state = act(state, { type: "assist", mode: "strike" }, time);
      const saved = JSON.stringify(state);
      const base = {
        squad: state.squads[0],
        startQuest: "old-waterway",
        now: time,
        ready: true,
        paused: false,
      };
      const handoff = {
        quest: "old-waterway",
        active: true,
        squad: snapshot,
        skipped: false,
        dialogue: "pending",
      };
      const input = storybookAdventureInput(restorationVisualInput(base, handoff));
      const { battle, look } = motion.update(
        chapterRoadFrame(input, false, 1400, view),
        "search-end",
        width,
        false,
        height,
      );
      assert.equal(JSON.stringify(state), saved);
      if (!state.squads[0].run) {
        assert.equal(input.waterwaySearchFinalizing, true);
        waited ||= !battle.waterwaySearchVisualComplete;
        const poses = battle.waterwayActions?.poses;
        sawInspection ||=
          poses?.aria?.asset === assets.inspect && poses?.leon?.asset === assets.notes;
        sawBlack ||= look.waterwaySearchReturn?.fade === 1;
        if (battle.waterwaySearchVisualComplete) {
          complete = true;
          assert.equal(look.background, assets.returnBank);
          assert.equal(look.waterwaySearchReturn.scene, true);
          assert.equal(look.waterwaySearchReturn.fade, 0);
          assert.equal(poses.leon.asset, assets.notes);
          for (const id of ["aria", "leon"]) {
            const hero = battle.heroes.find((h) => h.id === id);
            const point = waterwaySearchReturnPoints[id];
            const target = foundationLayout(view).world(...point);
            assert.ok(
              Math.abs(hero.x - target.x) < 0.01 && Math.abs(hero.lane - target.lane) < 0.01,
            );
          }
          assert.equal(restorationVisualInput(base, { ...handoff, skipped: true }), base);
          break;
        }
      }
    }
    assert.ok(
      waited && sawInspection && sawBlack && complete,
      JSON.stringify({ waited, sawInspection, sawBlack, complete }),
    );
  });
}

test("waterway return positions align with the first dialogue's painted ground", () => {
  const cue = studyCue("old-waterway-return", 0, true);
  assert.ok(Math.abs((192 * 0.9 * WATERWAY_SEARCH_RETURN_SCALE) / 1536 - 0.24 * 0.72) < 0.0001);
  for (const actor of cue.actors) {
    const x = 1536 * (0.14 + (0.72 * actor.x) / 100);
    // The visible foot is 6.25% of the 24%-wide transformed cell above its bottom.
    const y = 1024 * (0.09 + 0.72 * (1 - (actor.bottom ?? 14) / 100)) - 1536 * 0.24 * 0.72 * 0.0625;
    assert.ok(Math.abs(x - waterwaySearchReturnPoints[actor.id][0]) < 1);
    assert.ok(Math.abs(y - waterwaySearchReturnPoints[actor.id][1]) < 1);
  }
});

test("search ending is bounded, preserves a full-black frame, and handles reduced motion or injury", () => {
  const completion = new RoadWaterwaySearchCompletion(),
    view = { width: 936, height: 624 };
  const look = { waterwaySearchFinalizing: true };
  const battle = {
    time: 0,
    heroes: [{ id: "aria", hp: 1, walking: true }],
    waterwayActions: { poses: {} },
  };
  const step = (time, key, reduced = false) => {
    const frame = completion.prepare({ battle: { ...battle, time }, look }, key, view);
    completion.update(frame.battle, frame.look, reduced);
    return frame;
  };
  assert.ok(!step(0, "timeout").battle.waterwaySearchVisualComplete);
  assert.ok(!step(10000, "timeout").battle.waterwaySearchVisualComplete);
  assert.equal(step(11000, "timeout").look.waterwaySearchReturn.fade, 1);
  assert.ok(step(11400, "timeout").battle.waterwaySearchVisualComplete);
  battle.heroes[0].hp = 0;
  assert.ok(!step(0, "injured").battle.waterwaySearchVisualComplete);
  assert.equal(step(400, "injured").look.waterwaySearchReturn.fade, 1);
  assert.ok(step(800, "injured").battle.waterwaySearchVisualComplete);
  assert.ok(!step(0, "reduced", true).battle.waterwaySearchVisualComplete);
  assert.ok(step(50, "reduced", true).battle.waterwaySearchVisualComplete);
});
