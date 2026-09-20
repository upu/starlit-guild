import { test } from "node:test";
import assert from "node:assert/strict";
import { act, settle, initialPrologueState, testState, allQuests, estimate } from "../lib/game.ts";
import { journeyNotice } from "../lib/journey.ts";
import { nextStage, stageEndingPending, storyStages } from "../lib/prologue.ts";
import {
  createEnemies,
  combatRank,
  damageEnemy,
  penetration,
  reducedDamage,
} from "../lib/combat.ts";
import { parseBundle } from "../lib/save-format.ts";
import { adventureFrame, spriteSize } from "../lib/adventure-presentation.ts";
import {
  combatScenarios,
  chapterComparisons,
  chapterCombatState,
  trainedChapter,
  tappedCombat,
} from "../scripts/check-combat-balance.mjs";

// Saves only keep story records, so the schema checks below use one.
function bundle(state) {
  const id = crypto.randomUUID();
  return {
    format: 4,
    deviceId: crypto.randomUUID(),
    active: id,
    profiles: [{ id, name: "combat test", test: true, state: { ...state, prologue: true } }],
    serial: 1,
    sound: false,
    cloudAt: 0,
    legacyImported: true,
  };
}
// The tower road is the first story stage whose nodes field a group of three.
function storyRun(stages, level, gold = 1000) {
  const source = testState(1000, stages, level, gold);
  const state = act(source, { type: "start", id: nextStage(source).quest }, 1000);
  // These grouped-target contract checks also cover pre-scrolling saves. Spatial combat is covered in chapter-road.test.
  delete state.squads[0].run.road;
  return state;
}
function group() {
  let state = storyRun(3, 1);
  for (let i = 0; state.squads[0].run.enemies.length !== 3 && i < 1000; i++)
    state = settle(state, state.squads[0].run.nextAt).state;
  assert.equal(state.squads[0].run.enemies.length, 3);
  return state;
}

test("resistance scales damage by the growth gap, respects rounding and never drops below one", () => {
  assert.deepEqual(
    [0, 3, 5, 10, 20].map((gap) => reducedDamage(20, gap, 0)),
    [20, 13, 10, 5, 1],
  );
  assert.equal(reducedDamage(20, 30, 30), 20);
  assert.equal(reducedDamage(20, 30, 100), 20);
  assert.equal(reducedDamage(20, 10000, 0), 1);
  for (const { quest } of storyStages) {
    const q = allQuests.find((item) => item.id === quest);
    assert.ok(createEnemies(q, 0, 0)[0].maxHp < 200, quest);
  }
});

test("levels and equipped weapons overcome resistance without a new saved currency", () => {
  const s = testState(1000, storyStages.length, 5, 1000);
  assert.equal(penetration(s, "aria"), 4);
  const bought = act(s, { type: "buy", id: "ash-bow" }, 1000);
  assert.equal(penetration(bought, "aria"), 4);
  const worn = act(bought, { type: "equip", hero: "aria", slot: "weapon", id: "ash-bow" }, 1000);
  assert.equal(penetration(worn, "aria"), 7);
  assert.equal(penetration(worn, "leon"), 4);
});

test("work resistance slows an underpowered party and its remaining gauge shrinks", () => {
  const state = act(initialPrologueState(1000), { type: "start", id: "village-trade" }, 1000),
    run = state.squads[0].run;
  assert.equal(run.enemies.length, 0);
  const input = {
    squad: state.squads[0],
    now: state.updatedAt,
    ready: true,
    paused: false,
    startQuest: "village-trade",
  };
  assert.equal(adventureFrame(input).target.value, 1);
  const remaining = run.target;
  const weak = damageEnemy(run, 20, 0, 20);
  assert.equal(weak.amount, reducedDamage(20, 20, 0));
  assert.equal(run.target, remaining - weak.amount);
  assert.equal(adventureFrame(input).target.value, run.target / run.targetMax);
  const strong = damageEnemy(run, 20, 20, 20);
  assert.equal(strong.amount, 20);
  assert.ok(strong.amount > weak.amount);
});

test("damage focuses one enemy, does not spill over, and advances to the next living opponent", () => {
  const s = group(),
    r = s.squads[0].run,
    second = r.enemies[1].hp,
    before = r.target;
  const first = damageEnemy(r, 9999, 99);
  assert.equal(first.enemy, "enemy-1");
  assert.equal(r.enemies[0].hp, 0);
  assert.equal(r.enemies[1].hp, second);
  assert.equal(r.target, before - first.amount);
  const next = damageEnemy(r, 5, 99);
  assert.equal(next.enemy, "enemy-2");
  assert.equal(r.enemies[1].hp, second - 5);
  assert.equal(r.enemyAt, Math.min(...r.enemies.filter((e) => e.hp > 0).map((e) => e.nextAt)));
});

test("opponents have independent attack clocks and defeated opponents stop attacking", () => {
  const source = group(),
    r = source.squads[0].run;
  for (const actor of r.actors) actor.nextAt = r.enemyAt + 10000;
  r.nextAt = r.enemyAt;
  r.events = [];
  const first = settle(source, r.enemyAt).state;
  const hurt = first.squads[0].run.events.filter((e) => e.kind === "hurt");
  assert.equal(hurt.length, 1);
  assert.equal(hurt[0].enemy, "enemy-1");
  const after = settle(first, r.enemies[1].nextAt).state;
  assert.equal(after.squads[0].run.events.filter((e) => e.kind === "hurt").at(-1).enemy, "enemy-2");
  const defeated = structuredClone(source),
    run = defeated.squads[0].run;
  damageEnemy(run, 9999, 99);
  run.nextAt = run.enemyAt;
  const later = settle(defeated, r.enemies[2].nextAt).state;
  assert.ok(later.squads[0].run.events.some((e) => e.kind === "hurt"));
  assert.ok(later.squads[0].run.events.every((e) => e.kind !== "hurt" || e.enemy !== "enemy-1"));
});

test("normal, special, combo and assist attacks all respect the same resistance", () => {
  let state = storyRun(15, 1);
  const seen = new Map();
  for (let i = 0; i < 20; i++) state = act(state, { type: "assist", mode: "strike" }, 1000);
  for (const event of state.squads[0].run.events)
    if (event.enemy) seen.set(event.kind, event.amount);
  while (state.updatedAt < 15500) {
    state = settle(state, state.squads[0].run.nextAt).state;
    for (const event of state.squads[0].run.events)
      if (event.enemy && event.kind !== "hurt") seen.set(event.kind, event.amount);
  }
  for (const kind of ["hit", "skill", "combo", "assist"]) assert.equal(seen.get(kind), 1, kind);
});

test("saving partially defeated groups roundtrips HP, clocks, events and offline results", () => {
  const source = group(),
    r = source.squads[0].run;
  damageEnemy(r, 9999, 99);
  damageEnemy(r, 3, 99);
  r.nextAt = Math.min(...r.actors.map((a) => a.nextAt), r.enemyAt, r.comboAt);
  const parsed = parseBundle(bundle(source)).profiles[0].state;
  assert.deepEqual(parsed, { ...source, prologue: true });
  // Stop short of the clear so the comparison stays about an unfinished battle.
  const end = source.updatedAt + 30000,
    bulk = settle(parsed, end).state;
  let live = parsed;
  for (let now = parsed.updatedAt + 100; now < end; now += 100) live = settle(live, now).state;
  live = settle(live, end).state;
  assert.ok(live.squads[0].run);
  assert.deepEqual(live, bulk);
  assert.doesNotThrow(() => parseBundle(bundle(bulk)));
});

test("saved battles without a group keep exact progress and regroup at the next node", () => {
  let state = storyRun(3, 8);
  const r = state.squads[0].run;
  delete r.enemies;
  r.target = 17;
  r.targetMax = 99;
  const before = structuredClone(state),
    parsed = parseBundle(bundle(state)).profiles[0].state;
  assert.equal(parsed.squads[0].run.target, 17);
  assert.equal(parsed.squads[0].run.targetMax, 99);
  assert.equal(parsed.squads[0].run.enemies, undefined);
  assert.deepEqual(state, before);
  state = parsed;
  while (state.squads[0].run.node === 0) state = settle(state, state.squads[0].run.nextAt).state;
  assert.ok(state.squads[0].run.enemies.length);
  assert.doesNotThrow(() => parseBundle(bundle(state)));
});

test("save validation rejects duplicate enemies, inconsistent totals and backwards living clocks", () => {
  const mutations = [
    (r) => (r.enemies[1].id = r.enemies[0].id),
    (r) => r.enemies[0].hp++,
    (r) => r.target++,
    (r) => (r.enemies[0].nextAt = 0),
    (r) => (r.enemies = []),
    (r) => (r.enemies[0].resistance = Infinity),
    (r) => (r.enemies[0].period = 0),
  ];
  for (const mutate of mutations) {
    const state = group();
    mutate(state.squads[0].run);
    assert.throws(() => parseBundle(bundle(state)));
  }
  const source = testState(1000, 0, 1, 1000),
    gatheringQuest = nextStage(source).quest;
  const gathering = act(source, { type: "start", id: gatheringQuest }, 1000);
  gathering.squads[0].run.enemies = createEnemies(
    allQuests.find((q) => q.id === gatheringQuest),
    0,
    1000,
  );
  assert.throws(() => parseBundle(bundle(gathering)));
});

test("rest recovery and offline caps keep every living enemy clock valid", () => {
  const state = group();
  for (const hp of Object.values(state.squads[0].run.health)) hp.hp = 0;
  const resting = settle(state, state.squads[0].run.nextAt).state;
  assert.equal(resting.squads[0].run.phase, "rest");
  assert.doesNotThrow(() => parseBundle(bundle(resting)));
  const recovered = settle(resting, resting.squads[0].run.nextAt).state;
  assert.ok(recovered.squads[0].run.enemies.every((e) => e.hp === e.maxHp));
  assert.doesNotThrow(() => parseBundle(bundle(recovered)));
  const capped = settle(recovered, recovered.updatedAt + 86400000);
  assert.equal(capped.rewards.capped, true);
  assert.doesNotThrow(() => parseBundle(bundle(capped.state)));
});

test("group portraits have distinct HP, stable positions, focused effects and fit compact maps", () => {
  const state = group(),
    before = structuredClone(state),
    input = {
      squad: state.squads[0],
      now: state.updatedAt,
      ready: true,
      paused: false,
      startQuest: "slime",
    };
  const frame = adventureFrame(input);
  assert.equal(frame.targets.length, 3);
  assert.deepEqual(state, before);
  for (const [width, height] of [
    [320, 280],
    [430, 420],
    [1100, 680],
  ])
    for (const target of frame.targets) {
      const size = spriteSize(width, height) * target.scale;
      assert.ok(target.x * width - size / 2 >= 0 && target.x * width + size / 2 <= width);
      assert.ok(
        target.y * height - size * 0.9 >= 0 && target.y * height + size * 0.13 + 25 <= height,
      );
    }
  damageEnemy(state.squads[0].run, 9999, 99);
  const after = adventureFrame(input);
  assert.equal(after.targets[0].down, true);
  assert.equal(after.target.id, "enemy-2");
  assert.deepEqual(
    after.targets.map((e) => [e.x, e.y]),
    frame.targets.map((e) => [e.x, e.y]),
  );
});

test("the first chapter needs training after its introduction, with the same growth rules in later quests", () => {
  const records = combatScenarios();
  for (const row of records.slice(0, 6)) {
    assert.ok(row.cleared, row.quest);
    assert.equal(row.rests, 0, row.quest);
    assert.ok(row.seconds < 180, row.quest);
  }
  const blocked = records.find((row) => row.quest === "old-waterway");
  assert.equal(blocked.cleared, false);
  assert.ok(blocked.rests > 0);
  assert.ok(Math.max(...records.map((r) => r.maxEnemyHp)) < 200);
  const s = testState(1000, storyStages.length, 1, 1000),
    q = allQuests.find((item) => item.id === "sweet-blockade"),
    grown = testState(1000, storyStages.length, 18, 1000);
  assert.ok(estimate(grown, grown.squads[0], q) < estimate(s, s.squads[0], q));
  assert.equal(combatRank(q), 25);
});

test("weapons allow earlier clears, more levels work without new equipment, and actual farming reaches the finale", () => {
  const records = chapterComparisons();
  const result = (quest, lv, equipped) =>
    records.find((r) => r.quest === quest && r.levels[0] === lv && r.equipped === equipped);
  assert.equal(result("tower-restoration", 8, false).cleared, false);
  assert.equal(result("tower-restoration", 8, true).cleared, true);
  assert.equal(result("tower-moss-removal", 10, false).cleared, false);
  assert.equal(result("tower-moss-removal", 10, true).cleared, true);
  assert.equal(result("tower-moss-removal", 15, false).cleared, true);
  const trained = trainedChapter();
  assert.equal(trained.records.length, 9);
  assert.ok(trained.records.every((r) => r.cleared));
  assert.ok(trained.trainingSeconds >= 600 && trained.trainingSeconds <= 3600);
  assert.ok(trained.totalSeconds < 7200);
});

test("rapid tapping can overcome an underleveled first-chapter finale without a cooldown", () => {
  const result = tappedCombat(chapterCombatState(8, 5), "tower-moss-removal", 8);
  assert.equal(result.cleared, true);
  assert.ok(result.seconds < 180);
  assert.ok(result.taps > 100);
});

test("only read first-chapter stages farm automatically, earn XP offline and can be stopped", () => {
  let state = act(
    initialPrologueState(1000),
    { type: "start", id: "village-trade", value: true },
    1000,
  );
  state = settle(state, 100000).state;
  assert.equal(state.squads[0].run, null);
  assert.equal(state.done["village-trade"], 1);
  assert.throws(() => act(state, { type: "start", id: "village-trade" }, state.updatedAt), /物語/);
  state = act(state, { type: "readStory", id: "village-trade-return" }, state.updatedAt);
  const xp = state.xp.aria;
  state = act(state, { type: "start", id: "village-trade", value: true }, state.updatedAt);
  const source = structuredClone(state);
  state = settle(state, state.updatedAt + 300000).state;
  assert.ok(state.squads[0].run);
  assert.ok(state.done["village-trade"] > 2);
  assert.ok(state.xp.aria > xp);
  let live = source;
  for (let at = source.updatedAt + 1000; at <= state.updatedAt; at += 1000)
    live = settle(live, at).state;
  assert.deepEqual({ ...live, log: [] }, { ...state, log: [] });
  assert.doesNotThrow(() => parseBundle(bundle(state)));
  assert.equal(journeyNotice(source, state), null);
  assert.equal(stageEndingPending(state), undefined);
  const stopped = act(state, { type: "stop" }, state.updatedAt);
  assert.equal(stopped.squads[0].run, null);
  assert.equal(stopped.xp.aria, state.xp.aria);
  assert.deepEqual(settle(stopped, stopped.updatedAt + 10000).state.done, stopped.done);
});

test("offline cap shifts stored enemy clocks by exactly the unprocessed time", () => {
  const source = storyRun(15, 1);
  const regular = settle(source, 1000 + 43200000).state,
    capped = settle(source, 1000 + 86400000).state;
  assert.ok(regular.squads[0].run);
  assert.ok(capped.squads[0].run);
  const a = regular.squads[0].run,
    b = capped.squads[0].run;
  assert.equal(a.target, b.target);
  for (let i = 0; i < a.enemies.length; i++)
    assert.equal(b.enemies[i].nextAt - a.enemies[i].nextAt, 43200000);
  assert.doesNotThrow(() => parseBundle(bundle(capped)));
});
