import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";

test("night lantern occupies one hand while the jar remains supported by the other", () => {
  const cue = studyCue("moss-night-road-return", 0, true);
  const leon = cue.actors.find((actor) => actor.id === "leon");
  assert.equal(leon.lanternHold, true);
  assert.ok(!cue.items.some((item) => item.actor === "leon" && item.art === "lantern"));
  assert.ok(
    cue.items.some((item) => item.actor === "leon" && item.art === "moss-jar" && item.wrist),
  );
  for (const elapsed of [0, 180, 360, 540]) {
    const pose = actorPose(leon, true, elapsed, false);
    assert.equal(pose.frame, 4 + elapsed / 180);
    const sample = sampleStageActor({ ...leon, x: 95 }, { x: 10, bottom: 14 }, elapsed);
    assert.ok(sample.wrist, "jar support must exist throughout walking");
  }
  assert.equal(actorPose(leon, true, 540, true).frame, 4);
});

test("painted lantern poses retain the standing scale and foot baseline", async () => {
  for (const id of ["aria", "leon"]) {
    const frames = JSON.parse(
      await readFile(`public/storybook-study/${id}-lantern-metrics.json`, "utf8"),
    );
    assert.equal(frames.length, 8);
    for (const frame of frames) {
      assert.equal(frame.scale, frames[0].scale);
      assert.equal(frame.top + frame.height, 176);
      assert.ok(Math.abs(frame.height - frames[0].height) <= 5);
      assert.ok(frame.left >= 0 && frame.left + frame.width <= 192);
    }
  }
});

test("Aria retains the jar and shoulder wrap while both lanterns leave by the fork", () => {
  const cue = storybookExitCue("moss-night-road-return");
  const aria = cue.actors.find((actor) => actor.id === "aria");
  assert.equal(aria.shawl, true);
  assert.equal(aria.lanternHold, true);
  assert.ok(cue.actors.every((actor) => actor.lanternHold));
  assert.ok(!cue.items.some((item) => item.art === "lantern"));
  assert.ok(cue.items.some((item) => item.art === "moss-jar" && item.actor === "aria"));
  for (const actor of cue.actors) {
    assert.equal(actor.via[0].bottom, 42);
    assert.ok(actor.via[0].x >= 42 && actor.via[0].x <= 58);
    assert.ok(actor.via.every((p, i, all) => i === 0 || p.bottom > all[i - 1].bottom));
  }
});
