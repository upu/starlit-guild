import test from "node:test";
import assert from "node:assert/strict";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { actorPose } from "../lib/story-stage-pose.ts";

test("basket size and supporting palm remain consistent during standing and departure", () => {
  const pickup = studyCue("tower-restoration-return", 16, true);
  for (const cue of [
    { ...pickup, ...pickup.sequence.at(-1) },
    storybookExitCue("tower-restoration-return"),
  ]) {
    const basket = cue.items.find((item) => item.art === "basket");
    const leon = cue.actors.find((actor) => actor.id === "leon");
    assert.equal(basket.width, 8);
    assert.equal(basket.actor, "leon");
    assert.equal(basket.wristAnchor, "bottom");
    assert.equal(leon.carry, true);
    assert.equal(cue.items.find((item) => item.art === "tools").bottom, 72);
    const frames = new Set(
      [0, 130, 260, 390].map((elapsed) => actorPose(leon, true, elapsed, false).frame),
    );
    assert.equal(frames.size, 4);
    for (const frame of frames) assert.ok(leon.wristPoints[frame]);
  }
});

test("leave the basket where Aria asks, including the exit cue", () => {
  for (const cue of [
    studyCue("tower-restoration-departure", 14, true),
    studyCue("tower-restoration-departure", 15, true),
    storybookExitCue("tower-restoration-departure"),
  ]) {
    assert.equal(cue.items.find((item) => item.art === "basket").actor, undefined);
    assert.equal(cue.actors.find((actor) => actor.id === "leon").carry, false);
  }
});
