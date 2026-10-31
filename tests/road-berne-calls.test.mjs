import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { LUNCH_INTERLUDE, chapterThreeWork } from "../lib/chapter-three.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { berneCallsAssets } from "../lib/road-berne-calls.ts";
import { roadX, roadY } from "../lib/road-layout.ts";
import { housecallsLayout } from "../lib/road-housecalls-layout.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";

for (const width of [374, 936])
  test(`Berne visits deliver, prepare water and inspect paving at ${width}`, () => {
    const height = (width * 2) / 3,
      view = { width, height },
      motion = new RoadMotion(),
      nodes = new Set(),
      strides = new Set();
    let state = testState(1000, 19, 24, 10000),
      identity,
      residentLocations,
      finishedStanding = false;
    state = act(state, { type: "readStory", id: LUNCH_INTERLUDE }, 1000);
    state = act(
      state,
      { type: "start", id: "berne-house-calls", readDeparture: true, value: false },
      1000,
    );
    assert.ok(state.squads[0].run, "test quest must actually start");
    assert.deepEqual(state.squads[0].members, ["aria", "leon", "mira", "finn"]);
    for (let i = 0; i < 5000; i++) {
      const before = JSON.stringify(state);
      const raw = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: "berne-house-calls",
          now: state.updatedAt,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: berneCallsAssets.bank,
          questComplete: !!state.done["berne-house-calls"],
        },
        false,
        1400,
        view,
      );
      identity = roadPaintKey("berne-calls", state.squads[0].run ?? null, raw.look, identity);
      const { battle, look } = motion.update(raw, identity.key, width, false, height);
      assert.equal(JSON.stringify(state), before);
      assert.equal(battle.distance, 0);
      assert.equal(battle.enemies.length, 0);
      assert.equal(battle.journeyCart, undefined);
      assert.equal(look.puller, null);
      nodes.add(look.berneCalls.node);
      assert.deepEqual(
        battle.waterwayActions.actors.map((actor) => actor.id),
        ["berne-resident-1", "berne-resident-2"],
      );
      const locations = battle.waterwayActions.actors.map((actor) => actor.point);
      if (residentLocations)
        assert.deepEqual(locations, residentLocations, "residents stay at their own doors");
      else residentLocations = locations;
      if (look.work)
        assert.equal(
          look.work.label,
          chapterThreeWork("berne-house-calls", look.berneCalls.node).name,
        );
      const finn = battle.heroes.find((h) => h.id === "finn"),
        pose = battle.waterwayActions.poses.finn;
      const prop = battle.waterwayActions.props.find((p) => p.id === "berne-delivery");
      if (prop) assert.ok(prop.depth > finn.lane, "carried item must be drawn in front of Finn");
      if (finn.walking && pose && pose.frame >= 4) strides.add(pose.frame);
      const l = housecallsLayout(view);
      for (const h of battle.heroes) {
        const x = roadX(h.x, 0, width),
          y = roadY(h.lane, height, width);
        assert.ok(x > l.figureSize * 0.3 && x < width - l.figureSize * 0.3, `${h.id} side clip`);
        assert.ok(y > l.figureSize && y < height - 5, `${h.id} vertical clip`);
        const sx = (x - l.backdrop.x) / l.scale,
          sy = (y - l.backdrop.y) / l.scale;
        assert.ok(!(sx > 930 && sx < 1150 && sy > 425 && sy < 485), `${h.id} crosses table legs`);
        assert.ok(!(sx > 110 && sx < 310 && sy > 560 && sy < 670), `${h.id} crosses the well`);
      }
      if (!state.squads[0].run && look.berneCalls.node === 14 && !battle.waterwayActions.poses.aria)
        finishedStanding = true;
      if (!state.squads[0].run && look.berneCalls.node === 14 && i > 3000) break;
      state = settle(state, state.updatedAt + 50);
    }
    assert.equal(state.done["berne-house-calls"], 1);
    assert.ok(finishedStanding, "Aria stands after the final paving inspection");
    assert.deepEqual(
      [...nodes],
      Array.from({ length: 15 }, (_, i) => i),
    );
    assert.deepEqual([...strides].sort(), [4, 5, 6, 7]);
  });

test("comparison or custom backgrounds do not activate the fixed Berne visit", () => {
  const s = testState(1000, 19, 24, 10000);
  for (const extra of [
    { storybookHeroes: false, backgroundOverride: berneCallsAssets.bank },
    { storybookHeroes: true, backgroundOverride: "/custom.png" },
  ]) {
    const frame = chapterRoadFrame({
      squad: s.squads[0],
      startQuest: "berne-house-calls",
      now: 1000,
      ready: true,
      ...extra,
    });
    assert.equal(frame.look.berneCalls, undefined);
  }
});

test("Berne house calls use the reviewed street by default while preserving comparison", () => {
  const s = testState(1000, 19, 24, 10000);
  const input = { squad: s.squads[0], startQuest: "berne-house-calls", now: 1000, ready: true };
  const result = storybookAdventureInput(input);
  assert.equal(result.backgroundOverride, berneCallsAssets.bank);
  assert.equal(result.storybookHeroes, true);
  assert.equal(result.squad, input.squad);
  const off = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(off), off);
});
