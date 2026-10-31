import test from "node:test";
import assert from "node:assert/strict";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { storyCastImages } from "../lib/storybook/stage-images.ts";
import { stories } from "../lib/stories.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";

const id = "old-waterway-departure";
const prop = (s, id) => s.items.find((i) => i.id === id);
const cue = (line) => studyCue(id, line - 1, true);
const target = (state, parent, id) =>
  stageItemTarget(
    prop(state, id),
    { ...parent, ...state },
    new Map(state.actors.map((a) => [a.id, sampleStageActor(a, a, 10000, true)])),
  );
const same = (a, b) =>
  assert.ok(Math.hypot(a.x - b.x, a.bottom - b.bottom) < 0.01, JSON.stringify({ a, b }));

test("the opening shows two jars, and keeps the forest specimen distinct from the split bowls", () => {
  const first = cue(1),
    jars = first.items.filter((i) => i.art === "moss-jar");
  assert.equal(jars.length, 2);
  assert.ok(jars.every((i) => i.actor === "aria" && i.width === 3.6));
  assert.notEqual(jars[0].wristOffset.x, jars[1].wristOffset.x);
  for (let line = 6; line <= 26; line++) {
    const c = cue(line);
    assert.equal(prop(c, "forest-jar").width, 3.6);
    assert.equal(prop(c, "forest-knot").carrier, "forest-jar");
    assert.equal(prop(c, "near-sample").width, prop(c, "far-sample").width);
    assert.equal(prop(c, "far-sample").glow, undefined);
  }
});
test("each comparison bowl reaches the low hand before release without changing size", () => {
  const c = cue(5);
  assert.ok(c.finishBeforeAdvance);
  for (const [id, heldAt, releasedAt] of [
    ["near-sample", 5100, 5700],
    ["far-sample", 10800, 11400],
  ]) {
    const held = c.sequence.find((s) => s.after === heldAt),
      released = c.sequence.find((s) => s.after === releasedAt);
    same(target(held, c, id), target(released, c, id));
    assert.equal(prop(held, id).width, prop(released, id).width);
    assert.ok(held.actors.find((a) => a.id === "aria").inspect);
  }
  assert.ok(c.sequence.at(-1).actors.every((a) => !a.inspect && !a.carry));
});
test("the same cloth passes over both samples and only the near sample brightens", () => {
  const c = cue(8),
    near = c.sequence.find((s) => s.after === 1400),
    far = c.sequence.find((s) => s.after === 5000);
  assert.ok(!prop(c, "near-sample").glow);
  assert.equal(prop(near, "near-sample").glow, "bright");
  assert.equal(prop(near, "near-sample").shaded, true);
  assert.equal(prop(far, "far-sample").shaded, true);
  assert.equal(prop(far, "far-sample").glow, undefined);
  assert.equal(prop(near, "shade-cloth").id, prop(far, "shade-cloth").id);
  assert.ok(
    Math.abs(
      near.actors.find((a) => a.id === "leon").x - far.actors.find((a) => a.id === "leon").x,
    ) > 30,
  );
});
test("the large archive stays on the slab while the copied sheet passes between matching palms", () => {
  const c = cue(26),
    receive = c.sequence.find((s) => s.after === 500),
    giveBack = c.sequence.at(-1);
  same(target(c, c, "field-copy"), target(receive, c, "field-copy"));
  same(target(receive, c, "field-copy"), target(giveBack, c, "field-copy"));
  assert.ok(c.sequence.some((s) => s.actors.some((a) => a.id === "aria" && a.writing)));
  assert.ok(c.finishBeforeAdvance);
  for (const s of [c, ...c.sequence]) {
    assert.equal(prop(s, "archive-map").support, "opening-slab");
    assert.ok(s.actors.every((a) => a.x < 100));
  }
  const exit = storybookExitCue(id);
  assert.ok(exit.actors.every((a) => a.x > 100));
  assert.equal(prop(exit, "field-copy").actor, "leon");
  assert.equal(prop(exit, "archive-map").actor, undefined);
});
test("the writing and carrying strips and all explicit props are prepared before the scene", () => {
  const prepared = new Set(storyCastImages(stories.find((s) => s.id === id)));
  for (const name of [
    "aria-paper-v1",
    "leon-paper-v1",
    "aria-carry-v1",
    "leon-carry-v1",
    "aria-paper-walk-v1",
    "leon-paper-walk-v2",
    "moss-jar-v1",
    "moss-jar-open-v1",
    "berne-rest-ledge-v1",
  ])
    assert.ok(prepared.has(`/storybook-study/${name}.webp`), name);
});

test("Aria returns from the wall around the stone slab before pointing to the archive", () => {
  const before = cue(16).actors.find((a) => a.id === "aria"),
    c = cue(17);
  const actor = c.actors.find((a) => a.id === "aria"),
    slab = prop(c, "opening-slab");
  for (let time = 0; time <= journeyDuration(actor, before); time += 25) {
    const p = sampleJourney(actor, before, time, false),
      foot = p.bottom + 2.25;
    const overSlab =
      p.x > slab.x - slab.width / 2 &&
      p.x < slab.x + slab.width / 2 &&
      foot >= slab.bottom &&
      foot < slab.bottom + 9;
    assert.equal(overSlab, false, JSON.stringify({ time, p }));
  }
  for (const step of c.sequence.filter((s) => s.after < 2300))
    assert.deepEqual(step.actors.find((a) => a.id === "aria").via, actor.via);
});
