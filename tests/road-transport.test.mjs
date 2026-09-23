import { test } from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState, allQuests } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { damageEnemy } from "../lib/combat.ts";
import { combination } from "../lib/game-run.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
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

test("a living member takes over pulling when the lead carrier falls", () => {
  let state = start(0, 12);
  while (state.squads[0].run.phase !== "work")
    state = settle(state, state.squads[0].run.nextAt).state;
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
  assert.equal(handoff.battle.heroes.find((hero) => hero.id === "aria").lane, 0.82);
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
      state = settle(state, run.nextAt).state;
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
    state = settle(state, state.squads[0].run.nextAt).state;
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
    settle(restored, state.updatedAt + 3000).state,
    JSON.parse(JSON.stringify(settle(state, state.updatedAt + 3000).state)),
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
