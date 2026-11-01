import test from "node:test";
import assert from "node:assert/strict";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { storybookPresentation, storybookStageAttributes } from "../lib/storybook/presentation.ts";

test("the roadside diners retain chairs and leave Mira visible above the far table edge", () => {
  const cue = studyCue("berne-road-departure", 0, true);
  assert.equal(
    storybookPresentation("berne-road-departure", cue.background).art,
    "roadside-dining-v1",
  );
  for (const actor of cue.actors) {
    const chair = cue.items.find((item) => item.id === `chair-${actor.id}`);
    assert.ok(chair);
    assert.equal(chair.seatFor, undefined);
    assert.ok(chair.bottom > actor.bottom);
    assert.ok(Math.abs(chair.x - actor.x) < 2);
  }
  assert.equal(cue.actors.find((actor) => actor.id === "mira").bottom, 28);
  assert.equal(
    studyCue("berne-road-departure", 5, true),
    null,
    "the existing still retains precedence",
  );
});

test("Berne street luggage preserves painted grips and dimensions through departure", () => {
  assert.equal(
    storybookStageAttributes("berne-house-calls-departure", 0)["data-paper-study"],
    true,
  );
  const initial = studyCue("berne-house-calls-departure", 0, true);
  const exit = storybookExitCue("berne-house-calls-departure");
  for (const cue of [initial, exit]) {
    for (const item of cue.items.filter((item) => item.actor)) {
      assert.equal(item.wrist, true);
      assert.equal(item.width, initial.items.find((first) => first.id === item.id).width);
      assert.equal(cue.actors.find((actor) => actor.id === item.actor).carry, true);
    }
    assert.deepEqual(
      cue.actors.find((actor) => actor.id === "mira").carryWalkFrames,
      [8, 9, 22, 23],
    );
  }
  const writing = studyCue("berne-house-calls-departure", 5, true);
  assert.equal(writing.finishBeforeAdvance, true);
  assert.equal(writing.actors.find((actor) => actor.id === "leon").carry, false);
  assert.equal(writing.items.find((item) => item.id === "leon-bag").actor, undefined);
  assert.equal(writing.sequence.at(-1).actors.find((actor) => actor.id === "leon").carry, true);
});
