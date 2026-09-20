import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advanceRoadBattle,
  assistRoadBattle,
  createRoadBattle,
  ROAD_LENGTH,
} from "../lib/scrolling-battle.ts";
import { roadChat } from "../lib/scrolling-banter.ts";
import { isWorking } from "../lib/scrolling-travel.ts";
import { roadPresentation } from "../lib/scrolling-presentation.ts";

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
      assert.equal(state.defeated, 6);
      assert.equal(state.herbs, 6);
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
  assert.ok(idle.enemies.length <= 2);
  assert.ok(idle.effects.length <= 32);
});

test("aid improves completion time but does not replace autonomous combat", () => {
  const plain = finish(),
    assisted = finish(undefined, true);
  assert.equal(assisted.clears, 1);
  assert.ok(assisted.time < plain.time * 0.9);
  assert.equal(assisted.defeated, plain.defeated);
});

test("the archer holds range while the swordsman closes in; after combat both move onward", () => {
  const state = createRoadBattle();
  advanceRoadBattle(state, 500);
  const [aria, leon] = state.heroes;
  assert.equal(aria.walking, false);
  assert.equal(leon.walking, true);
  assert.notEqual(leon.x - aria.x, 40);
  const stopped = aria.x;
  for (const enemy of state.enemies) enemy.hp = 0;
  advanceRoadBattle(state, 100);
  assert.ok(aria.x > stopped);
});

test("companions gather together, switch to escort during an ambush, and return to work", () => {
  const state = createRoadBattle();
  let together = false,
    escorted = false,
    returned = false,
    rear = false;
  while (!state.clears && state.time < 180000) {
    advanceRoadBattle(state, 50);
    const workers = state.heroes.filter((hero) => isWorking(state, hero));
    if (!state.gathering) continue;
    if (workers.length === 2) {
      together = true;
      returned ||= escorted;
    }
    if (
      state.enemies.length &&
      isWorking(state, state.heroes[0]) &&
      !isWorking(state, state.heroes[1])
    )
      escorted = true;
    rear ||=
      state.enemies.some((enemy) => enemy.x < state.heroes[0].x) && state.heroes[1].facing === -1;
  }
  assert.ok(together && escorted && returned && rear);
  assert.equal(state.herbs, 6);
});

test("gathering assistance accelerates work at the point", () => {
  const state = createRoadBattle();
  while (!state.heroes.some((hero) => isWorking(state, hero)) && state.time < 60000)
    advanceRoadBattle(state, 50);
  const point = state.gathering;
  assert.ok(point);
  const before = point.remaining;
  assert.equal(assistRoadBattle(state), true);
  assert.ok(point.remaining < before);
});

test("three-person and worksite stages finish with automatic healing and stage-specific crowds", () => {
  for (const stage of ["trio", "worksite"]) {
    const state = createRoadBattle(undefined, stage);
    let peak = 0,
      workers = 0,
      healed = false;
    while (!state.clears && state.time < 180000) {
      advanceRoadBattle(state, 50);
      peak = Math.max(peak, state.enemies.length);
      workers = Math.max(workers, state.heroes.filter((hero) => isWorking(state, hero)).length);
      healed ||= state.effects.some((effect) => effect.kind === "heal");
    }
    assert.equal(state.clears, 1);
    assert.equal(state.rests, 0);
    assert.ok(healed);
    assert.equal(peak, stage === "trio" ? 4 : 2);
    assert.equal(state.herbs, stage === "trio" ? 6 : 9);
    if (stage === "worksite") assert.equal(workers, 3);
    assert.ok(roadChat(10000, ["aria", "leon", "mira"]).some((line) => line.speaker === "mira"));
  }
});

test("sparse battles never overlap into a swarm and both sides can be knocked back", () => {
  const state = createRoadBattle();
  let enemiesPushed = false,
    heroesPushed = false,
    peak = 0;
  while (!state.clears && state.time < 180000) {
    advanceRoadBattle(state, 50);
    peak = Math.max(peak, state.enemies.length);
    enemiesPushed ||= state.enemies.some((enemy) => enemy.x > enemy.previousX);
    heroesPushed ||= state.heroes.some((hero) => hero.x < hero.previousX);
  }
  assert.equal(peak, 2);
  assert.ok(enemiesPushed);
  assert.ok(heroesPushed);
});

test("rendering interpolates between fixed ticks without changing combat", () => {
  const state = createRoadBattle();
  advanceRoadBattle(state, 100);
  const before = structuredClone(state);
  const first = roadPresentation(state, 0),
    middle = roadPresentation(state, 25),
    last = roadPresentation(state, 50);
  assert.ok(first.heroes[1].x < middle.heroes[1].x);
  assert.ok(middle.heroes[1].x < last.heroes[1].x);
  assert.equal(last.heroes[1].x, state.heroes[1].x);
  assert.deepEqual(
    roadPresentation(state, 5000),
    last,
    "stale renders never extrapolate beyond combat",
  );
  assert.deepEqual(state, before);
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
