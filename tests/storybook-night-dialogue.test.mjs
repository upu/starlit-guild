import test from "node:test";
import assert from "node:assert/strict";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";

function jarPosition(cue, item) {
  const positions = new Map(
    cue.actors.map((actor) => [actor.id, sampleStageActor(actor, actor, 3000, true)]),
  );
  return stageItemTarget(item, cue, positions);
}

test("the night jar crosses between coincident palms after the approach", () => {
  const cue = studyCue("moss-night-road-return", 18, true);
  const received = { ...cue, ...cue.sequence.at(-1) };
  const before = cue.items.find((item) => item.art === "moss-jar");
  const after = received.items.find((item) => item.art === "moss-jar");
  assert.equal(before.actor, "leon");
  assert.equal(after.actor, "aria");
  assert.equal(cue.finishBeforeAdvance, true);
  assert.ok(cue.sequence[0].after >= 800);
  const a = jarPosition(cue, before),
    b = jarPosition(received, after);
  assert.ok(Math.abs(a.x - b.x) < 0.3, `jar x: ${a.x} -> ${b.x}`);
  assert.ok(Math.abs(a.bottom - b.bottom) < 0.3, `jar bottom: ${a.bottom} -> ${b.bottom}`);
  const following = studyCue("moss-night-road-return", 19, true);
  assert.equal(following.items.find((item) => item.art === "moss-jar").actor, "aria");
});

test("the shoulder wrap follows Leon's approach and does not appear beforehand", () => {
  const cue = studyCue("moss-night-road-departure", 15, true);
  assert.equal(cue.actors.find((a) => a.id === "aria").shawl, false);
  const cloth = cue.items.find((item) => item.id === "shoulder-cloth");
  assert.equal(cloth.actor, "leon");
  assert.equal(cloth.wrist, true);
  const final = cue.sequence.at(-1);
  assert.equal(final.actors.find((a) => a.id === "aria").shawl, true);
  assert.ok(!final.items.some((item) => item.id === "shoulder-cloth"));
  assert.equal(cue.finishBeforeAdvance, true);
  assert.ok(final.after >= 1400);
  assert.equal(final.items.find((item) => item.art === "moss-jar").actor, "aria");
});
