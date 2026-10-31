import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";

test("doorway actions retain actor scale and full feet across their atlases", async () => {
  for (const [name, cell, sole, count] of [
    ["finn-door-balanced-v2", 192, 176, 4],
    ["cook-motion-v2", 128, 120, 8],
  ]) {
    const poses = JSON.parse(await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"));
    assert.equal(poses.length, count);
    for (const pose of poses) {
      assert.equal(pose.scale, poses[0].scale);
      assert.equal(pose.top + pose.height, sole);
      assert.ok(pose.left > 0 && pose.left + pose.width < cell);
      assert.ok(Math.abs(pose.height - poses[0].height) <= 3);
    }
  }
});

test("the cook approaches before shoulder contact and releases Finn before stepping aside", () => {
  const initial = studyCue("riverside-manor-departure", 0, true);
  assert.equal(initial.actors.find((actor) => actor.id === "finn").bottom, 54);
  const meeting = studyCue("riverside-manor-departure", 3, true);
  assert.equal(meeting.finishBeforeAdvance, true);
  const held = meeting.sequence.at(-1);
  assert.equal(held.extras[0].grip, "hold");
  assert.equal(held.extras[0].x, 71);
  assert.equal(held.extras[0].bottom, 23);
  assert.equal(held.actors.find((actor) => actor.id === "finn").pose, "surprise");
  assert.equal(held.actors.find((actor) => actor.id === "finn").left, false);
  const released = studyCue("riverside-manor-departure", 8, true).sequence.at(-1);
  assert.equal(released.extras[0].grip, undefined);
  assert.equal(released.extras[0].x, 80);
  assert.notEqual(released.actors.find((actor) => actor.id === "finn").pose, "surprise");
});

test("the doorway opens with the entrance and all scene luggage keeps its registered dimensions", () => {
  const widths = { basket: 5.5, "medicine-closed": 5.2, "delivery-bag": 7 };
  for (let line = 0; line < 14; line++) {
    const cue = studyCue("riverside-manor-departure", line, true);
    assert.equal(
      storybookPresentation("riverside-manor-departure", cue.background).art,
      line < 3 ? "manor-kitchen-v1" : "manor-kitchen-open-v1",
    );
    for (const step of [cue, ...(cue.sequence ?? [])]) {
      for (const item of step.items)
        if (widths[item.art]) assert.equal(item.width, widths[item.art]);
    }
  }
});
