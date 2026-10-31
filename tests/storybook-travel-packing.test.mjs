import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  sampleStageActor,
  stageTravel,
  storyStageCue,
  storyStageExitCue,
} from "../lib/story-stage.ts";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";

test("painted packing keeps kneeling bodies lower without rescaling heads or moving foot baselines", async () => {
  for (const id of ["aria", "leon"]) {
    const frames = JSON.parse(
      await readFile(`public/storybook-study/${id}-packing-metrics.json`, "utf8"),
    );
    for (const frame of frames) {
      assert.equal(frame.scale, frames[0].scale);
      assert.equal(frame.top + frame.height, 176);
    }
    if (id === "aria") assert.ok(frames[1].height < frames[0].height * 0.8);
    else assert.ok(Math.abs(frames[1].height - frames[0].height) <= 2);
  }
});

test("pulling keeps the prepared shaft gap and ground depth through the trade journeys", () => {
  for (const [id, last] of [
    ["village-trade-departure", 12],
    ["evening-trade-road-departure", 8],
    ["evening-trade-road-return", 12],
  ]) {
    const authored = storyStageCue(id, last),
      copy = structuredClone(authored);
    const waiting = studyCue(id, last, true).actors.find((actor) => actor.id === "leon");
    const exit = storybookExitCue(id),
      walking = exit.actors.find((actor) => actor.id === "leon");
    assert.equal(waiting.x - 64, walking.x - exit.cartX);
    assert.equal(waiting.x - 64, 25);
    assert.equal(waiting.bottom, walking.bottom);
    const display = stageCameraCue(exit);
    const mover = display.actors.find((actor) => actor.id === "leon");
    for (const elapsed of [0, 150, 600, 1200]) {
      const body = sampleStageActor(mover, waiting, elapsed, false);
      const cart = stageTravel(64, display.cartX, elapsed);
      assert.ok(Math.abs(body.x - cart.x - 25) < 0.001, `${id} at ${elapsed}ms`);
    }
    assert.deepEqual(authored, copy);
    assert.equal(storyStageExitCue(id).actors.find((actor) => actor.id === "leon").x, 156);
  }
});

test("Aria finishes tying first and waits for Leon before the return dialogue advances", () => {
  const cue = studyCue("evening-trade-road-return", 8, true);
  assert.equal(cue.finishBeforeAdvance, true);
  assert.ok(cue.actors.every((actor) => actor.packing));
  const [waiting, finished] = cue.sequence;
  assert.ok(waiting.after < finished.after);
  assert.equal(waiting.actors.find((actor) => actor.id === "aria").packing, false);
  assert.equal(waiting.actors.find((actor) => actor.id === "leon").packing, true);
  assert.ok(finished.actors.every((actor) => !actor.packing));
});
