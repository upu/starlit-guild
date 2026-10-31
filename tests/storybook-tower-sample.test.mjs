import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue } from "../lib/story-stage.ts";
import { towerSampleCue } from "../lib/storybook/tower-sample.ts";

test("collection approaches with an empty tray before transferring moss, and keeps the keeper present", () => {
  const source = storyStageCue("tower-road-return", 19);
  const before = JSON.stringify(source);
  const cue = towerSampleCue(source, 19);
  assert.equal(cue.finishBeforeAdvance, true);
  assert.equal(
    cue.items.some((item) => item.id === "sample"),
    false,
  );
  assert.equal(cue.items.find((item) => item.id === "sample-tray").actor, "leon");
  assert.equal(cue.sequence[0].items.find((item) => item.id === "sample").actor, "aria");
  const last = cue.sequence.at(-1);
  assert.equal(last.items.find((item) => item.id === "sample").actor, "leon");
  assert.ok(cue.sequence.every((step) => step.extras.some((extra) => extra.id === "keeper")));
  assert.equal(storyStageCue("tower-road-return", 20), null, "the next line remains a still");
  assert.equal(last.actors.find((actor) => actor.id === "aria").inspect, false);
  assert.equal(JSON.stringify(source), before);
});
