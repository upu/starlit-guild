import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { syncEnemyTotals } from "../lib/combat.ts";
import { keepBasketOnRoad } from "../lib/road-seedling-escort.ts";

const quest = "moss-transplant";
const viewports = [
  { width: 374, height: 249 },
  { width: 936, height: 624 },
];
const input = (state) =>
  storybookAdventureInput({
    squad: state.squads[0],
    startQuest: quest,
    now: state.updatedAt,
    ready: true,
    storybookHeroes: true,
  });
const start = (time, stage = storyStages.length) =>
  act(
    testState(time, stage, 18, 10000),
    { type: "start", id: quest, readDeparture: true, value: false },
    time,
  );

for (const view of viewports) {
  test(`short fights put down and retrieve Lico's basket at ${view.width}px`, () => {
    for (let seed = 0; seed < 12; seed++) {
      let state = start(1000 + seed * 7300);
      for (let i = 0; i < 3000; i++) {
        const run = state.squads[0].run;
        if (run.phase === "work" && run.enemies?.some((enemy) => enemy.hp > 0)) break;
        state = settle(state, state.updatedAt + 100);
      }
      const run = state.squads[0].run;
      assert.ok(run.enemies.some((enemy) => enemy.hp > 0));
      for (const enemy of run.enemies) if (enemy.hp > 0) enemy.hp = 1;
      syncEnemyTotals(run);
      const motion = new RoadMotion(),
        phases = new Set();
      let enemyEnded,
        picked = false,
        previous;
      for (let i = 0; i < 200 && state.squads[0].run; i++) {
        const raw = chapterRoadFrame(input(state), false, 1400, view);
        const before = JSON.stringify(state);
        const frame = motion.update(raw, `basket-${seed}`, view.width, false, view.height);
        assert.equal(JSON.stringify(state), before);
        const item = frame.battle.handheld?.find((entry) => entry.hero === "lico");
        assert.equal(item?.kind, "transplant-basket");
        phases.add(item.phase);
        if (!frame.battle.enemies.some((enemy) => enemy.hp > 0)) enemyEnded ??= state.updatedAt;
        if (previous === "lift" && item.phase === "held") {
          picked = true;
          break;
        }
        previous = item.phase;
        state = settle(state, state.updatedAt + 50);
      }
      assert.ok(picked, `basket was not recovered at seed ${seed}`);
      assert.ok(state.updatedAt - enemyEnded < 2500, `recovery was delayed at seed ${seed}`);
      for (const phase of ["held", "lower", "ground", "lift"]) assert.ok(phases.has(phase));
    }
  });
  test(`the basket survives the complete transport and work cycle at ${view.width}px`, () => {
    let state = start(
      1000,
      storyStages.findIndex((stage) => stage.quest === quest),
    );
    const motion = new RoadMotion(),
      phases = new Set();
    let previous,
      ground,
      pickups = 0,
      workDrop = false,
      battleDrop = false;
    for (let i = 0; i < 12000 && state.squads[0].run; i++) {
      const raw = chapterRoadFrame(input(state), false, 1400, view);
      const before = JSON.stringify(state);
      const frame = motion.update(raw, "basket-full", view.width, false, view.height);
      assert.equal(JSON.stringify(state), before);
      const item = frame.battle.handheld?.find((entry) => entry.hero === "lico");
      assert.equal(item?.kind, "transplant-basket");
      phases.add(item.phase);
      if (item.phase === "lower") {
        if (frame.battle.enemies.some((enemy) => enemy.hp > 0)) battleDrop = true;
        if (raw.battle.gathering?.task === "gather") workDrop = true;
      }
      if (item.phase === "ground") {
        if (ground) assert.deepEqual(item.point, ground);
        else ground = { ...item.point };
      }
      if (previous === "lift" && item.phase === "held") {
        pickups++;
        ground = undefined;
      }
      previous = item.phase;
      state = settle(state, state.updatedAt + 50);
    }
    assert.equal(state.done[quest], 1);
    assert.ok(battleDrop && workDrop, "basket is set down for battle and work");
    assert.ok(pickups >= 5, `basket recoveries: ${pickups}`);
    for (const phase of ["held", "lower", "ground", "lift"]) assert.ok(phases.has(phase));
  });
}

test("cart stays still during pickup, resumes smoothly and stays still when paused or attacked", async () => {
  const { TransplantCartCatchup } = await import("../lib/road-transplant-cart-catchup.ts");
  const cart = new TransplantCartCatchup();
  const frame = (time, x, enemies = []) => ({ time, enemies, gathering: { task: "carry", x } });
  assert.equal(cart.update(frame(0, 10), false).gathering.x, 10);
  assert.equal(cart.update(frame(50, 12), true).gathering.x, 12);
  assert.equal(cart.update(frame(100, 12), true).gathering.x, 12);
  const moving = cart.update(frame(150, 100), false).gathering.x;
  assert.ok(moving > 12 && moving <= 20);
  assert.equal(cart.update(frame(150, 100), false).gathering.x, moving);
  assert.equal(cart.update(frame(200, 100, [{ hp: 1 }]), false).gathering.x, moving);
  assert.ok(cart.update(frame(250, 100), false).gathering.x > moving);
});

test("a new battle interrupts a lift without losing the grounded basket", () => {
  const view = { width: 374, height: 249 };
  let state = start(1000);
  for (let i = 0; i < 3000; i++) {
    const run = state.squads[0].run;
    if (run.phase === "work" && run.enemies?.some((enemy) => enemy.hp > 0)) break;
    state = settle(state, state.updatedAt + 100);
  }
  const frame = chapterRoadFrame(input(state), false, 1400, view);
  const enemy = frame.battle.enemies.find((entry) => entry.hp > 0);
  const motion = new RoadMotion();
  const base = frame.battle.time;
  let phase, point;
  for (let i = 0; i < 200; i++) {
    const enemies = i < 30 ? [enemy] : [];
    const battle = { ...frame.battle, time: base + i * 50, enemies };
    const result = motion.update(
      { ...frame, battle },
      "interrupted-basket",
      view.width,
      false,
      view.height,
    );
    const item = result.battle.handheld.find((entry) => entry.hero === "lico");
    phase = item.phase;
    if (phase === "lift") {
      point = { ...item.point };
      break;
    }
  }
  assert.equal(phase, "lift");
  const interrupted = motion.update(
    { ...frame, battle: { ...frame.battle, time: base + 10000, enemies: [enemy] } },
    "interrupted-basket",
    view.width,
    false,
    view.height,
  );
  const basket = interrupted.battle.handheld.find((entry) => entry.hero === "lico");
  assert.equal(basket.phase, "ground");
  assert.deepEqual(basket.point, point);
});

test("basket is scoped to Lico's painted journey and remains on the ground if she cannot move", () => {
  const view = { width: 374, height: 249 };
  const state = start(1000);
  const source = chapterRoadFrame(input(state), false, 1400, view);
  const motion = new RoadMotion();
  const absent = {
    ...source,
    battle: { ...source.battle, heroes: source.battle.heroes.filter((hero) => hero.id !== "lico") },
  };
  assert.ok(
    !motion
      .update(absent, "absent", view.width, false, view.height)
      .battle.handheld?.some((item) => item.hero === "lico"),
  );
  const unavailable = {
    ...source,
    battle: {
      ...source.battle,
      heroes: source.battle.heroes.map((hero) => (hero.id === "lico" ? { ...hero, hp: 0 } : hero)),
    },
  };
  const result = motion.update(unavailable, "down", view.width, false, view.height);
  const item = result.battle.handheld.find((entry) => entry.hero === "lico");
  assert.equal(item.phase, "ground");
  assert.ok(item.point);
  const unpainted = { ...source, look: { ...source.look, storybookHeroes: false } };
  assert.ok(
    !motion
      .update(unpainted, "unpainted", view.width, false, view.height)
      .battle.handheld?.some((entry) => entry.hero === "lico"),
  );
});

test("the carried basket has room at the screen edges while placement retains its target", () => {
  const view = { width: 374, height: 249 };
  const targets = [
    { id: "lico", x: 0 },
    { id: "mira", x: 100 },
  ];
  const item = { hero: "lico", kind: "transplant-basket", phase: "held" };
  const left = keepBasketOnRoad(targets, { handheld: [item] }, view);
  const right = keepBasketOnRoad([{ ...targets[0], x: 560 }], { handheld: [item] }, view);
  assert.ok(left[0].x > 0 && right[0].x < 560);
  assert.deepEqual(left[1], targets[1]);
  const reserved = { ...item, reservation: { x: 10, lane: 0.5 } };
  assert.equal(keepBasketOnRoad(targets, { handheld: [reserved] }, view)[0].x, 0);
});
