import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { waterwayBackgrounds, waterwayLayout } from "../lib/road-waterway-layout.ts";
import { mossRemovalAssets as assets } from "../lib/road-moss-removal-layout.ts";
import { waterwayPalm } from "../lib/road-waterway-contacts.ts";
import { mossBasketSupport } from "../lib/road-moss-removal-layout.ts";
import { roadHeroSize, roadScale, roadY } from "../lib/road-layout.ts";
import { restorationVisualInput } from "../lib/restoration-visual-input.ts";

const distance = (a, b, v) =>
  Math.hypot(
    (a.x - b.x) * roadScale(v.width),
    roadY(a.lane, v.height, v.width) - roadY(b.lane, v.height, v.width),
  );

test("the displayed work matches the second collection even if game progress runs ahead", () => {
  const view = { width: 374, height: (374 * 2) / 3 };
  const motion = new RoadMotion();
  let state = act(
    testState(0, 8, 40, 10000),
    { type: "start", id: "tower-moss-removal", readDeparture: true, value: false },
    0,
  );
  let caughtUp = false,
    carried = false,
    finished = false,
    previousSquad;
  for (let time = 0; time < 100000; time += 50) {
    if (state.squads[0].run) previousSquad = state.squads[0];
    state = settle(state, time);
    const input = restorationVisualInput(
      {
        squad: state.squads[0],
        startQuest: "tower-moss-removal",
        now: time,
        ready: true,
        paused: false,
        storybookHeroes: true,
        backgroundOverride: waterwayBackgrounds.cleared,
      },
      { quest: "tower-moss-removal", active: true, squad: previousSquad, skipped: false },
    );
    const frame = chapterRoadFrame(input, false, 1400, view);
    const { battle, look } = motion.update(frame, "caption", view.width, false, view.height);
    if (
      look.waterway.node >= 12 &&
      battle.waterwayActions?.poses.aria?.asset === assets.cycle &&
      battle.waterwayActions.poses.aria.frame > 0 &&
      !battle.enemies.some((enemy) => enemy.hp > 0)
    ) {
      caughtUp = true;
      assert.equal(look.work.label, "点検口の苔を剥がして籠に集める");
    }
    if (
      look.waterway.node >= 12 &&
      battle.waterwayActions?.poses.leon?.asset.endsWith("leon-carry-walk-v1.webp") &&
      battle.waterwayActions.props.some(
        (prop) => prop.id === "moss-active-basket" && prop.asset === assets.filled,
      ) &&
      !battle.enemies.some((enemy) => enemy.hp > 0)
    ) {
      carried = true;
      assert.equal(look.work.label, "苔の籠を作業者へ渡す");
    }
    if (battle.mossVisualComplete && look.work) {
      finished = true;
      assert.equal(look.work.label, "", "completed cleanup has no stale work caption");
    }
  }
  assert.ok(caughtUp, "exercise the animated scrape after the saved work node advances");
  assert.ok(carried, "exercise the filled basket carry after the second scrape");
  assert.ok(finished, "exercise the closed hatches after both baskets are delivered");
});
for (const width of [374, 936])
  test(`full baskets stay in the cart and an empty one returns at ${width}`, () => {
    const view = { width, height: (width * 2) / 3 },
      motion = new RoadMotion();
    let state = act(
      testState(0, 8, 18, 10000),
      { type: "start", id: "tower-moss-removal", readDeparture: true, value: false },
      0,
    );
    const stored = new Map(),
      approaches = new Set(),
      returnSteps = new Set(),
      secondCollection = new Set();
    let receivedEmpty = false,
      secondDelivery = false,
      cart;
    for (let time = 0; time < 100000; time += 50) {
      state = settle(state, time);
      const saved = JSON.stringify(state);
      const frame = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: "tower-moss-removal",
          now: time,
          ready: true,
          paused: false,
          storybookHeroes: true,
          backgroundOverride: waterwayBackgrounds.cleared,
        },
        false,
        1400,
        view,
      );
      const { battle, look } = motion.update(frame, "shuttle", width, false, view.height);
      assert.equal(JSON.stringify(state), saved);
      const scene = battle.waterwayActions,
        worker = scene.worker,
        active = scene.props.find((p) => p.id === "moss-active-basket");
      const leon = battle.heroes.find((hero) => hero.id === "leon");
      if (scene.priorityHero === "leon" && leon?.walking) {
        const dx = Math.abs(worker.point.x - leon.x) * roadScale(width);
        const dy = Math.abs(
          roadY(worker.point.lane, view.height, width) - roadY(leon.lane, view.height, width),
        );
        const size = roadHeroSize(width, view.height);
        assert.ok(
          dx >= size * 0.45 - 1 || dy >= size * 0.7 - 1,
          `basket approach clears the worker at ${time}ms: ${dx}, ${dy}`,
        );
        approaches.add(stored.size);
      }
      for (const enemy of battle.enemies.filter((enemy) => enemy.hp > 0))
        assert.ok(
          roadY(worker.point.lane, view.height, width) - roadY(enemy.lane, view.height, width) >
            80 * waterwayLayout(width, view.height).figureScale,
          "combat stays behind the worker's carrying lane",
        );
      assert.equal(scene.props.filter((p) => p.id === "moss-active-basket").length, active ? 1 : 0);
      const currentCart = scene.props.find((p) => p.id === "moss-basket-cart");
      cart ??= currentCart.point;
      assert.ok(distance(cart, currentCart.point, view) < 0.01);
      for (const prop of scene.props.filter((p) => p.id?.startsWith("stored-moss-basket-"))) {
        stored.set(prop.id, stored.get(prop.id) ?? prop.point);
        assert.ok(
          distance(stored.get(prop.id), prop.point, view) < 0.01,
          "delivered baskets never follow the worker",
        );
      }
      if (worker.pose.asset === assets.workerWalk && worker.facing === -1) {
        assert.equal(active.asset, assets.basket);
        returnSteps.add(worker.pose.frame);
        const palm = [
          [61, 111],
          [66, 111],
          [62, 111],
          [65, 111],
        ][worker.pose.frame];
        assert.ok(
          distance(
            active.point,
            mossBasketSupport(waterwayPalm(worker.point, palm, -1, view), view),
            view,
          ) < 0.01,
        );
      }
      if (
        stored.size &&
        active?.asset === assets.basket &&
        scene.poses.leon?.asset.includes("carry")
      )
        receivedEmpty = true;
      if (look.waterway.node >= 7 && scene.poses.aria?.frame > 0)
        secondCollection.add(look.waterway.node);
      if (
        stored.size &&
        worker.pose.asset === assets.workerWalk &&
        worker.facing !== -1 &&
        active?.asset === assets.filled
      ) {
        assert.ok(
          look.waterway.node >= 13,
          "the last basket waits until the carrying-out instruction",
        );
        secondDelivery = true;
      }
      if (stored.size === 2) {
        assert.ok(
          distance(
            stored.get("stored-moss-basket-0"),
            waterwayLayout(width, view.height).world(395, 748),
            view,
          ) < 0.01,
        );
        break;
      }
    }
    assert.equal(returnSteps.size, 4);
    assert.ok(receivedEmpty && secondDelivery);
    assert.deepEqual([...approaches].sort(), [0, 1], "exercise both basket approaches");
    assert.ok(secondCollection.size > 0);
    assert.equal(stored.size, 2);
  });
