import { test } from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState, allQuests } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { damageEnemy } from "../lib/combat.ts";
import { combination, configureTarget, schedule } from "../lib/game-run.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { roadY } from "../lib/road-layout.ts";
import { travellerLane } from "../lib/road-view.ts";
import { roadHasEnemies } from "../lib/chapter-road.ts";
import {
  movingWork,
  roadPuller,
  workPoint,
  ROAD_CARRY_DISTANCE,
  ROAD_CARRY_SPEED,
} from "../lib/chapter-road.ts";

function start(index, level) {
  return act(
    testState(1000, index, level, 1000),
    {
      type: "start",
      id: storyStages[index].quest,
      value: false,
      readDeparture: true,
    },
    1000,
  );
}
const quest = (run) => allQuests.find((q) => q.id === run.quest);

test("legacy Merrill routes leave the cart formation during the ambush and resume afterward", () => {
  let state = start(34, 25);
  state.squads[0].run.nodes = 15;
  configureTarget(state.squads[0].run, quest(state.squads[0].run));
  schedule(state, state.squads[0], state.squads[0].run, state.updatedAt);
  let defended = false,
    resumed = false;
  while (state.squads[0].run && !resumed && state.updatedAt < 600000) {
    const run = state.squads[0].run;
    const before = structuredClone(run);
    const { battle, look } = chapterRoadFrame({
      squad: state.squads[0],
      now: run.road.at,
      ready: true,
      paused: false,
    });
    if (run.enemies.some((enemy) => enemy.trick === "merrill") && roadHasEnemies(run)) {
      defended = true;
      assert.deepEqual(look.workers, []);
      const leon = battle.heroes.find((hero) => hero.id === "leon");
      assert.equal(
        leon.x,
        run.road.members.leon.x,
        "pulling offset must not move Leon through the enemies",
      );
      assert.equal(leon.lane, travellerLane("leon"));
      assert.equal(new Set(battle.heroes.map((hero) => hero.lane)).size, 5);
      const lico = battle.heroes.find((hero) => hero.id === "lico");
      assert.ok(lico.lane > 0.82, "Lico is in front of the cart, not hidden behind it");
      assert.deepEqual(run, before, "drawing must not change saved combat");
    } else if (defended && look.workers.length === 5 && battle.gathering?.task === "carry") {
      resumed = true;
      const cartX = battle.gathering.x + 65;
      assert.equal(look.frontCarriers.length, 2);
      for (const id of look.frontCarriers)
        assert.ok(battle.heroes.find((hero) => hero.id === id).x > cartX + 50);
      const pushers = battle.heroes.filter((hero) => !look.frontCarriers.includes(hero.id));
      assert.deepEqual(pushers.map((hero) => hero.lane).sort(), [0.68, 0.82, 0.96]);
      assert.ok(pushers.every((hero) => hero.x < cartX - 40));
    }
    state = settle(state, run.nextAt);
  }
  assert.ok(defended && resumed);
});

test("a living member takes over pulling when the lead carrier falls", () => {
  let state = start(0, 12);
  while (state.squads[0].run.phase !== "work") state = settle(state, state.squads[0].run.nextAt);
  const run = state.squads[0].run;
  const q = quest(run);
  assert.equal(roadPuller(q, run), "leon");
  const before = { ...run.road.members.leon };
  const frame = chapterRoadFrame({
    squad: state.squads[0],
    startQuest: run.quest,
    now: run.road.at,
    ready: true,
    paused: false,
  });
  assert.equal(frame.look.puller, "leon");
  assert.deepEqual(frame.look.frontCarriers, ["leon"]);
  assert.deepEqual(run.road.members.leon, before);
  run.health.leon.hp = 0;
  assert.equal(roadPuller(q, run), "aria");
  const handoff = chapterRoadFrame({
    squad: state.squads[0],
    startQuest: run.quest,
    now: run.road.at,
    ready: true,
    paused: false,
  });
  assert.equal(handoff.look.puller, "aria");
  assert.deepEqual(handoff.look.frontCarriers, ["aria"]);
  assert.equal(handoff.battle.heroes.find((hero) => hero.id === "aria").lane, 0.82);
});

test("four carriers form side-by-side pairs centered on the cart's ground line", () => {
  let state = start(24, 12);
  while (state.squads[0].run.phase !== "work") state = settle(state, state.squads[0].run.nextAt);
  let frame;
  for (let step = 0; step < 100; step++) {
    const run = state.squads[0].run;
    frame = chapterRoadFrame({
      squad: state.squads[0],
      startQuest: run.quest,
      now: state.updatedAt,
      ready: true,
      paused: false,
    });
    if (frame.look.workers.length === 4) break;
    state = settle(state, run.nextAt);
  }
  assert.equal(frame.look.workers.length, 4);
  assert.equal(frame.battle.gathering.task, "carry");
  assert.equal(frame.battle.heroes.length, 4);
  const cartFeet = roadY(0.82, 200);
  assert.equal(frame.look.frontCarriers.length, 2);
  const cartX = frame.battle.gathering.x + 65;
  const pullers = frame.battle.heroes.filter((hero) => frame.look.frontCarriers.includes(hero.id));
  const pushers = frame.battle.heroes.filter((hero) => !frame.look.frontCarriers.includes(hero.id));
  assert.equal(pullers.length, 2);
  assert.equal(pushers.length, 2);
  for (const pair of [pullers, pushers]) {
    assert.deepEqual(pair.map((hero) => hero.lane).sort(), [0.7, 0.94]);
    assert.equal(pair.reduce((sum, hero) => sum + roadY(hero.lane, 200), 0) / 2, cartFeet);
    assert.ok(Math.abs(pair[0].x - pair[1].x) <= 40);
  }
  assert.ok(pullers.every((hero) => hero.x > cartX + 50));
  assert.ok(pushers.every((hero) => hero.x < cartX - 40));
});

test("2-5 checks the signpost in place, while its later carrying step remains transport", () => {
  const state = start(13, 12),
    run = state.squads[0].run;
  const frame = chapterRoadFrame({
    squad: state.squads[0],
    startQuest: run.quest,
    now: state.updatedAt,
    ready: true,
    paused: false,
  });
  assert.equal(frame.look.work.asset, "/animations/road/signpost-v2.webp");
  assert.equal(frame.battle.gathering.task, "inspect");
  assert.equal(movingWork(quest(run), run), false);
  run.node = 2;
  assert.equal(movingWork(quest(run), run), true);
});

test("transport covers the same distance at the same speed regardless of level", () => {
  const durations = [];
  for (const level of [1, 12, 30]) {
    let state = start(0, level),
      firstMovedAt,
      lastFraction = 1;
    for (let step = 0; step < 1000; step++) {
      const run = state.squads[0].run;
      if (run.node > 0) break;
      const fraction = run.target / run.targetMax;
      if (fraction < 1 && firstMovedAt === undefined) firstMovedAt = state.updatedAt;
      assert.ok(fraction <= lastFraction);
      assert.ok(
        Math.abs(workPoint(quest(run), run) - 180 - (1 - fraction) * ROAD_CARRY_DISTANCE) < 1e-8,
      );
      lastFraction = fraction;
      state = settle(state, run.nextAt);
    }
    assert.equal(state.squads[0].run.node, 1);
    assert.ok(
      state.updatedAt - firstMovedAt >= (ROAD_CARRY_DISTANCE / ROAD_CARRY_SPEED) * 1000 - 100,
    );
    durations.push(state.updatedAt);
  }
  assert.ok(Math.max(...durations) - Math.min(...durations) <= 100, JSON.stringify(durations));
});

test("attacks, special hits, combinations and tapping cannot skip transport distance", () => {
  let state = start(0, 30);
  while (state.squads[0].run.target === state.squads[0].run.targetMax)
    state = settle(state, state.squads[0].run.nextAt);
  const run = state.squads[0].run,
    before = run.target,
    position = workPoint(quest(run), run);
  damageEnemy(run, 99999, 99999, 0, "aria", true);
  combination(state, state.squads[0], state.updatedAt);
  for (let i = 0; i < 20; i++)
    state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
  assert.equal(state.squads[0].run.target, before);
  assert.equal(workPoint(quest(run), state.squads[0].run), position);
  const restored = JSON.parse(JSON.stringify(state));
  assert.deepEqual(
    settle(restored, state.updatedAt + 3000),
    JSON.parse(JSON.stringify(settle(state, state.updatedAt + 3000))),
  );
});

test("town packing stays in place; delivery addresses do not classify it as transport", () => {
  for (const [stage, nodes] of [
    [2, [0, 2]],
    [11, Array.from({ length: 15 }, (_, i) => i)],
  ]) {
    const state = start(stage, 12),
      run = state.squads[0].run;
    for (const node of nodes) {
      run.node = node;
      assert.equal(movingWork(quest(run), run), false, `${stage}:${node}`);
      const before = workPoint(quest(run), run);
      run.target *= 0.5;
      assert.equal(workPoint(quest(run), run), before);
      const frame = chapterRoadFrame({
        squad: state.squads[0],
        startQuest: run.quest,
        now: state.updatedAt,
        ready: true,
        paused: false,
      });
      assert.equal(frame.battle.gathering.task, "pack");
    }
  }
  const state = start(2, 12),
    run = state.squads[0].run;
  run.node = 1;
  assert.equal(movingWork(quest(run), run), true);
});
