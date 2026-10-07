import { test } from "node:test";
import assert from "node:assert/strict";
import { testState, act } from "../lib/game.ts";
import { nextStage } from "../lib/prologue.ts";
import { adventureFrame } from "../lib/adventure-presentation.ts";
import { heroAnimation, heroSheets } from "../lib/hero-animation.ts";
import { readFileSync } from "node:fs";
import sharp from "sharp";

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

test("approved sheets have RGBA pixels and exact 384px square frames", () => {
  for (const id of ["aria", "leon", "mira"]) {
    const png = readFileSync(new URL(`../public${heroSheets[id].asset}`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(png.readUInt32BE(16), 1536);
    assert.equal(png.readUInt32BE(20), 1152);
    assert.equal(png[25], 6, "PNG must contain real RGBA, not a painted checkerboard");
  }
});

for (const [id, version] of [
  ["aria", 2],
  ["mira", 3],
])
  test(`${id}'s adventure slots retain walking, attack, blink and hurt semantics from the shared mini art`, async () => {
    const main = sharp(`assets/source/road/${id}-v${version}.png`),
      legacy = sharp(`public${heroSheets[id].asset}`);
    const order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 12, 11, 13];
    const extract = (source, pose) =>
      source
        .clone()
        .extract({
          left: (pose % 4) * 384,
          top: Math.floor(pose / 4) * 384,
          width: 384,
          height: 384,
        })
        .ensureAlpha()
        .raw()
        .toBuffer();
    for (const [slot, pose] of order.entries())
      assert.deepEqual(await extract(legacy, slot), await extract(main, pose));
    const still = await sharp(`public/characters/${id}-mini-v${version}.webp`)
      .ensureAlpha()
      .raw()
      .toBuffer();
    const idle = await extract(main, 8);
    for (let p = 0; p < idle.length; p += 4) {
      assert.equal(still[p + 3], idle[p + 3]);
      if (idle[p + 3]) assert.ok(still.subarray(p, p + 3).equals(idle.subarray(p, p + 3)));
    }
  });

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
  run.actors[0].arrivesAt = 5600;
  assert.deepEqual(
    [5000, 5150, 5300, 5450].map((t) => Number(pose(input, t).frame)).sort(),
    [0, 1, 2, 3],
  );
  assert.ok(Number(pose(input, 5600).frame) >= 8);
});

test("Mira walks with her own sheet and casts for healing as well as attacks", () => {
  const { input, run } = scene();
  run.actors.find((actor) => actor.hero === "mira").arrivesAt = 5600;
  assert.deepEqual(
    [5000, 5150, 5300, 5450].map((t) => Number(pose(input, t, "mira").frame)).sort(),
    [0, 1, 2, 3],
  );
  assert.equal(pose(input, 5600, "mira").asset, "/animations/mira-v3.png");
  event(run, 5700, "heal", "mira", "leon");
  assert.deepEqual(
    [5700, 5863, 6025, 6188].map((t) => pose(input, t, "mira").frame),
    ["4", "5", "6", "7"],
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
      ["4", "5", "6", "7"],
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
  assert.equal(pose(input, 5020).frame, "10");
  assert.equal(pose(input, 5180).frame, "11");
  assert.equal(pose(input, 5340).frame, "6");
  assert.ok(Number(pose(input, 5100, "leon").frame) >= 8);
  event(run, 5100, "hurt");
  assert.equal(pose(input, 5100, "leon").frame, "10");
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
