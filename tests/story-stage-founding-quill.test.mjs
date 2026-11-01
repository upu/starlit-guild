import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue } from "../lib/story-stage.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { extraTravelDuration } from "../lib/story-stage-extra-travel.ts";

test("the clerk brings a quill, reaches the table before releasing it, and leaves it there", () => {
  const cue = (line) => storyStageCue("starlit-guild-founding-return", line);
  const pen = (s) => s.items.find((p) => p.id === "clerk-quill");
  for (let line = 22; line < 42; line++) {
    const c = cue(line);
    for (const s of [c, ...(c.sequence ?? [])]) {
      assert.equal(pen(s).extra, "merchant");
      assert.equal(pen(s).width, 2);
    }
  }
  const c = cue(42);
  const reach = c.sequence.find((s) => s.after === 2000);
  const release = c.sequence.find((s) => s.after === 5400);
  const leave = c.sequence.find((s) => s.after === 6200);
  const clerk = reach.extras.find((e) => e.id === "merchant");
  const original = c.extras.find((e) => e.id === "merchant");
  const positions = new Map([
    ["extra:merchant", { ...clerk, wrist: stageExtraWrist(clerk, false, 0) }],
  ]);
  assert.deepEqual(
    stageItemTarget(pen(reach), c, positions),
    stageItemTarget(pen(release), c, positions),
  );
  assert.ok(release.after - reach.after > extraTravelDuration(clerk, original));
  assert.ok(leave.after - release.after >= 650);
  for (let line = 43; line <= 66; line++) {
    const c = cue(line);
    for (const s of [c, ...(c.sequence ?? [])]) {
      assert.equal(pen(s).extra, undefined);
      assert.equal(pen(s).support, "table");
      assert.equal(pen(s).width, 2);
    }
  }
});

test("the landlord remains present while the registration continues", () => {
  for (let line = 22; line <= 66; line++) {
    const cue = storyStageCue("starlit-guild-founding-return", line);
    for (const state of [cue, ...(cue.sequence ?? [])]) {
      const landlord = state.extras.find((extra) => extra.id === "keeper");
      assert.equal(landlord?.x, 26, `landlord disappears during line ${line + 1}`);
      assert.equal(landlord.bottom, 36);
    }
  }
});
