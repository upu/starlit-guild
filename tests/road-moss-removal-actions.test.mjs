import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { waterwayBackgrounds } from "../lib/road-waterway-layout.ts";
import { mossRemovalAssets as assets } from "../lib/road-moss-removal-layout.ts";
import { mossBasketSupport } from "../lib/road-moss-removal-actions.ts";
import { waterwayActionAssets as shared, waterwayPalm } from "../lib/road-waterway-contacts.ts";
import { roadHeroSize, roadScale, roadY } from "../lib/road-layout.ts";
import { mossBasketTurn } from "../lib/road-moss-basket-turn.ts";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

test("the turn atlas preserves Leon's scale, feet, and clear cell edges", async () => {
  const metrics = JSON.parse(
    await readFile("public/storybook-study/leon-basket-turn-v1-metrics.json", "utf8"),
  );
  assert.deepEqual(
    metrics.map((frame) => frame.height),
    [144, 144, 144, 144],
  );
  assert.ok(
    metrics.every(
      (frame) => frame.baseline === 176 && frame.left >= 4 && frame.left + frame.width <= 188,
    ),
  );
  const { data } = await sharp("public/storybook-study/leon-basket-turn-v1.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let frame = 0; frame < 4; frame++)
    for (let y = 0; y < 192; y++)
      for (const x of [0, 1, 190, 191]) assert.equal(data[(y * 768 + frame * 192 + x) * 4 + 3], 0);
  assert.equal(mossBasketTurn(0, -1, true).facing, 1, "reduced motion uses the final pose");
});

const distance = (a, b, view) =>
  Math.hypot(
    (a.x - b.x) * roadScale(view.width),
    roadY(a.lane, view.height, view.width) - roadY(b.lane, view.height, view.width),
  );
for (const width of [374, 936])
  test(`first moss basket reaches the worker at ${width}`, () => {
    const view = { width, height: (width * 2) / 3 },
      motion = new RoadMotion();
    let state = act(
      testState(0, 8, 18, 10000),
      { type: "start", id: "tower-moss-removal", readDeparture: true, value: false },
      0,
    );
    const scrape = new Set(),
      walk = new Set(),
      turns = new Set();
    let handoff = false,
      filled = false,
      detached = false,
      finalWorker;
    for (let time = 0; time < 90000 && state.squads[0].run; time += 50) {
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
      const { battle, look } = motion.update(frame, "moss-test", width, false, view.height);
      assert.equal(JSON.stringify(state), saved, "drawing never changes saves or combat");
      assert.ok(look.waterway);
      const scene = battle.waterwayActions,
        leon = battle.heroes.find((h) => h.id === "leon"),
        worker = scene.worker;
      if (scene.priorityHero === "leon" && leon.walking) {
        const aria = battle.heroes.find((hero) => hero.id === "aria");
        const dx = Math.abs(aria.x - leon.x) * roadScale(width);
        const dy = Math.abs(
          roadY(aria.lane, view.height, width) - roadY(leon.lane, view.height, width),
        );
        const size = roadHeroSize(width, view.height);
        assert.ok(
          dx >= size * 0.62 - 1 || dy >= size * 1.05 - 1,
          `carrying route clears Aria: ${dx}, ${dy}, time ${time}`,
        );
      }
      const basket = scene.props.find((p) => p.id === "moss-active-basket");
      assert.ok(basket && worker);
      assert.ok(
        roadY(worker.point.lane, view.height, width) < view.height - 2,
        "worker's boots remain inside the phone crop",
      );
      assert.equal(scene.props.filter((p) => p.id === "moss-active-basket").length, 1);
      if (scene.poses.aria?.asset === assets.cycle) scrape.add(scene.poses.aria.frame);
      if (scene.props.some((p) => p.id === "moss-on-spatula")) {
        detached = true;
        assert.ok(
          scene.props.some((p) => p.id === "moss-inside-hatch"),
          "attached and detached moss coexist",
        );
      }
      if (basket.asset === assets.filled) filled = true;
      if (scene.poses.leon?.asset === shared.carryTurn) {
        const pose = scene.poses.leon;
        const palm = pose.frame === 2 ? [96, 108] : [118, 107];
        assert.ok(
          distance(
            basket.point,
            mossBasketSupport(waterwayPalm(leon, palm, leon.facing, view), view),
            view,
          ) < 0.01,
        );
        turns.add(`${pose.frame}:${leon.facing}`);
      }
      if (
        scene.poses.leon?.asset === shared.carry &&
        distance(
          basket.point,
          mossBasketSupport(waterwayPalm(worker.point, [62, 111], 1, view), view),
          view,
        ) < 2
      )
        handoff = true;
      if (worker.pose.asset === assets.workerWalk && worker.facing !== -1) {
        const dx = Math.abs(worker.point.x - leon.x) * roadScale(width);
        const dy = Math.abs(
          roadY(worker.point.lane, view.height, width) - roadY(leon.lane, view.height, width),
        );
        const size = roadHeroSize(width, view.height);
        assert.ok(
          dx >= size * 0.62 - 1 || dy >= size * 1.05 - 1,
          `worker leaves after Leon clears the path: ${dx}, ${dy}, size ${size}, time ${time}`,
        );
        walk.add(worker.pose.frame);
        const palm = [
          [61, 111],
          [66, 111],
          [62, 111],
          [65, 111],
        ][worker.pose.frame];
        assert.ok(
          distance(
            basket.point,
            mossBasketSupport(waterwayPalm(worker.point, palm, 1, view), view),
            view,
          ) < 0.01,
        );
        finalWorker = worker.point;
      }
      if (look.waterway.node >= 8) break;
      assert.ok(leon);
    }
    assert.deepEqual([...scrape], [0, 1, 2, 3, 4, 5, 6]);
    assert.ok(
      filled && detached && handoff && finalWorker,
      "complete first collection and transfer",
    );
    assert.equal(walk.size, 4, "worker steps through all four carrying poses");
    assert.deepEqual(
      [...turns].sort(),
      ["1:-1", "1:1", "2:1"],
      "hands support the basket through the turn",
    );
  });

for (const width of [374, 936])
  test(`a basket already on the ground stays put when combat interrupts collection at ${width}`, () => {
    const view = { width, height: (width * 2) / 3 },
      motion = new RoadMotion();
    let state = act(
      testState(0, 8, 18, 10000),
      { type: "start", id: "tower-moss-removal", readDeparture: true, value: false },
      0,
    );
    let savedFrame, basket;
    for (let time = 0; time < 90000 && state.squads[0].run; time += 50) {
      state = settle(state, time);
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
      const result = motion.update(frame, "interrupt-ground", width, false, view.height);
      const scene = result.battle.waterwayActions;
      if (
        result.look.waterway.node === 3 &&
        !result.battle.enemies.some((e) => e.hp > 0) &&
        scene.poses.leon?.asset === shared.leonWork &&
        scene.poses.leon.frame === 1
      ) {
        savedFrame = frame;
        basket = scene.props.find((p) => p.id === "moss-active-basket").point;
        break;
      }
    }
    assert.ok(savedFrame && basket, "reach the grounded basket during collection");
    const enemy = { id: 99, kind: "slime", x: 200, lane: 0.4, hp: 10, maxHp: 10, boss: false };
    for (let elapsed = 50; elapsed <= 1600; elapsed += 50) {
      const frame = structuredClone(savedFrame);
      frame.battle.time += elapsed;
      frame.battle.enemies = elapsed <= 800 ? [enemy] : [];
      const scene = motion.update(frame, "interrupt-ground", width, false, view.height).battle
        .waterwayActions;
      const point = scene.props.find((p) => p.id === "moss-active-basket").point;
      assert.ok(
        distance(point, basket, view) < 0.01,
        "a grounded basket must not be lowered or picked up",
      );
      if (elapsed <= 800) assert.notEqual(scene.poses.leon?.frame, 3, "no imaginary lowering pose");
    }
  });

for (const [width, interrupted] of [
  [374, "walk"],
  [936, "walk"],
  [374, "handoff"],
  [936, "handoff"],
])
  test(`a ${interrupted} moss basket is lowered, stays grounded, and is picked up at ${width}`, () => {
    const view = { width, height: (width * 2) / 3 },
      motion = new RoadMotion();
    let state = act(
      testState(0, 8, 18, 10000),
      { type: "start", id: "tower-moss-removal", readDeparture: true, value: false },
      0,
    );
    let savedFrame, before, previousCarry;
    for (let time = 0; time < 90000 && state.squads[0].run; time += 50) {
      state = settle(state, time);
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
      const result = motion.update(frame, "interrupt-held", width, false, view.height);
      const scene = result.battle.waterwayActions;
      if (
        !result.battle.enemies.some((e) => e.hp > 0) &&
        scene.poses.leon?.asset === (interrupted === "walk" ? shared.carryWalk : shared.carry)
      ) {
        savedFrame = frame;
        before = scene.props.find((p) => p.id === "moss-active-basket").point;
        break;
      }
    }
    assert.ok(savedFrame && before, "reach a carried basket while Leon walks");
    const enemy = { id: 99, kind: "slime", x: 200, lane: 0.4, hp: 10, maxHp: 10, boss: false };
    let ground,
      pickedUp = false;
    for (let elapsed = 50; elapsed <= 6000; elapsed += 50) {
      const frame = structuredClone(savedFrame);
      frame.battle.time += elapsed;
      frame.battle.enemies = elapsed <= 1200 ? [enemy] : [];
      const result = motion.update(frame, "interrupt-held", width, false, view.height);
      const scene = result.battle.waterwayActions;
      const point = scene.props.find((p) => p.id === "moss-active-basket").point;
      const leon = result.battle.heroes.find((h) => h.id === "leon");
      const aria = result.battle.heroes.find((h) => h.id === "aria");
      if (elapsed >= 800 && elapsed <= 1200) {
        const worker = scene.worker.point,
          size = roadHeroSize(width, view.height);
        const dx = Math.abs(aria.x - worker.x) * roadScale(width);
        const dy = Math.abs(
          roadY(aria.lane, view.height, width) - roadY(worker.lane, view.height, width),
        );
        assert.ok(
          dx >= size * 0.62 - 1 || dy >= size * 1.05 - 1,
          "Aria clears the worker during battle",
        );
      }
      if ([shared.carry, shared.carryWalk].includes(scene.poses.leon?.asset)) {
        const relative = { x: point.x - leon.x, lane: point.lane - leon.lane };
        if (previousCarry)
          assert.ok(
            distance(relative, previousCarry, view) <
              (20 * roadHeroSize(width, view.height) * 0.9) / 144,
            `basket should follow the hands without flipping sides in one frame at ${elapsed}ms`,
          );
        previousCarry = relative;
      } else previousCarry = undefined;
      if (elapsed >= 400 && elapsed <= 1200) {
        ground ??= point;
        assert.ok(
          distance(point, ground, view) < 0.01,
          "basket stays in the same place during combat",
        );
      }
      if (elapsed > 1200 && ground && distance(point, ground, view) > 2) pickedUp = true;
    }
    assert.ok(pickedUp, "Leon returns and retrieves the basket");
  });
