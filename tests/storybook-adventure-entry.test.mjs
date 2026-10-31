import test from "node:test";
import assert from "node:assert/strict";
import { afterAdventureCue } from "../lib/storybook/adventure-entry.ts";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { stageBackground } from "../lib/storybook/stage-images.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
import { sampleJourney } from "../lib/story-stage-travel.ts";
import { sampleExtraTravel } from "../lib/story-stage-extra-travel.ts";
import { act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { stories } from "../lib/stories.ts";
import { restorationHandoffState } from "../lib/restoration-handoff.ts";

const id = "tower-moss-removal-return",
  quest = "tower-moss-removal";

test("a watched work ending enters at the front without repeating the inspection or unloading the same basket twice", () => {
  const replay = studyCue(id, 0, true),
    saved = JSON.stringify(replay);
  assert.equal(afterAdventureCue(id, undefined, replay), replay);
  assert.equal(afterAdventureCue(id, "other-quest", replay), replay);
  const arrival = afterAdventureCue(id, quest, replay);
  assert.equal(stageBackground(id, 0, arrival), "/storybook-study/tower-front-dusk-v1.png");
  assert.equal(
    stageBackground(id, 0, replay),
    "/storybook-study/drain-inspection-empty-dusk-v1.png",
  );
  assert.ok(arrival.finishBeforeAdvance && arrival.cut);
  assert.ok(
    !arrival.items.some((item) => item.id.startsWith("inspection-") || item.id === "last-basket"),
  );
  assert.ok(arrival.extras.every((extra) => extra.id === "keeper"));
  const tool = arrival.items.find((item) => item.id === "spatula");
  assert.equal(tool.actor, "aria");
  assert.equal(JSON.stringify(replay), saved, "library replay is unchanged");
  assert.equal(afterAdventureCue(id, quest, null), null);
});

test("the group enters in a spaced line and reaches the positions used by the keeper's next speech", () => {
  const cue = stageCameraCue(afterAdventureCue(id, quest, studyCue(id, 0, true)));
  const next = studyCue(id, 1, true),
    motion = cue.sequence[0];
  for (let t = 0; t <= 9000; t += 50) {
    const actors = cue.actors.map((actor) =>
      sampleJourney(
        actor,
        { x: cue.initial[actor.id], bottom: cue.initialBottom[actor.id] },
        t,
        false,
      ),
    );
    const keeper =
      t < motion.after
        ? cue.extras[0]
        : sampleExtraTravel(motion.extras[0], cue.extras[0], t - motion.after, false);
    assert.ok(Math.abs(actors[0].x - actors[1].x) > 12);
    for (const actor of actors)
      assert.ok(Math.hypot(actor.x - keeper.x, ((actor.bottom - keeper.bottom) * 2) / 3) > 12);
    for (const foot of [...actors, keeper])
      for (const prop of cue.items.filter((item) => item.art === "stone" || item.id === "tools"))
        if (Math.abs(foot.x - prop.x) < prop.width / 2 + 1.5)
          assert.ok(
            foot.bottom < prop.bottom - 3 || foot.bottom > prop.bottom + 7,
            "boots avoid the seats and tool pile",
          );
  }
  for (const actor of cue.actors) {
    const at = sampleJourney(
      actor,
      { x: cue.initial[actor.id], bottom: cue.initialBottom[actor.id] },
      9000,
      false,
    );
    assert.equal(at.x, next.actors.find((a) => a.id === actor.id).x);
  }
  const keeper = sampleExtraTravel(motion.extras[0], cue.extras[0], 9000 - motion.after, false);
  assert.equal(keeper.x, next.extras[0].x);
  assert.equal(keeper.bottom, next.extras[0].bottom);
});

test("a save completion alone or a skipped visual ending never counts as watched work", () => {
  const start = act(
    testState(
      1000,
      storyStages.findIndex((s) => s.quest === quest),
      40,
      10000,
    ),
    { type: "start", id: quest, readDeparture: true, value: false },
    1000,
  );
  const done = settle(start, 3601000),
    saved = JSON.stringify(done);
  const input = {
    enabled: true,
    quest,
    squad: done.squads[0],
    ending: stories.find((s) => s.id === id),
    view: "adventure",
    sheet: null,
    ready: true,
    snapshot: start.squads[0],
    finished: null,
  };
  const waiting = restorationHandoffState(input);
  assert.ok(waiting.waiting && !waiting.completed);
  assert.equal(restorationHandoffState({ ...input, finished: waiting.key }).completed, true);
  for (const override of [
    { snapshot: null },
    { skipped: waiting.key },
    { finished: "other-run" },
    { enabled: false },
  ])
    assert.equal(
      restorationHandoffState({ ...input, finished: waiting.key, ...override }).completed,
      false,
    );
  assert.equal(JSON.stringify(done), saved);
});
