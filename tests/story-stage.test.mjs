import { test } from "node:test";
import assert from "node:assert/strict";
import { stories } from "../lib/stories.ts";
import {
  meetingStoryId,
  storyStageCue,
  stageEntrance,
  sampleStageActor,
} from "../lib/story-stage.ts";

test("only the opening meeting has staging, with a cue for every existing line", () => {
  const meeting = stories.find((story) => story.id === meetingStoryId);
  for (const story of stories) {
    story.lines.forEach((_, line) => {
      assert.equal(!!storyStageCue(story.id, line), story === meeting);
    });
  }
  assert.equal(storyStageCue(meetingStoryId, -1), null);
  assert.equal(storyStageCue(meetingStoryId, meeting.lines.length), null);
  assert.match(meeting.lines[4].text, /ずいぶん多くない/);
  assert.equal(meeting.lines[4].expression, "surprised");
  assert.equal(storyStageCue(meetingStoryId, 4).actors[0].reaction, "surprise");
  assert.match(meeting.lines[8].text, /私が持つ/);
  assert.ok(
    storyStageCue(meetingStoryId, 8).actors[0].x > storyStageCue(meetingStoryId, 6).actors[0].x,
  );
  assert.match(meeting.lines.at(-1).text, /行こう/);
  assert.ok(storyStageCue(meetingStoryId, 12).actors.every((actor) => !actor.left));
});

test("a rapid next line continues from the displayed position and settles without a queued walk", () => {
  const arrival = storyStageCue(meetingStoryId, 0).actors[0];
  const mid = sampleStageActor(arrival, stageEntrance("aria"), 200);
  assert.ok(mid.x > 12 && mid.x < arrival.x);
  assert.ok(mid.frame < 8);
  const next = storyStageCue(meetingStoryId, 8).actors[0];
  assert.equal(sampleStageActor(next, mid, 0).x, mid.x);
  const end = sampleStageActor(next, mid, 3000);
  assert.equal(end.x, next.x);
  assert.equal(end.frame, 8);
  assert.deepEqual(sampleStageActor(next, mid, 6000), end);
});

test("surprise is a short single reaction; reduced motion gives the final pose and a static cue", () => {
  const actor = storyStageCue(meetingStoryId, 4).actors[0];
  const origin = { x: 36 };
  assert.ok(sampleStageActor(actor, origin, 260).lift < 0);
  assert.equal(sampleStageActor(actor, origin, 260).bubble, "！");
  assert.equal(sampleStageActor(actor, origin, 3000).bubble, "");
  assert.equal(sampleStageActor(actor, origin, 3000).lift, 0);
  for (const elapsed of [0, 260, 3000]) {
    const still = sampleStageActor(actor, { x: 12 }, elapsed, true);
    assert.equal(still.x, actor.x);
    assert.equal(still.lift, 0);
    assert.equal(still.frame, 8);
    assert.equal(still.bubble, "！");
  }
});
