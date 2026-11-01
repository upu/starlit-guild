import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue, sampleStageActor } from "../lib/story-stage.ts";
import { deliveryBoxTarget } from "../lib/story-stage-props.ts";
import { sharedPickupCue } from "../lib/storybook/shared-pickup.ts";

test("the pair grips a supported box before lifting without shifting its horizontal center", () => {
  const original = storyStageCue("town-deliveries-departure", 14);
  const before = JSON.stringify(original);
  const cue = sharedPickupCue(original, 14);
  const lift = cue.sequence[0];
  assert.equal(cue.box, "table");
  assert.equal(cue.finishBeforeAdvance, true);
  assert.ok(lift.after >= 600);
  for (const actor of cue.actors) {
    const pose = sampleStageActor(actor, actor, 600, false);
    assert.equal(pose.frame, 8, "hands stay lowered through the preparation");
    const after = lift.actors.find((a) => a.id === actor.id);
    assert.equal(after.x, actor.x);
    assert.equal(after.bottom, actor.bottom);
    assert.equal(after.carry, true);
  }
  const start = deliveryBoxTarget("table", 30, 43);
  const end = deliveryBoxTarget("shared", 30, 43, 14, 14);
  assert.equal(start.x + cue.boxOffset.x, end.x + lift.boxOffset.x);
  assert.ok(end.bottom + lift.boxOffset.bottom > start.bottom);
  assert.equal(JSON.stringify(original), before);
});
