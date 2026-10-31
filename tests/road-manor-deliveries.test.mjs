import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { LUNCH_INTERLUDE, chapterThreeWork } from "../lib/chapter-three.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { manorDeliveryAssets } from "../lib/road-manor-deliveries.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { housecallsLayout, manorDeliveryLayout } from "../lib/road-housecalls-layout.ts";
import { housecallPalm } from "../lib/road-housecalls-contacts.ts";
import { roadHeroSize, roadScale, roadX, roadY } from "../lib/road-layout.ts";

for (const [width, height] of [
  [374, (374 * 2) / 3],
  [936, 624],
  [388, 740],
])
  test(`manor deliveries preserve people, packages and all fifteen steps at ${width}x${height}`, () => {
    const view = { width, height },
      motion = new RoadMotion();
    const nodes = new Set(),
      activeAssets = new Set(),
      carrying = new Set(),
      delivered = new Set();
    let state = act(
        act(
          testState(1000, 21, height > width ? 40 : 24, 10000),
          { type: "readStory", id: LUNCH_INTERLUDE },
          1000,
        ),
        { type: "start", id: "riverside-manor", readDeparture: true, value: false },
        1000,
      ),
      identity,
      previousActive,
      previousGarden = false,
      sawGarden = false;
    for (let i = 0; i < 5000; i++) {
      const before = JSON.stringify(state),
        raw = chapterRoadFrame(
          {
            squad: state.squads[0],
            startQuest: "riverside-manor",
            now: state.updatedAt,
            ready: true,
            storybookHeroes: true,
            backgroundOverride: manorDeliveryAssets.bank,
            questComplete: !!state.done["riverside-manor"],
          },
          false,
          1400,
          view,
        );
      identity = roadPaintKey("manor", state.squads[0].run ?? null, raw.look, identity);
      const { battle, look } = motion.update(raw, identity.key, width, false, height),
        scene = battle.waterwayActions,
        layout = manorDeliveryLayout(view);
      assert.equal(JSON.stringify(state), before);
      const garden = !!look.manorDelivery.garden;
      assert.equal(look.background, garden ? manorDeliveryAssets.garden : manorDeliveryAssets.bank);
      assert.equal(battle.distance, 0);
      assert.equal(battle.enemies.length, 0);
      if (garden) {
        sawGarden = true;
        assert.deepEqual(
          scene.actors.map((a) => a.id),
          ["manor-owner", "manor-gardener"],
        );
        assert.deepEqual(
          scene.props.map((p) => p.id),
          [
            "manor-display-table",
            "manor-display-covered",
            "manor-basket",
            "manor-bag",
            "manor-medicine",
            "manor-copy",
          ],
        );
        assert.ok(scene.props[1].depth > scene.props[0].depth);
      } else assert.equal(scene.actors[0].id, "manor-cook");
      for (const actor of scene.actors) {
        const x = roadX(actor.point.x, 0, width);
        const y = roadY(actor.point.lane, height, width);
        assert.ok(x > layout.figureSize * 0.25 && x < width - layout.figureSize * 0.25);
        assert.ok(y > layout.figureSize && y < height - 5);
      }
      if (garden !== previousGarden)
        assert.equal(look.manorDelivery.fade, 1, "location switches under the fade");
      previousGarden = garden;
      if (!state.squads[0].run) {
        assert.ok(garden, "the completion dialog must not interrupt the move to the garden");
        assert.equal(
          look.manorDelivery.fade,
          0,
          "the garden is visible before the completion dialog",
        );
      }
      if (state.squads[0].run)
        assert.equal(
          look.manorDelivery.node,
          state.squads[0].run.node,
          "visible task must match progress",
        );
      nodes.add(look.manorDelivery.node);
      if (look.work)
        assert.equal(
          look.work.label,
          chapterThreeWork("riverside-manor", look.manorDelivery.node).name,
        );
      const active = scene.props.filter((p) => p.id === "manor-active");
      assert.ok(active.length <= 1);
      if (active[0]) {
        activeAssets.add(active[0].asset);
        const isPot = active[0].asset === manorDeliveryAssets.pot;
        assert.ok(
          Math.abs(
            active[0].size * roadHeroSize(width, height) - (isPot ? 55 : 65) * layout.scale,
          ) < 0.01,
          "cargo and courtyard share the camera scale",
        );
        const hero = battle.heroes.find((h) => h.id === (isPot ? "aria" : "leon"));
        const pose = hero && scene.poses[hero.id];
        if (
          hero?.walking &&
          pose &&
          (isPot ? pose.frame >= 4 : pose.asset === manorDeliveryAssets.leonWalk)
        ) {
          const stride = isPot ? pose.frame - 4 : pose.frame;
          const palm = housecallPalm(hero, view, stride, layout.figureSize);
          const dx = (active[0].point.x - palm.x) * roadScale(width);
          const dy = roadY(active[0].point.lane, height, width) - roadY(palm.lane, height, width);
          assert.ok(
            Math.hypot(dx, dy) < 0.01,
            "carried cargo follows the hand at every camera scale",
          );
          carrying.add(hero.id);
        }
      }
      if (previousActive && !active.length) {
        const placed = scene.props.find((p) => p.id === `manor-delivered-${previousActive.node}`);
        assert.ok(placed, "the delivered item remains visible");
        assert.equal(placed.asset, previousActive.asset);
        assert.ok(Math.abs(placed.point.x - previousActive.point.x) < 0.01);
        assert.ok(Math.abs(placed.point.lane - previousActive.point.lane) < 0.01);
      }
      previousActive = active[0] ? { ...active[0], node: look.manorDelivery.node } : undefined;
      const ids = scene.props.filter((p) => p.id?.startsWith("manor-delivered-")).map((p) => p.id);
      assert.equal(new Set(ids).size, ids.length);
      for (const id of ids) delivered.add(id);
      for (const h of battle.heroes) {
        const x = roadX(h.x, 0, width),
          y = roadY(h.lane, height, width);
        assert.ok(
          x > layout.figureSize * 0.3 && x < width - layout.figureSize * 0.3,
          `${h.id} side clip`,
        );
        assert.ok(y > layout.figureSize && y < height - 5, `${h.id} vertical clip`);
        if (!garden) {
          const cook = scene.actors[0].point;
          const dx = Math.abs(x - roadX(cook.x, 0, width));
          const dy = Math.abs(y - roadY(cook.lane, height, width));
          assert.ok(
            dx >= 36 * layout.scale || dy >= 36 * layout.scale,
            `${h.id} overlaps the cook`,
          );
        }
      }
      if (!state.squads[0].run && look.manorDelivery.node === 14 && delivered.size === 10) break;
      state = settle(state, state.updatedAt + 50);
    }
    assert.equal(state.done["riverside-manor"], 1);
    assert.deepEqual(
      [...nodes],
      Array.from({ length: 15 }, (_, i) => i),
    );
    assert.deepEqual(
      [...activeAssets].sort(),
      [manorDeliveryAssets.parcel, manorDeliveryAssets.pot].sort(),
    );
    assert.equal(delivered.size, 10);
    assert.deepEqual([...carrying].sort(), ["aria", "leon"]);
    assert.ok(sawGarden);
  });

test("manor uses the painted default while honoring comparison choices", () => {
  const state = testState(1000, 21, 24, 10000),
    input = { squad: state.squads[0], startQuest: "riverside-manor", now: 1000, ready: true };
  assert.equal(storybookAdventureInput(input).backgroundOverride, manorDeliveryAssets.bank);
  const off = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(off), off);
  assert.equal(
    storybookAdventureInput({ ...input, backgroundOverride: "/custom.png" }).backgroundOverride,
    "/custom.png",
  );
});

test("the courtyard camera approaches smoothly on tall screens and keeps the landscape framing", () => {
  const width = 388;
  const landscape = { width, height: 260 };
  assert.equal(manorDeliveryLayout(landscape).scale, housecallsLayout(landscape).scale);
  let previous = manorDeliveryLayout({ width, height: width }).scale;
  for (const height of [400, 430, 470, 520, 740]) {
    const view = { width, height };
    const layout = manorDeliveryLayout(view);
    assert.ok(layout.scale >= previous);
    assert.ok(layout.scale <= housecallsLayout(view).scale * 1.25 + 0.001);
    previous = layout.scale;
  }
});

test("repeated assistance does not finish before the garden is visible", () => {
  const view = { width: 374, height: (374 * 2) / 3 },
    motion = new RoadMotion();
  let state = act(
      act(testState(1000, 21, 24, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
      { type: "start", id: "riverside-manor", readDeparture: true, value: false },
      1000,
    ),
    identity;
  for (let i = 0; i < 4000; i++) {
    const raw = chapterRoadFrame(
      {
        squad: state.squads[0],
        startQuest: "riverside-manor",
        now: state.updatedAt,
        ready: true,
        storybookHeroes: true,
        backgroundOverride: manorDeliveryAssets.bank,
        questComplete: !!state.done["riverside-manor"],
      },
      false,
      1400,
      view,
    );
    identity = roadPaintKey("manor-assist", state.squads[0].run ?? null, raw.look, identity);
    const { look } = motion.update(raw, identity.key, view.width, false, view.height);
    if (!state.squads[0].run) {
      assert.equal(look.manorDelivery.garden, true);
      assert.equal(look.manorDelivery.fade, 0);
      break;
    }
    assert.equal(look.manorDelivery.node, state.squads[0].run.node);
    state = settle(state, state.updatedAt + 50);
    if (state.squads[0].run && i % 4 === 0)
      state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
  }
  assert.equal(state.done["riverside-manor"], 1);
});

test("reduced motion keeps carrying poses still", () => {
  const view = { width: 374, height: (374 * 2) / 3 },
    motion = new RoadMotion();
  let state = act(
      act(testState(1000, 21, 24, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
      { type: "start", id: "riverside-manor", readDeparture: true, value: false },
      1000,
    ),
    identity,
    sawPot = false;
  for (let i = 0; i < 2500; i++) {
    const raw = chapterRoadFrame(
      {
        squad: state.squads[0],
        startQuest: "riverside-manor",
        now: state.updatedAt,
        ready: true,
        storybookHeroes: true,
        backgroundOverride: manorDeliveryAssets.bank,
        questComplete: !!state.done["riverside-manor"],
      },
      true,
      1400,
      view,
    );
    identity = roadPaintKey("manor-reduced", state.squads[0].run ?? null, raw.look, identity);
    const { battle } = motion.update(raw, identity.key, view.width, true, view.height);
    const potPose = battle.waterwayActions.poses.aria;
    if (potPose?.asset === manorDeliveryAssets.ariaCarry) {
      sawPot = true;
      assert.equal(potPose.frame, 0);
    }
    state = settle(state, state.updatedAt + 50);
  }
  assert.ok(sawPot);
});
