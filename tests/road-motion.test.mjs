import { test } from "node:test";
import assert from "node:assert/strict";
import { RoadMotion } from "../lib/road-motion.ts";
import { chapterRoadFrame, chapterRoadHit } from "../lib/chapter-road-presentation.ts";
import { roadX, roadY } from "../lib/road-layout.ts";
import { act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";

function frame(time = 1000) {
  return {
    battle: {
      time,
      distance: 0,
      stage: "forest",
      phase: "journey",
      gathering: null,
      effects: [],
      enemies: [],
      heroes: [{ id: "leon", hp: 100, maxHp: 100, x: 100, lane: 0.82, walking: false, facing: 1 }],
    },
    look: { workers: [], puller: null },
  };
}
const screenX = (battle, width = 390) =>
  roadX(battle.heroes[0].x, battle.distance, width, battle.stage);

test("formation, camera and stage changes stay continuous and converge to work positions", () => {
  const motion = new RoadMotion();
  const first = motion.update(frame(), "run", 390);
  const next = frame(1016);
  next.battle.heroes[0].x = 260;
  next.battle.heroes[0].lane = 0.36;
  next.battle.distance = 100;
  next.battle.stage = "puppets";
  next.look.workers = ["leon"];
  const saved = structuredClone(next);
  const drawn = motion.update(next, "run", 390);
  assert.ok(Math.abs(screenX(drawn.battle) - screenX(first.battle)) <= 3.121);
  assert.ok(Math.abs(drawn.battle.heroes[0].lane - 0.82) <= 0.01441);
  assert.equal(drawn.battle.heroes[0].walking, true);
  assert.deepEqual(drawn.look.workers, []);
  assert.deepEqual(next, saved);
  let result;
  for (let time = 1032; time < 5000; time += 16) {
    next.battle.time = time;
    result = motion.update(next, "run", 390);
  }
  assert.ok(Math.abs(result.battle.heroes[0].x - 260) < 0.01);
  assert.ok(Math.abs(result.battle.heroes[0].lane - 0.36) < 0.0001);
  assert.deepEqual(result.look.workers, ["leon"]);
  assert.equal(result.battle.heroes[0].walking, false);
});

test("effects and recovery taps follow the displayed hero during repositioning", () => {
  const motion = new RoadMotion();
  motion.update(frame(), "run", 390);
  const next = frame(1016);
  next.battle.heroes[0].x = 350;
  next.battle.effects = [
    {
      id: 1,
      kind: "heal",
      at: 1016,
      hero: "leon",
      amount: 10,
      x: 350,
      lane: 0.82,
      fromX: 350,
      fromLane: 0.82,
    },
  ];
  const { battle } = motion.update(next, "run", 390);
  assert.equal(battle.effects[0].x, battle.heroes[0].x);
  assert.equal(battle.effects[0].fromX, battle.heroes[0].x);
  assert.equal(
    chapterRoadHit(
      null,
      { x: screenX(battle), y: roadY(battle.heroes[0].lane, 300) - 25 },
      390,
      300,
      battle,
    ),
    "heal:leon",
  );
  assert.equal(chapterRoadHit(null, { x: 389, y: 10 }, 390, 300, battle), "help");
});

test("travelling explores both axes, while work, rest, scenes and reduced motion stay still", () => {
  const motion = new RoadMotion();
  const positions = [];
  for (let time = 1000; time < 14000; time += 16) {
    const next = frame(time);
    next.battle.heroes[0].walking = true;
    positions.push(motion.update(next, "run", 390).battle.heroes[0]);
  }
  assert.ok(Math.max(...positions.map((p) => p.x)) - Math.min(...positions.map((p) => p.x)) > 45);
  assert.ok(
    Math.max(...positions.map((p) => p.lane)) - Math.min(...positions.map((p) => p.lane)) > 0.3,
  );
  for (const mode of ["work", "rest", "scene", "reduced", "fallen", "paralyzed"]) {
    const still = new RoadMotion();
    for (let time = 1000; time < 2000; time += 16) {
      const next = frame(time);
      next.battle.heroes[0].walking = true;
      if (mode === "work") next.look.workers = ["leon"];
      if (mode === "rest") next.battle.phase = "rest";
      if (mode === "scene") next.battle.scene = "enter";
      if (mode === "fallen") next.battle.heroes[0].hp = 0;
      if (mode === "paralyzed") next.battle.heroes[0].paralyzed = true;
      const hero = still.update(next, "run", 390, mode === "reduced").battle.heroes[0];
      assert.ok(Math.abs(hero.x - 100) < 1e-8, mode);
      assert.equal(hero.lane, 0.82, mode);
    }
  }
});

test("carriers keep their work pose and forward facing while the display catches up", () => {
  const motion = new RoadMotion();
  const initial = frame();
  initial.look.workers = ["leon"];
  initial.look.frontCarriers = ["leon"];
  initial.battle.gathering = { kind: "cargo", task: "carry", x: 100, remaining: 50, total: 100 };
  motion.update(initial, "run", 390);
  const shifted = structuredClone(initial);
  shifted.battle.time = 1016;
  shifted.battle.heroes[0].x = -100;
  shifted.battle.heroes[0].facing = -1;
  const drawn = motion.update(shifted, "run", 390);
  assert.ok(Math.abs(drawn.battle.heroes[0].x - shifted.battle.heroes[0].x) > 5);
  assert.deepEqual(drawn.look.workers, ["leon"]);
  assert.equal(drawn.battle.heroes[0].facing, 1);
  assert.equal(shifted.battle.heroes[0].facing, -1, "drawing must not change saved facing");
});

test("new runs reset continuity, pauses cannot produce a large catch-up step", () => {
  const motion = new RoadMotion();
  const first = motion.update(frame(), "old", 390);
  const next = frame(60000);
  next.battle.heroes[0].x = 450;
  assert.ok(
    Math.abs(screenX(motion.update(next, "old", 390).battle) - screenX(first.battle)) <= 9.751,
  );
  const reset = motion.update(next, "new", 390);
  assert.ok(Math.abs(reset.battle.heroes[0].x - 450) < 1e-8);
});

test("a backwards snapshot clock correction keeps the previous visible position", () => {
  const motion = new RoadMotion();
  const initial = frame(1200);
  const before = motion.update(initial, "run", 390);
  const correction = frame(1192);
  correction.battle.heroes[0].x = 350;
  correction.battle.heroes[0].lane = 0.4;
  const after = motion.update(correction, "run", 390);
  assert.equal(screenX(after.battle), screenX(before.battle));
  assert.equal(after.battle.heroes[0].lane, before.battle.heroes[0].lane);
  correction.battle.time += 16;
  const resumed = motion.update(correction, "run", 390);
  assert.ok(Math.abs(screenX(resumed.battle) - screenX(after.battle)) <= 3.121);
});

test("real gathering ambushes, victories and work-point changes never teleport companions", () => {
  for (const stage of [3, 13, 34]) {
    let state = act(
      testState(1000, stage, 25, 1000),
      { type: "start", id: storyStages[stage].quest, value: false, readDeparture: true },
      1000,
    );
    const motion = new RoadMotion();
    let previous,
      enemiesBefore = false,
      ambush = false,
      victory = false,
      changed = false;
    for (let now = 1000; now < 600000 && state.squads[0].run; now += 16) {
      state = settle(state, now);
      const run = state.squads[0].run;
      if (!run) break;
      const input = { squad: state.squads[0], now, ready: true, paused: false };
      const before = JSON.stringify(state);
      const raw = chapterRoadFrame(input);
      const { battle } = motion.update(raw, "run", 390);
      const enemies = battle.enemies.some((enemy) => enemy.hp > 0);
      ambush ||= enemies && run.road.ambushNode !== undefined;
      victory ||= enemiesBefore && !enemies;
      changed ||= run.node > 0;
      enemiesBefore = enemies;
      if (previous)
        for (const [i, hero] of battle.heroes.entries()) {
          const x = roadX(hero.x, battle.distance, 390, battle.stage);
          const oldX = roadX(previous.heroes[i].x, previous.distance, 390, previous.stage);
          assert.ok(Math.abs(x - oldX) <= 3.121, `${stage} x: ${x - oldX}`);
          assert.ok(Math.abs(hero.lane - previous.heroes[i].lane) <= 0.01441);
        }
      assert.equal(JSON.stringify(state), before);
      previous = battle;
      if (ambush && victory && changed) break;
    }
    assert.ok(ambush && victory && changed, `${stage}: ${ambush}/${victory}/${changed}`);
  }
});
