import test from "node:test";
import assert from "node:assert/strict";
import { studyCue } from "../lib/storybook/carry-cue.ts";

test("cloth passes and returns before the pair separate, preserving bystanders", () => {
  const cue = studyCue("tower-restoration-return", 13, true);
  assert.equal(cue.finishBeforeAdvance, true);
  const moments = [cue, ...cue.sequence];
  assert.deepEqual(
    moments.map((beat) => beat.items.find((item) => item.art === "cloth").actor),
    ["aria", "leon", "aria", "aria"],
  );
  for (const beat of moments) {
    assert.deepEqual(
      beat.extras.map((extra) => extra.id),
      cue.extras.map((extra) => extra.id),
    );
    const cloth = beat.items.find((item) => item.art === "cloth");
    assert.equal(cloth.wrist, true);
    assert.equal(beat.actors.find((actor) => actor.id === cloth.actor).carry, true);
    assert.equal(beat.items.find((item) => item.art === "basket").bottom, 6);
  }
  assert.ok(cue.sequence[2].after - cue.sequence[1].after >= 650);
  assert.ok(
    cue.sequence[2].actors.find((actor) => actor.id === "leon").x >
      cue.sequence[1].actors.find((actor) => actor.id === "leon").x,
  );
});
