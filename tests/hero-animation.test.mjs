import { test } from "node:test";
import assert from "node:assert/strict";
import { testState, act } from "../lib/game.ts";
import { nextStage } from "../lib/prologue.ts";
import { adventureFrame } from "../lib/adventure-presentation.ts";
import { heroAnimation } from "../lib/hero-animation.ts";

// A stage the trio travels together, so Mira has her own actor on the map.
function scene(now = 5000) {
  const initial = testState(1000, 12, 1, 1000),
    quest = nextStage(initial).quest;
  const state = act(initial, { type: "start", id: quest }, 1000);
  const run = state.squads[0].run;
  run.phase = "work";
  run.events = [];
  for (const actor of run.actors) actor.arrivesAt = 2000;
  const input = { squad: state.squads[0], startQuest: quest, now, ready: true, paused: false };
  return { state, run, input };
}
const pose = (input, now = input.now, id = "aria", reduced = false) => {
  const frame = adventureFrame(input, now);
  return heroAnimation(
    frame.members.find((m) => m.id === id),
    frame,
    now,
    reduced,
  );
};

test("idle blink is brief and reduced motion keeps eyes open", () => {
  const { input } = scene();
  assert.equal(pose(input, 7000).frame, "8");
  assert.equal(pose(input, 7100).frame, "9");
  assert.equal(pose(input, 7200).frame, "8");
  assert.equal(pose(input, 7100, "aria", true).frame, "8");
});
function event(run, at, kind, hero, target) {
  run.events.push({
    id: `${run.round}-${run.node}-${at}-${kind}-0-${hero || "leader"}-${target || "none"}-1`,
    at,
    kind,
    hero,
    target,
    text: "",
  });
}

test("walking cycles use actual limb frames and settle into breathing when arrival completes", () => {
  const { input, run } = scene();
  run.actors[0].arrivesAt = 5800;
  assert.deepEqual(
    [5040, 5130, 5220, 5310, 5400, 5490, 5580, 5670]
      .map((t) => Number(pose(input, t).frame))
      .sort((a, b) => a - b),
    [0, 1, 2, 3, 4, 5, 6, 7],
  );
  assert.ok(Number(pose(input, 5800).frame) >= 8);
});

test("Mira walks with her own sheet and casts for healing as well as attacks", () => {
  const { input, run } = scene();
  run.actors.find((actor) => actor.hero === "mira").arrivesAt = 5800;
  assert.deepEqual(
    [5040, 5130, 5220, 5310, 5400, 5490, 5580, 5670]
      .map((t) => Number(pose(input, t, "mira").frame))
      .sort((a, b) => a - b),
    [0, 1, 2, 3, 4, 5, 6, 7],
  );
  assert.equal(pose(input, 5800, "mira").asset, "/adventure-pixel/mira.webp");
  event(run, 5700, "heal", "mira", "leon");
  assert.deepEqual(
    [5700, 5863, 6025, 6188].map((t) => pose(input, t, "mira").frame),
    ["10", "11", "12", "13"],
  );
  assert.equal(pose(input, 5800, "mira", true).frame, "8");
  assert.ok(Number(pose(input, 6350, "mira").frame) >= 8);
});

test("attack poses follow each hero event through recovery and never replay expired or foreign-node hits", () => {
  for (const id of ["aria", "leon", "mira"]) {
    const { input, run } = scene();
    event(run, 5000, "hit", id);
    assert.deepEqual(
      [5000, 5163, 5325, 5488].map((t) => pose(input, t, id).frame),
      ["10", "11", "12", "13"],
    );
    assert.ok(Number(pose(input, 5650, id).frame) >= 8);
    assert.ok(Number(pose(input, 4999, id).frame) >= 8);
    run.node++;
    assert.ok(Number(pose(input, 5100, id).frame) >= 8);
  }
});

test("hurt takes priority over attacking and addressed damage affects only its target", () => {
  const { input, run } = scene();
  event(run, 5000, "hit", "aria");
  event(run, 5020, "hurt", undefined, "aria");
  assert.equal(pose(input, 5020).frame, "16");
  assert.equal(pose(input, 5180).frame, "17");
  assert.equal(pose(input, 5340).frame, "12");
  assert.ok(Number(pose(input, 5100, "leon").frame) >= 8);
  event(run, 5100, "hurt");
  assert.equal(pose(input, 5100, "leon").frame, "16");
});

test("gathering, rest and reduced motion do not play combat poses", () => {
  const { input, run } = scene();
  event(run, 5000, "gather", "aria");
  assert.ok(Number(pose(input).frame) >= 8);
  assert.equal(pose(input, 5000, "aria", true).frame, "8");
  run.phase = "rest";
  assert.equal(pose(input).frame, "8");
});

test("frame selection preserves the save and unsupported heroes retain their current art", () => {
  const { input, state } = scene(),
    before = structuredClone(state);
  for (let now = 5000; now < 12000; now += 16) pose(input, now);
  assert.deepEqual(state, before);
  const frame = adventureFrame(input);
  assert.equal(heroAnimation({ ...frame.members[0], id: "chacha" }, frame, 5000), null);
});
