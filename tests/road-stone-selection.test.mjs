import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { LUNCH_INTERLUDE, chapterThreeWork } from "../lib/chapter-three.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { roadX, roadY } from "../lib/road-layout.ts";
import { housecallsLayout } from "../lib/road-housecalls-layout.ts";
import { stoneSelectionAssets } from "../lib/road-stone-selection.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { storybookWorkAppearance } from "../lib/road-storybook-work.ts";

for (const width of [374, 936])
  test(`stone selection keeps its five stones continuous at ${width}`, () => {
    const height = (width * 2) / 3,
      view = { width, height },
      motion = new RoadMotion();
    let state = act(
        act(testState(1000, 22, 40, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
        { type: "start", id: "matching-lantern-stone", readDeparture: true, value: false },
        1000,
      ),
      identity;
    const nodes = new Set(),
      previous = new Map(),
      poses = new Set();
    let wasSorted = false;
    for (let i = 0; i < 4000; i++) {
      const before = JSON.stringify(state);
      const raw = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: "matching-lantern-stone",
          now: state.updatedAt,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: stoneSelectionAssets.bank,
          questComplete: !!state.done["matching-lantern-stone"],
        },
        false,
        1400,
        view,
      );
      identity = roadPaintKey("selection", state.squads[0].run ?? null, raw.look, identity);
      const { battle, look } = motion.update(raw, identity.key, width, false, height);
      assert.equal(JSON.stringify(state), before);
      assert.equal(look.background, stoneSelectionAssets.bank);
      if (look.work) assert.equal(storybookWorkAppearance(look).frame, "__BASE");
      assert.equal(battle.enemies.length, 0);
      const node = look.stoneSelection.node;
      nodes.add(node);
      if (state.squads[0].run) assert.equal(node, state.squads[0].run.node);
      if (look.work)
        assert.equal(look.work.label, chapterThreeWork("matching-lantern-stone", node).name);
      const scene = battle.waterwayActions;
      assert.equal(scene.actors[0].id, "selection-mason");
      const stones = scene.props.filter((p) => p.id?.startsWith("selection-stone-"));
      const sorted = !!look.stoneSelection.sorted;
      if (sorted !== wasSorted) assert.equal(look.stoneSelection.fade, 1);
      if (sorted && !wasSorted) previous.clear();
      wasSorted = sorted;
      assert.equal(stones.length, sorted ? 3 : 5);
      assert.equal(new Set(stones.map((p) => p.id)).size, stones.length);
      if (sorted) {
        assert.equal(scene.poses.mira.asset, stoneSelectionAssets.miraSeat);
        for (const id of [
          "selection-chair",
          "selection-basket",
          "selection-bag",
          "selection-medicine",
        ])
          assert.ok(
            scene.props.some((p) => p.id === id),
            id,
          );
      }
      for (const p of stones) {
        const point = {
          x: roadX(p.point.x, 0, width),
          y:
            roadY(p.point.lane, height, width) +
            (1 - (p.origin?.y ?? 1)) * 69 * 1.25 * housecallsLayout(view).scale,
        };
        const prior = previous.get(p.id);
        if (prior)
          assert.ok(
            Math.hypot(point.x - prior.x, point.y - prior.y) < width * 0.035,
            `${p.id} jumped`,
          );
        previous.set(p.id, point);
      }
      for (const [hero, pose] of Object.entries(scene.poses)) poses.add(`${hero}:${pose.asset}`);
      if (scene.props.some((p) => p.id === "selection-cloth")) {
        const cloth = scene.props.find((p) => p.id === "selection-cloth");
        const candidate = stones.find((p) => p.id === `selection-stone-${Math.floor(node / 3)}`);
        const scale = housecallsLayout(view).scale;
        assert.equal(scene.poses.aria.asset, stoneSelectionAssets.inspect);
        assert.equal(cloth.origin.y, 0);
        assert.ok(
          Math.abs(roadX(cloth.point.x, 0, width) - roadX(candidate.point.x, 0, width)) <
            ((69 + 35) * scale) / 2,
          "the cloth reaches the candidate",
        );
        assert.ok(
          Math.abs(
            roadY(cloth.point.lane, height, width) - roadY(candidate.point.lane, height, width),
          ) <
            (69 * scale) / 2,
          "the cloth is alongside the stone",
        );
      }
      if (!state.squads[0].run) {
        assert.ok(sorted, "the return tableau must appear before completion");
        assert.equal(look.stoneSelection.fade, 0);
        break;
      }
      state = settle(state, state.updatedAt + 50);
    }
    assert.equal(state.done["matching-lantern-stone"], 1);
    assert.equal(nodes.size, 15);
    assert.ok(wasSorted);
    assert.ok(poses.has(`aria:${stoneSelectionAssets.inspect}`));
    assert.ok(poses.has(`leon:${stoneSelectionAssets.notes}`));
  });

test("selection uses the new yard only by default", () => {
  const state = testState(1000, 22, 40, 10000);
  const input = {
    squad: state.squads[0],
    startQuest: "matching-lantern-stone",
    now: 1000,
    ready: true,
  };
  assert.equal(storybookAdventureInput(input).backgroundOverride, stoneSelectionAssets.bank);
  assert.equal(
    storybookAdventureInput({ ...input, backgroundOverride: "/custom.png" }).backgroundOverride,
    "/custom.png",
  );
  const legacy = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(legacy), legacy);
});

for (const reduced of [false, true])
  test(`rapid assistance reaches the sorted scene before completion, reduced=${String(reduced)}`, () => {
    const view = { width: 374, height: (374 * 2) / 3 },
      motion = new RoadMotion();
    let state = act(
        act(testState(1000, 22, 100, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
        { type: "start", id: "matching-lantern-stone", readDeparture: true, value: false },
        1000,
      ),
      identity;
    for (let i = 0; i < 4000; i++) {
      const raw = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: "matching-lantern-stone",
          now: state.updatedAt,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: stoneSelectionAssets.bank,
          questComplete: !!state.done["matching-lantern-stone"],
        },
        reduced,
        1400,
        view,
      );
      identity = roadPaintKey(
        "selection-assisted",
        state.squads[0].run ?? null,
        raw.look,
        identity,
      );
      const { look } = motion.update(raw, identity.key, view.width, reduced, view.height);
      if (!state.squads[0].run) {
        assert.equal(look.stoneSelection.sorted, true);
        assert.equal(look.stoneSelection.fade, 0);
        break;
      }
      state = settle(state, state.updatedAt + 50);
      if (state.squads[0].run && i % 4 === 0)
        state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
    }
    assert.equal(state.done["matching-lantern-stone"], 1);
  });

test("reduced motion keeps work poses still", () => {
  const view = { width: 374, height: (374 * 2) / 3 },
    motion = new RoadMotion();
  let state = act(
      act(testState(1000, 22, 40, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
      { type: "start", id: "matching-lantern-stone", readDeparture: true, value: false },
      1000,
    ),
    identity,
    sawInspection = false;
  for (let i = 0; i < 1500 && state.squads[0].run; i++) {
    const raw = chapterRoadFrame(
      {
        squad: state.squads[0],
        startQuest: "matching-lantern-stone",
        now: state.updatedAt,
        ready: true,
        storybookHeroes: true,
        backgroundOverride: stoneSelectionAssets.bank,
      },
      true,
      1400,
      view,
    );
    identity = roadPaintKey("selection-reduced", state.squads[0].run, raw.look, identity);
    const { battle } = motion.update(raw, identity.key, view.width, true, view.height);
    assert.ok(battle.heroes.every((hero) => !hero.walking));
    const aria = battle.waterwayActions.poses.aria;
    if (aria?.asset === stoneSelectionAssets.inspect) {
      sawInspection = true;
      assert.equal(aria.frame, 1);
    }
    state = settle(state, state.updatedAt + 50);
  }
  assert.ok(sawInspection);
});
