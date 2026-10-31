import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";

const id = "garden-reception-departure";
const actor = (cue, name) => cue.actors.find((actor) => actor.id === name);
const item = (cue, name) => cue.items.find((item) => item.id === name);
test("pushing steps share their standing scale, complete boots and a natural lean", async () => {
  const poses = JSON.parse(
    await readFile("public/storybook-study/finn-push-balanced-v2-metrics.json", "utf8"),
  );
  assert.equal(poses.length, 8);
  assert.equal(poses[0].height, 148);
  for (const pose of poses) {
    assert.equal(pose.scale, poses[0].scale);
    assert.equal(pose.top + pose.height, 176);
    assert.ok(pose.left > 0 && pose.left + pose.width < 192);
  }
  for (const pose of poses.slice(1, 6)) assert.ok(pose.height <= 148 && pose.height >= 140);
});

test("the cart resumes from the parked position and follows all four pushing phases through the exit", () => {
  const first = studyCue(id, 0, true),
    resumed = studyCue(id, 17, true);
  const finn = actor(resumed, "finn"),
    cart = item(resumed, "reception-cart");
  const at = stageItemTarget(
    cart,
    resumed,
    new Map([["finn", sampleStageActor(finn, finn, 0, false)]]),
  );
  assert.ok(Math.abs(at.x - item(first, "reception-cart").x) < 0.05);
  assert.ok(Math.abs(at.bottom - item(first, "reception-cart").bottom) < 0.05);
  const paused = studyCue(id, 3, true);
  assert.equal(actor(paused, "finn").x, actor(first, "finn").x);
  assert.equal(actor(paused, "finn").bottom, actor(first, "finn").bottom);
  const exit = storybookExitCue(id),
    pusher = actor(exit, "finn");
  assert.equal(item(exit, "reception-cart").wrist, true);
  assert.deepEqual(pusher.carryWalkFrames, [8, 9, 22, 23]);
  assert.ok(pusher.via.every((point) => point.bottom < 53));
});

test("one luggage load keeps its dimensions, and the wrong route and physical interactions wait before advancing", () => {
  for (let line = 0; line < 18; line++) {
    const cue = studyCue(id, line, true);
    for (const step of [cue, ...(cue.sequence ?? [])]) {
      for (const part of step.items) {
        if (part.art === "garden-pot") assert.equal(part.width, 6);
        if (part.art === "tool-rucksack") assert.equal(part.width, 6.5);
        if (part.id === "replacement-parcel") assert.equal(part.width, 6.2);
      }
    }
    if (cue.sequence?.length) assert.equal(cue.finishBeforeAdvance, true);
  }
  const loop = studyCue(id, 2, true);
  assert.equal(loop.finishBeforeAdvance, true);
  assert.equal(actor(loop, "aria").via.length, 3);
});

test("Leon reaches the dropped fastening and kitchen before transferring the bag", () => {
  const cue = studyCue(id, 10, true),
    pickup = cue.sequence.find((step) => item(step, "loose-fastener").actor);
  assert.ok(
    journeyDuration(actor(cue, "leon"), actor(studyCue(id, 9, true), "leon")) < pickup.after,
  );
  assert.equal(item(pickup, "loose-fastener").wrist, true);
  const walk = cue.sequence.find((step) => actor(step, "leon").bottom === 76);
  const transfer = cue.sequence.find((step) => item(step, "tool-rucksack").extra);
  const start = cue.sequence[cue.sequence.indexOf(walk) - 1];
  assert.ok(
    journeyDuration(actor(walk, "leon"), actor(start, "leon")) < transfer.after - walk.after,
  );
  const returnToKitchen = cue.sequence.find((step) =>
    step.extras.some((extra) => extra.id === "cook" && extra.bottom === 86),
  );
  assert.equal(item(returnToKitchen, "tool-rucksack").wrist, true);
  assert.equal(item(cue.sequence.at(-1), "tool-rucksack").stored, true);
});
