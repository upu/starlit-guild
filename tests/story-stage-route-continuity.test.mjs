import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleJourney, journeyDuration } from "../lib/story-stage-travel.ts";
import { sampleStageActor, storyStageCue } from "../lib/story-stage.ts";
import { sampleExtraTravel, extraTravelDuration } from "../lib/story-stage-extra-travel.ts";
import { prologueStories } from "../lib/prologue-stories.ts";
import { chapterTwoStories } from "../lib/chapter-two-stories.ts";
import { chapterThreeStories } from "../lib/chapter-three-stories.ts";
import { chapterFourStories } from "../lib/chapter-four-stories.ts";

const xy = (point) => [point.x, point.bottom];
const around = {
  id: "aria",
  x: 30,
  bottom: 30,
  via: [
    { x: 10, bottom: 0 },
    { x: 10, bottom: 30 },
  ],
};
const start = { x: 0, bottom: 0 };

test("a tap after a corner continues forward without repeating cleared waypoints", () => {
  const at = sampleJourney(around, start, 1190, false);
  assert.deepEqual(xy(at), [15, 30]);
  assert.deepEqual(xy(sampleJourney(around, at, 0, false)), xy(at));
  const next = sampleJourney(around, at, 170, false);
  assert.deepEqual(xy(next), [20, 30]);
  assert.equal(journeyDuration(around, at), 510);
});

test("repeated taps keep the same route and finish at the uninterrupted arrival time", () => {
  let at = start;
  for (let elapsed = 85; elapsed <= 1700; elapsed += 85) {
    at = sampleJourney(around, at, 85, false);
    const expected = sampleJourney(around, start, elapsed, false);
    for (const coordinate of ["x", "bottom"])
      assert.ok(Math.abs(at[coordinate] - expected[coordinate]) < 1e-8, `${elapsed}/${coordinate}`);
  }
  assert.equal(at.moving, false);
});

test("the last leg out of a passing lane does not return to that lane on the next line", () => {
  const actor = { id: "leon", x: 50, bottom: 20, lane: 0 };
  const origin = { x: 0, bottom: 20 };
  const duration = journeyDuration(actor, origin);
  const at = sampleJourney(actor, origin, duration - 170, false);
  const next = sampleJourney(actor, at, 85, false);
  assert.equal(next.x, 50);
  assert.ok(next.bottom > at.bottom);
  assert.ok(Math.abs(journeyDuration(actor, at) - 170) < 1e-8);
});

test("a newly authored destination or route replaces the remaining old path", () => {
  const at = sampleJourney(around, start, 1190, false);
  const direct = { ...around, x: 0, via: undefined };
  assert.deepEqual(xy(sampleJourney(direct, at, 170, false)), [10, 30]);
  const detour = { ...around, via: [{ x: 15, bottom: 15 }] };
  const next = sampleJourney(detour, at, 170, false);
  assert.equal(next.x, 15);
  assert.ok(next.bottom < at.bottom);
  assert.deepEqual(xy(sampleJourney(detour, at, 0, true)), [30, 30]);
});

test("Aria's cargo inspection keeps its remaining path when dialogue advances", () => {
  const actor = (line) =>
    storyStageCue("sweet-blockade-return", line).actors.find((a) => a.id === "aria");
  const duration = journeyDuration(actor(11), actor(10));
  const at = sampleStageActor(actor(11), actor(10), duration - 170);
  const next = sampleStageActor(actor(12), at, 85);
  assert.equal(next.x, at.x);
  assert.ok(next.bottom > at.bottom);
  assert.ok(Math.abs(journeyDuration(actor(12), at) - 170) < 1e-8);
});

test("NPCs preserve cleared waypoints and do not walk a finished detour again", () => {
  const extra = { ...around, id: "worker" };
  const at = sampleExtraTravel(extra, start, 1190 / 0.6, false);
  assert.deepEqual(xy(sampleExtraTravel(extra, at, 170 / 0.6, false)), [20, 30]);
  assert.equal(extraTravelDuration(extra, at), 510 / 0.6);
  const finished = sampleExtraTravel(extra, start, 10000, false);
  const still = sampleExtraTravel(extra, finished, 85, false);
  assert.deepEqual(xy(still), [30, 30]);
  assert.equal(still.moving, false);
});

for (const [chapter, stories] of [
  prologueStories,
  chapterTwoStories,
  chapterThreeStories,
  chapterFourStories,
].entries()) {
  test(`chapter ${chapter + 1} authored detours preserve position and arrival through interruptions`, (t) => {
    let checked = 0;
    for (const story of stories) {
      let previous = new Map();
      for (let line = 0; line < story.lines.length; line++) {
        const cue = storyStageCue(story.id, line);
        if (!cue) continue;
        if (cue.cut) previous = new Map();
        for (const moment of [cue, ...(cue.sequence ?? [])]) {
          for (const actor of moment.actors) {
            const origin = previous.get(actor.id) ?? actor;
            const duration = journeyDuration(actor, origin);
            if ((actor.via || actor.lane !== undefined) && duration > 0) {
              checked++;
              for (const fraction of [0.2, 0.6, 0.9]) {
                const at = sampleStageActor(actor, origin, duration * fraction);
                const resumed = sampleStageActor(actor, at, duration * 0.1);
                const expected = sampleStageActor(actor, origin, duration * (fraction + 0.1));
                for (const coordinate of ["x", "bottom"])
                  assert.ok(
                    Math.abs(resumed[coordinate] - expected[coordinate]) < 1e-7,
                    `${story.id}/${line}/${actor.id}/${coordinate}/${fraction}`,
                  );
              }
            }
            previous.set(actor.id, actor);
          }
        }
      }
    }
    assert.ok(checked > 0, "the chapter exercises at least one nonempty detour");
    t.diagnostic(`${checked} authored detours checked`);
  });
}
