import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advanceRoadBattle,
  assistRoadBattle,
  createRoadBattle,
  ROAD_LENGTH,
} from "../lib/scrolling-battle.ts";
import { roadChat } from "../lib/scrolling-banter.ts";

function finish(loadout, assisted = false) {
  const state = createRoadBattle(loadout);
  while (!state.clears && state.time < 180000) {
    advanceRoadBattle(state, 50);
    if (assisted) assistRoadBattle(state);
  }
  return state;
}

test("all loadouts finish and automatically repeat without any input", () => {
  for (const aria of ["pierce", "rapid"])
    for (const leon of ["sweep", "guard"]) {
      const state = finish({ aria, leon });
      assert.equal(state.clears, 1, `${aria}/${leon} must finish unattended`);
      assert.equal(state.distance, ROAD_LENGTH);
      assert.equal(state.defeated, 25);
      assert.ok(state.heroes.every((hero) => hero.hp > 0));
      advanceRoadBattle(state, 8000);
      assert.equal(state.round, 2);
      assert.equal(state.phase, "journey");
      assert.ok(state.distance > 0 && state.distance < ROAD_LENGTH);
    }
});

test("idle catch-up and irregular live ticks are exactly equivalent across repeats", () => {
  const live = createRoadBattle(),
    idle = createRoadBattle();
  for (let i = 0; i < 10000; i++) advanceRoadBattle(live, 37);
  advanceRoadBattle(idle, 370000);
  assert.deepEqual(live, idle);
  assert.ok(idle.clears >= 4);
  assert.ok(idle.enemies.length <= 10);
  assert.ok(idle.effects.length <= 32);
});

test("aid improves completion time but does not replace autonomous combat", () => {
  const plain = finish(),
    assisted = finish(undefined, true);
  assert.equal(assisted.clears, 1);
  assert.ok(assisted.time < plain.time * 0.9);
  assert.equal(assisted.defeated, plain.defeated);
});

test("enemies stop forward motion; defeating the group resumes travel without resetting distance", () => {
  const state = createRoadBattle();
  while (state.walking && state.time < 20000) advanceRoadBattle(state, 50);
  assert.equal(state.walking, false);
  const stopped = state.distance;
  advanceRoadBattle(state, 50);
  assert.equal(state.distance, stopped);
  for (const enemy of state.enemies) enemy.hp = 0;
  advanceRoadBattle(state, 50);
  assert.ok(state.distance > stopped);
});

test("a wiped party rests, revives, and finishes without a confirmation", () => {
  const state = createRoadBattle();
  advanceRoadBattle(state, 5000);
  for (const hero of state.heroes) hero.hp = 0;
  advanceRoadBattle(state, 50);
  assert.equal(state.phase, "rest");
  const distance = state.distance;
  advanceRoadBattle(state, 3000);
  assert.equal(state.distance, distance);
  assert.equal(assistRoadBattle(state), true);
  assert.equal(assistRoadBattle(state), false, "same-tick aid is throttled");
  advanceRoadBattle(state, 3000);
  assert.equal(state.phase, "journey");
  assert.ok(state.heroes.every((hero) => hero.hp > 0));
  advanceRoadBattle(state, 150000);
  assert.ok(state.clears >= 1);
});

test("changing skills preserves progress, health, and attack timers", () => {
  const state = createRoadBattle();
  advanceRoadBattle(state, 18000);
  const before = structuredClone(state);
  state.loadout = { aria: "rapid", leon: "guard" };
  assert.equal(state.distance, before.distance);
  assert.deepEqual(state.heroes, before.heroes);
  advanceRoadBattle(state, 150000);
  assert.ok(state.clears >= 1);
});

test("chat reveals replies over time without modifying combat", () => {
  const state = createRoadBattle(),
    before = structuredClone(state);
  assert.equal(roadChat(0).length, 1);
  assert.equal(roadChat(4800).length, 2);
  assert.equal(roadChat(30000).at(-1).speaker, "leon");
  assert.ok(roadChat(12 * 60 * 60 * 1000).length <= 18);
  assert.deepEqual(state, before);
});

test("invalid elapsed times do not corrupt state", () => {
  const state = createRoadBattle(),
    before = structuredClone(state);
  for (const elapsed of [NaN, Infinity, -100, 0]) advanceRoadBattle(state, elapsed);
  assert.deepEqual(state, before);
});
