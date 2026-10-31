import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { LUNCH_INTERLUDE, chapterThreeWork } from "../lib/chapter-three.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { foundationAssets } from "../lib/road-berne-foundation.ts";
import { foundationLayout } from "../lib/road-housecalls-layout.ts";
import { roadX, roadY } from "../lib/road-layout.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { restorationVisualInput } from "../lib/restoration-visual-input.ts";

for (const [width, height] of [
  [374, (374 * 2) / 3],
  [936, 624],
  [388, 740],
])
  test(`foundation investigation keeps fifteen actions and continuous mason movement at ${width}x${height}`, () => {
    const view = { width, height },
      motion = new RoadMotion(),
      nodes = new Set(),
      masonFrames = new Set(),
      poses = new Set(),
      gear = new Map(),
      rootAlpha = [1, 1, 1, 1, 1];
    let state = act(
        act(testState(1000, 20, 24, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
        { type: "start", id: "missing-keystone", readDeparture: true, value: false },
        1000,
      ),
      identity,
      lastMason,
      finishedStanding = false;
    assert.ok(state.squads[0].run);
    assert.deepEqual(state.squads[0].members, ["aria", "leon", "mira", "finn"]);
    for (let i = 0; i < 5000; i++) {
      const before = JSON.stringify(state),
        raw = chapterRoadFrame(
          {
            squad: state.squads[0],
            startQuest: "missing-keystone",
            now: state.updatedAt,
            ready: true,
            storybookHeroes: true,
            backgroundOverride: foundationAssets.bank,
            questComplete: !!state.done["missing-keystone"],
          },
          false,
          1400,
          view,
        );
      identity = roadPaintKey("foundation", state.squads[0].run ?? null, raw.look, identity);
      const { battle, look } = motion.update(raw, identity.key, width, false, height),
        scene = battle.waterwayActions,
        l = foundationLayout(view);
      assert.equal(JSON.stringify(state), before);
      assert.equal(
        look.background,
        state.squads[0].run ? foundationAssets.bank : foundationAssets.open,
      );
      assert.equal(battle.distance, 0);
      assert.equal(battle.enemies.length, 0);
      assert.equal(battle.journeyCart, undefined);
      nodes.add(look.foundation.node);
      if (look.work)
        assert.equal(
          look.work.label,
          chapterThreeWork("missing-keystone", look.foundation.node).name,
        );
      assert.deepEqual(
        scene.actors.map((a) => a.id),
        ["foundation-mason", "foundation-keeper"],
      );
      const mason = scene.actors[0];
      if (!state.squads[0].run && look.foundation.node === 14) {
        assert.equal(mason.pose.frame, 5);
        assert.equal(look.foundation.exposed, true);
        assert.equal(
          scene.poses.leon?.asset,
          foundationAssets.notes,
          "Leon keeps the plan in hand",
        );
        assert.deepEqual(
          scene.props.map((p) => p.id),
          ["foundation-basket", "foundation-bag", "foundation-medicine", "foundation-tools"],
        );
      }
      masonFrames.add(mason.pose.frame);
      if (lastMason && state.squads[0].run) {
        const dx = roadX(mason.point.x, 0, width) - roadX(lastMason.x, 0, width);
        const delta = Math.hypot(
          dx,
          roadY(mason.point.lane, height, width) - roadY(lastMason.lane, height, width),
        );
        assert.ok(delta <= 9 * l.scale + 0.1, `mason jumped ${delta}px`);
        if (dx > 2 * l.scale)
          assert.equal(mason.facing, -1, "left-facing atlas turns right when moving right");
        if (dx < -2 * l.scale)
          assert.equal(mason.facing, 1, "left-facing atlas stays left when moving left");
      }
      lastMason = { ...mason.point };
      if (state.squads[0].run)
        assert.deepEqual(
          scene.props.slice(0, 2).map((p) => p.id),
          ["foundation-table", "foundation-map"],
        );
      for (const id of [
        "foundation-basket",
        "foundation-bag",
        "foundation-medicine",
        "foundation-tools",
      ]) {
        const item = scene.props.find((prop) => prop.id === id);
        assert.ok(item, `${id} stays at the worksite`);
        const previous = gear.get(id);
        if (previous) assert.deepEqual(item.point, previous, `${id} does not jump at completion`);
        else gear.set(id, item.point);
      }
      for (let root = 0; root < 5; root++) {
        const prop = scene.props.find((p) => p.id === `foundation-root-${root}`);
        const alpha = prop?.alpha ?? 0;
        assert.ok(alpha <= rootAlpha[root] + 1e-8, "cleared roots must not reappear");
        rootAlpha[root] = alpha;
      }
      for (const h of battle.heroes) {
        const x = roadX(h.x, 0, width),
          y = roadY(h.lane, height, width);
        assert.ok(x > l.figureSize * 0.3 && x < width - l.figureSize * 0.3, `${h.id} side clip`);
        assert.ok(y > l.figureSize && y < height - 5, `${h.id} vertical clip`);
        const dx = Math.abs(x - roadX(mason.point.x, 0, width));
        const dy = Math.abs(y - roadY(mason.point.lane, height, width));
        if (state.squads[0].run)
          assert.ok(dx >= 55 * l.scale || dy >= 65 * l.scale, `${h.id} overlaps the mason`);
        if (state.squads[0].run)
          for (const id of [
            "foundation-basket",
            "foundation-bag",
            "foundation-medicine",
            "foundation-tools",
          ]) {
            const item = scene.props.find((prop) => prop.id === id);
            const itemDx = Math.abs(x - roadX(item.point.x, 0, width));
            const itemDy = Math.abs(y - roadY(item.point.lane, height, width));
            assert.ok(itemDx >= 40 * l.scale || itemDy >= 35 * l.scale, `${h.id} steps on ${id}`);
          }
        if (scene.poses[h.id]) poses.add(h.id + ":" + scene.poses[h.id].asset);
      }
      if (!state.squads[0].run && look.foundation.node === 14 && !scene.poses.aria)
        finishedStanding = true;
      if (!state.squads[0].run && look.foundation.node === 14 && i > 3500) break;
      state = settle(state, state.updatedAt + 50);
    }
    assert.equal(state.done["missing-keystone"], 1);
    assert.deepEqual(
      [...nodes],
      Array.from({ length: 15 }, (_, i) => i),
    );
    assert.ok(
      masonFrames.has(0) && masonFrames.has(5) && [1, 2, 3, 4].some((f) => masonFrames.has(f)),
    );
    assert.ok(poses.has("aria:" + foundationAssets.aria));
    assert.ok(poses.has("leon:" + foundationAssets.leon));
    assert.ok(finishedStanding);
    assert.deepEqual(rootAlpha, [0, 0, 0, 0, 0]);
  });

test("foundation default keeps explicit legacy and custom background choices", () => {
  const s = testState(1000, 20, 24, 10000);
  const input = { squad: s.squads[0], startQuest: "missing-keystone", now: 1000, ready: true };
  const drawn = storybookAdventureInput(input);
  assert.equal(drawn.backgroundOverride, foundationAssets.bank);
  assert.equal(drawn.squad, input.squad);
  assert.equal(drawn.storybookHeroes, true);
  const off = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(off), off);
  const custom = storybookAdventureInput({ ...input, backgroundOverride: "/custom.png" });
  assert.equal(custom.backgroundOverride, "/custom.png");
});

for (const [width, height] of [
  [388, 740],
  [936, 624],
])
  for (const [reduced, delayed, injured] of [
    [false, 0, false],
    [false, 500, false],
    [true, 0, false],
    [false, 0, true],
  ])
    test(`completed saves wait for the final inspection at ${width}x${height}, reduced=${reduced}, delayed=${delayed}, injured=${injured}`, () => {
      const view = { width, height },
        motion = new RoadMotion();
      let state = act(
        act(testState(1000, 20, 40, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
        { type: "start", id: "missing-keystone", readDeparture: true, value: false },
        1000,
      );
      let snapshot,
        identity,
        sawWait = false,
        sawBlack = false,
        complete = false,
        jumped = false,
        changedHealth = false;
      for (let time = 1000; time < 150000; time += 50) {
        if (state.squads[0].run) snapshot = state.squads[0];
        state = settle(state, time);
        if (state.squads[0].run && time % 200 === 0)
          state = act(state, { type: "assist", mode: "strike" }, time);
        if (injured && !state.squads[0].run && snapshot?.run && !changedHealth) {
          snapshot = structuredClone(snapshot);
          for (const health of Object.values(snapshot.run.health)) health.hp = 0;
          changedHealth = true;
        }
        const saved = JSON.stringify(state);
        const base = {
          squad: state.squads[0],
          startQuest: "missing-keystone",
          now: time,
          ready: true,
          paused: false,
          questComplete: !!state.done["missing-keystone"],
        };
        const input = restorationVisualInput(base, {
          quest: "missing-keystone",
          active: true,
          squad: snapshot,
          skipped: false,
          dialogue: "pending",
        });
        const frame = chapterRoadFrame(input, reduced, 1400, view);
        identity = roadPaintKey("handoff", input.squad.run, frame.look, identity);
        const { battle, look } = motion.update(
          frame,
          identity.key,
          view.width,
          reduced,
          view.height,
        );
        assert.equal(JSON.stringify(state), saved, "visual handoff does not change the save");
        if (!state.squads[0].run) {
          assert.equal(input.foundationFinalizing, true);
          sawWait ||= !look.foundation.visualComplete;
          if (!look.foundation.exposed) {
            const mason = battle.waterwayActions.actors[0].point;
            const layout = foundationLayout(view);
            for (const hero of battle.heroes) {
              const dx = Math.abs(roadX(hero.x, 0, view.width) - roadX(mason.x, 0, view.width));
              const dy = Math.abs(
                roadY(hero.lane, view.height, view.width) -
                  roadY(mason.lane, view.height, view.width),
              );
              assert.ok(
                dx >= 55 * layout.scale || dy >= 65 * layout.scale,
                `${hero.id} clears the mason during the final inspection`,
              );
            }
          }
          if (look.foundation.exposed && !reduced && !complete)
            sawBlack ||= look.foundation.fade === 1;
          if (delayed && !jumped && !look.foundation.exposed && look.foundation.fade > 0) {
            time += delayed;
            jumped = true;
          }
          if (look.foundation.visualComplete) {
            assert.equal(look.background, foundationAssets.open);
            assert.equal(look.foundation.fade, 0);
            assert.equal(battle.waterwayActions.actors[0].pose.frame, 5);
            if (injured) assert.equal(battle.waterwayActions.poses.leon, undefined);
            else assert.equal(battle.waterwayActions.poses.leon.asset, foundationAssets.notes);
            complete = true;
            assert.equal(
              restorationVisualInput(base, {
                quest: "missing-keystone",
                active: true,
                squad: snapshot,
                skipped: true,
                dialogue: "pending",
              }),
              base,
              "skip immediately returns to the saved state",
            );
            break;
          }
        }
      }
      assert.ok(complete, "finish the drawing after the actual save has completed");
      if (!reduced) assert.ok(sawWait, "wait while the final drawing is unfinished");
      if (!reduced) assert.ok(sawBlack, "the revealed scene first appears under full black");
      if (delayed) assert.ok(jumped, "exercise a delayed paint across the fade midpoint");
    });

test("reduced motion uses stationary poses and changes roots without fading", () => {
  const view = { width: 374, height: (374 * 2) / 3 },
    motion = new RoadMotion();
  let state = act(
      act(testState(1000, 20, 24, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
      { type: "start", id: "missing-keystone", readDeparture: true, value: false },
      1000,
    ),
    identity;
  for (let i = 0; i < 2500; i++) {
    const raw = chapterRoadFrame(
      {
        squad: state.squads[0],
        startQuest: "missing-keystone",
        now: state.updatedAt,
        ready: true,
        storybookHeroes: true,
        backgroundOverride: foundationAssets.bank,
        questComplete: !!state.done["missing-keystone"],
      },
      true,
      1400,
      view,
    );
    identity = roadPaintKey("reduced", state.squads[0].run ?? null, raw.look, identity);
    const { battle } = motion.update(raw, identity.key, view.width, true, view.height);
    const scene = battle.waterwayActions;
    assert.ok([0, 5].includes(scene.actors[0].pose.frame));
    for (const p of scene.props.filter((prop) => prop.id.startsWith("foundation-root-")))
      assert.equal(p.alpha, 1);
    if (scene.poses.aria) assert.equal(scene.poses.aria.frame, 1);
    if (scene.poses.leon) assert.equal(scene.poses.leon.frame, 1);
    state = settle(state, state.updatedAt + 50);
  }
});
