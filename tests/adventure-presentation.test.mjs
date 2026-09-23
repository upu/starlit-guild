import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { initialPrologueState, act, settle, testState, allQuests } from "../lib/game.ts";
import {
  adventureFrame,
  adventureAssets,
  adventureAction,
  adventureHit,
} from "../lib/adventure-presentation.ts";
import { rendererSession } from "../app/phaser/renderer-session.ts";
import { nextStage } from "../lib/prologue.ts";
const OPENING = nextStage(initialPrologueState(0)).quest;
const begin = (s = initialPrologueState(1000)) =>
  act(s, { type: "start", id: nextStage(s).quest }, s.updatedAt);
const input = (state, extra = {}) => ({
  squad: state.squads[0],
  startQuest: OPENING,
  now: state.updatedAt,
  ready: true,
  paused: false,
  ...extra,
});

test("rendering many frames interpolates independently without advancing or modifying the save", () => {
  const state = begin(),
    before = structuredClone(state);
  const first = adventureFrame(input(state), 1000),
    middle = adventureFrame(input(state), 1400);
  assert.ok(middle.members[0].x > first.members[0].x);
  for (let now = 1000; now < 12000; now += 16) adventureFrame(input(state), now);
  assert.deepEqual(state, before);
  assert.deepEqual(settle(state, 20000), settle(before, 20000));
});

test("every quest uses existing assets and no sprites outside the atlas or original art", () => {
  for (const quest of allQuests) {
    const state = testState(1000, 18, 20, 100000);
    const source = input(state, { startQuest: quest.id });
    const frame = adventureFrame(source);
    assert.equal(frame.quest.id, quest.id);
    for (const path of adventureAssets(frame))
      assert.ok(existsSync(new URL("../public" + path, import.meta.url)), path);
  }
});

test("canvas hit priority dispatches exactly one action and healing never hits the target", () => {
  const state = begin();
  state.squads[0].run.health.aria.hp = 10;
  const source = input(state),
    frame = adventureFrame(source, 4000),
    hero = frame.members[0];
  for (const [w, h] of [
    [320, 280],
    [430, 600],
    [1100, 680],
  ]) {
    const intent = adventureHit(frame, { x: hero.x * w, y: hero.y * h - 15 }, w, h);
    assert.equal(intent, "heal:aria");
    const action = adventureAction(source, intent),
      after = act(state, action, 1000);
    assert.ok(after.squads[0].run.health.aria.hp > state.squads[0].run.health.aria.hp);
    assert.equal(after.squads[0].run.health.leon.hp, state.squads[0].run.health.leon.hp);
    assert.equal(after.squads[0].run.target, state.squads[0].run.target);
    assert.equal(
      adventureHit(frame, { x: frame.target.x * w, y: frame.target.y * h - 10 }, w, h),
      "help",
    );
  }
  assert.equal(adventureAction(input(initialPrologueState(1000)), "help"), null);
  for (const extra of [{ ready: false }, { paused: true }])
    for (const intent of ["help", "heal"])
      assert.equal(adventureAction(input(state, extra), intent), null);
  for (const health of Object.values(state.squads[0].run.health)) health.hp = health.maxHp;
  assert.equal(adventureAction(input(state), "heal"), null);
  for (const health of Object.values(state.squads[0].run.health)) health.hp = 0;
  state.squads[0].run.phase = "rest";
  assert.equal(adventureAction(input(state), "help").mode, "heal");
});

test("renderer mount cancellation prevents late imports from creating an orphan canvas", async () => {
  let resolve,
    created = 0;
  const loading = new Promise((r) => {
    resolve = r;
  });
  const bridge = { read: () => input(initialPrologueState(1000)), act: () => {}, status: () => {} };
  const session = rendererSession({}, bridge, () => loading);
  session.destroy();
  session.destroy();
  resolve(() => {
    created++;
    return { destroy() {}, resize() {}, setPaused() {} };
  });
  await session.started;
  assert.equal(created, 0);
});

test("renderer receives the latest state, resize and pause; cleanup blocks callbacks and destroys once", async () => {
  let source = input(initialPrologueState(1000)),
    bridgeRef,
    destroyed = 0,
    actions = 0,
    statuses = 0;
  const calls = [];
  const session = rendererSession(
    {},
    { read: () => source, act: () => actions++, status: () => statuses++ },
    async () => (_parent, bridge) => {
      bridgeRef = bridge;
      return {
        destroy() {
          destroyed++;
        },
        resize(w, h) {
          calls.push(["size", w, h]);
        },
        setPaused(p) {
          calls.push(["pause", p]);
        },
      };
    },
  );
  session.resize(320, 420);
  session.setPaused(true);
  await session.started;
  assert.deepEqual(calls, [
    ["size", 320, 420],
    ["pause", true],
  ]);
  bridgeRef.act({ type: "assist" });
  assert.equal(actions, 0);
  source = { ...source, startQuest: "crystal" };
  assert.equal(bridgeRef.read().startQuest, "crystal");
  session.setPaused(false);
  bridgeRef.act({ type: "assist" });
  assert.equal(actions, 1);
  bridgeRef.status("ready");
  assert.equal(statuses, 1);
  session.destroy();
  session.destroy();
  bridgeRef.act({ type: "assist" });
  bridgeRef.status("error");
  session.resize(600, 500);
  assert.equal(destroyed, 1);
  assert.equal(actions, 1);
  assert.equal(statuses, 1);
});

test("a failed renderer reports an error and a separate retry can start cleanly", async () => {
  const statuses = [];
  const original = console.error;
  console.error = () => {};
  try {
    const bridge = {
      read: () => input(initialPrologueState(1000)),
      act: () => {},
      status: (s) => statuses.push(s),
    };
    const failed = rendererSession({}, bridge, async () => {
      throw Error("chunk unavailable");
    });
    await failed.started;
    assert.deepEqual(statuses, ["error"]);
    failed.destroy();
    let started = 0;
    const retry = rendererSession({}, bridge, async () => () => {
      started++;
      return { destroy() {}, resize() {}, setPaused() {} };
    });
    await retry.started;
    assert.equal(started, 1);
    retry.destroy();
  } finally {
    console.error = original;
  }
});

test("renderer setup failure destroys the partially initialized instance", async () => {
  let destroyed = 0;
  const statuses = [],
    original = console.error;
  console.error = () => {};
  try {
    const session = rendererSession(
      {},
      {
        read: () => input(initialPrologueState(1000)),
        act: () => {},
        status: (s) => statuses.push(s),
      },
      async () => () => ({
        destroy() {
          destroyed++;
        },
        resize() {
          throw Error("resize failed");
        },
        setPaused() {},
      }),
    );
    session.resize(320, 440);
    await session.started;
    assert.equal(destroyed, 1);
    assert.deepEqual(statuses, ["error"]);
    session.destroy();
    assert.equal(destroyed, 1);
  } finally {
    console.error = original;
  }
});
