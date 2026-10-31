import test from "node:test";
import assert from "node:assert/strict";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { storybookPresentation, storybookStageAttributes } from "../lib/storybook/presentation.ts";

test("the painted masonry stays still while a solid lid is opened at the keeper's narrated action", () => {
  const id = "tower-moss-removal-departure";
  assert.equal(storybookPresentation(id, "drain-cleared", 0).art, "drain-inspection-bare-v1");
  assert.equal(storybookPresentation(id, "drain-cleared", 1).art, "drain-inspection-bare-v1");
  assert.equal(storybookStageAttributes(id, 0)["data-inspection-open"], false);
  assert.equal(storybookStageAttributes(id, 1)["data-inspection-open"], true);
  const opening = studyCue(id, 1, true);
  assert.equal(opening.finishBeforeAdvance, true);
  assert.ok(!opening.items.some((item) => item.art === "inspection-glow"));
  assert.ok(
    opening.sequence.some((beat) => beat.items.some((item) => item.art === "inspection-glow")),
  );
});

test("moss enters the supported basket after collection and stays through the next portion", () => {
  const id = "tower-moss-removal-departure";
  assert.ok(!studyCue(id, 9, true).items.some((item) => item.id === "collected"));
  const collected = studyCue(id, 10, true);
  assert.equal(collected.finishBeforeAdvance, true);
  assert.equal(collected.items.find((item) => item.id === "collected").carrier, undefined);
  for (const cue of [
    collected.sequence[0],
    studyCue(id, 16, true),
    studyCue(id, 17, true),
    storybookExitCue(id),
  ]) {
    assert.equal(cue.items.find((item) => item.id === "collected").carrier, "basket");
    assert.equal(cue.items.find((item) => item.id === "basket").actor, "leon");
    assert.equal(cue.actors.find((actor) => actor.id === "leon").carry, true);
  }
  assert.ok(storybookExitCue(id).actors.some((actor) => actor.x > 100 || actor.x < 0));
});
