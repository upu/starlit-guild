import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, act, settle } from "../lib/game.ts";
import { adventureFrame, adventureAction } from "../lib/adventure-presentation.ts";
import { rendererSession } from "../app/phaser/renderer-session.ts";
import { nextStage } from "../lib/prologue.ts";
const OPENING = nextStage(initialState(0)).quest;
const begin = (s = initialState(1000)) =>
  act(s, { type: "start", id: nextStage(s).quest }, s.updatedAt);
const input = (state, extra = {}) => ({
  squad: state.squads[0],
  startQuest: OPENING,
  now: state.updatedAt,
  ready: true,
  paused: false,
  ...extra,
});

test("rendering many frames never advances or modifies the save", () => {
  const state = begin(),
    before = structuredClone(state);
  for (let now = 1000; now < 12000; now += 16) adventureFrame(input(state), now);
  assert.deepEqual(state, before);
  assert.deepEqual(settle(state, 20000), settle(before, 20000));
});

test("a tap dispatches exactly one action and healing never hits the target", () => {
  const state = begin();
  state.squads[0].run.health.aria.hp = 10;
  const source = input(state),
    action = adventureAction(source, "heal:aria"),
    after = act(state, action, 1000);
  assert.ok(after.squads[0].run.health.aria.hp > state.squads[0].run.health.aria.hp);
  assert.equal(after.squads[0].run.health.leon.hp, state.squads[0].run.health.leon.hp);
  assert.equal(after.squads[0].run.target, state.squads[0].run.target);
  assert.equal(adventureAction(source, "help").mode, "strike");
  assert.equal(adventureAction(input(initialState(1000)), "help"), null);
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
  const bridge = { read: () => input(initialState(1000)), act: () => {}, status: () => {} };
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
  let source = input(initialState(1000)),
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
      read: () => input(initialState(1000)),
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
        read: () => input(initialState(1000)),
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
