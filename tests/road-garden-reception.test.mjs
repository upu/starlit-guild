import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { LUNCH_INTERLUDE } from "../lib/chapter-three.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { gardenReceptionAssets } from "../lib/road-garden-reception.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { roadDepth, roadScale } from "../lib/road-layout.ts";
import { housecallsLayout } from "../lib/road-housecalls-layout.ts";
import { readFile } from "node:fs/promises";

test("cart strides use the four upright poses, not the crouching poses", async () => {
  const metrics = JSON.parse(
    await readFile("public/storybook-study/finn-push-balanced-v2-metrics.json", "utf8"),
  );
  for (const pose of metrics.slice(2, 6)) assert.ok(pose.height >= 140);
  assert.ok(metrics[6].height < 140 && metrics[7].height < 140);
});

for (const width of [374, 936])
  test(`reception keeps the same cargo on Finn's cart at ${width}`, () => {
    const view = { width, height: (width * 2) / 3 },
      motion = new RoadMotion();
    let state = act(
      act(testState(1000, 24, 40, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
      { type: "start", id: "garden-reception", readDeparture: true, value: false },
      1000,
    );
    let identity,
      previousArrived = false,
      moving = 0,
      final = false;
    const nodes = new Set(),
      strides = new Set();
    for (let i = 0; i < 4000; i++) {
      const before = JSON.stringify(state);
      const input = storybookAdventureInput({
        squad: state.squads[0],
        startQuest: "garden-reception",
        now: state.updatedAt,
        ready: true,
        storybookHeroes: true,
        questComplete: !!state.done["garden-reception"],
      });
      const raw = chapterRoadFrame(input, false, 1400, view);
      identity = roadPaintKey("reception", state.squads[0].run ?? null, raw.look, identity);
      const { battle, look } = motion.update(raw, identity.key, width, false, view.height);
      assert.equal(JSON.stringify(state), before);
      const site = look.gardenReception,
        scene = battle.waterwayActions;
      nodes.add(site.node);
      if (state.squads[0].run) assert.equal(site.node, state.squads[0].run.node);
      const cart = scene.props.find((p) => p.id === "reception-cart");
      assert.ok(cart);
      for (const id of ["aria", "leon"]) {
        if (battle.heroes.find((h) => h.id === id)?.walking)
          assert.equal(scene.poses[id], undefined, `${id} must walk to the work position`);
      }
      const l = housecallsLayout(view);
      for (const [id, dx, dy] of [
        ["replacement-parcel", -33, -96],
        ["cart-pot-0", -77, -118],
        ["cart-pot-1", 22, -81],
      ]) {
        const prop = scene.props.find((p) => p.id === id);
        assert.ok(prop, `${id} remains visible`);
        assert.ok(Math.abs((prop.point.x - cart.point.x) * roadScale(width) - dx * l.scale) < 0.01);
        assert.ok(
          Math.abs(
            (prop.point.lane - cart.point.lane) * roadDepth(width, view.height) - dy * l.scale,
          ) < 0.01,
        );
      }
      if (site.arrived !== previousArrived) assert.equal(site.fade, 1);
      previousArrived = site.arrived;
      if (site.arrived) {
        assert.equal(look.background, gardenReceptionAssets.destination);
        const table = scene.props.find((p) => p.id === "display-table");
        const cover = scene.props.find((p) => p.id === "display-covered");
        assert.ok(cover.depth > table.depth);
        assert.equal(scene.actors[0].id, "reception-servant");
      } else {
        const finn = battle.heroes.find((h) => h.id === "finn"),
          pose = scene.poses.finn;
        if (finn.walking && pose?.asset === gardenReceptionAssets.push) {
          moving++;
          strides.add(pose.frame);
          assert.ok(pose.frame >= 2 && pose.frame <= 5, "pushing must stay upright");
          assert.ok(Math.abs((finn.x - cart.point.x) * roadScale(width) - 139 * l.scale) < 0.02);
          assert.ok(
            Math.abs((finn.lane - cart.point.lane) * roadDepth(width, view.height) - 30 * l.scale) <
              0.02,
          );
        }
      }
      if (!state.squads[0].run) {
        final = site.arrived && site.fade === 0;
        break;
      }
      state = settle(state, state.updatedAt + 50);
    }
    assert.equal(state.done["garden-reception"], 1);
    assert.equal(nodes.size, 15);
    assert.ok(moving > 0 && strides.size >= 3);
    assert.ok(final);
  });

test("reception respects comparison mode and explicit background overrides", () => {
  const squad = testState(1000, 24, 40, 10000).squads[0];
  const base = { squad, startQuest: "garden-reception", now: 1000, ready: true };
  assert.equal(storybookAdventureInput(base).backgroundOverride, gardenReceptionAssets.bank);
  assert.equal(
    storybookAdventureInput({ ...base, storybookHeroes: false }).backgroundOverride,
    undefined,
  );
  assert.equal(
    storybookAdventureInput({ ...base, backgroundOverride: "/custom.png" }).backgroundOverride,
    "/custom.png",
  );
});

for (const reduced of [false, true])
  test(`reception reaches its return scene with repeated help, reduced=${reduced}`, () => {
    const view = { width: 374, height: (374 * 2) / 3 },
      motion = new RoadMotion();
    let state = act(
        act(testState(1000, 24, 100, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
        { type: "start", id: "garden-reception", readDeparture: true, value: false },
        1000,
      ),
      identity;
    for (let i = 0; i < 4000; i++) {
      const input = storybookAdventureInput({
        squad: state.squads[0],
        startQuest: "garden-reception",
        now: state.updatedAt,
        ready: true,
        storybookHeroes: true,
        questComplete: !!state.done["garden-reception"],
      });
      const raw = chapterRoadFrame(input, reduced, 1400, view);
      identity = roadPaintKey("assisted", state.squads[0].run ?? null, raw.look, identity);
      const { look } = motion.update(raw, identity.key, view.width, reduced, view.height);
      if (!state.squads[0].run) {
        assert.equal(look.gardenReception.arrived, true);
        assert.equal(look.gardenReception.fade, 0);
        break;
      }
      state = settle(state, state.updatedAt + 50);
      if (state.squads[0].run && i % 4 === 0)
        state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
    }
    assert.equal(state.done["garden-reception"], 1);
  });
