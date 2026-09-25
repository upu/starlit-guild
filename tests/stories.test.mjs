import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, act, settle, testState } from "../lib/game.ts";
import { nextStage, storyStages } from "../lib/prologue.ts";
import { stories, availableStories, journeyBanter, coupleCombo } from "../lib/stories.ts";

const start = (s) => act(s, { type: "start", id: nextStage(s).quest }, s.updatedAt);
const ids = (s) => availableStories(s).map((st) => st.id);

test("idle trio conversations include Mira only while she is in the party and preserve the save", () => {
  const state = initialState(1000),
    squad = state.squads[0];
  const dialogue = () =>
    Array.from({ length: 8 }, (_, i) => journeyBanter(state, squad, i * 30000)).flat();
  assert.ok(dialogue().every((line) => line.speaker !== "mira"));
  squad.members.push("mira");
  const before = structuredClone(state),
    trio = dialogue();
  assert.equal(journeyBanter(state, squad, 0)[0].speaker, "mira");
  assert.ok(trio.some((line) => line.speaker === "mira"));
  assert.ok(trio.every((line) => !line.speaker || squad.members.includes(line.speaker)));
  assert.deepEqual(state, before);
  squad.members = squad.members.filter((id) => id !== "mira");
  assert.ok(dialogue().every((line) => line.speaker !== "mira"));
});

test("every story stage has exactly one departure and one ending, and ids stay unique", () => {
  assert.equal(new Set(stories.map((st) => st.id)).size, stories.length);
  for (const { quest } of storyStages) {
    assert.equal(
      stories.filter((st) => st.quest === quest && st.chapter === "departure").length,
      1,
    );
    assert.equal(stories.filter((st) => st.quest === quest && st.chapter === "return").length, 1);
  }
  assert.ok(
    stories.every(
      (st) => st.chapter === "interlude" || storyStages.some((stage) => stage.quest === st.quest),
    ),
  );
});

test("reading and replaying are idempotent and never award gold or change clocks", () => {
  const before = start(initialState(1000)),
    departure = nextStage(initialState(1000)).quest + "-departure";
  let s = act(before, { type: "readStory", id: departure }, 1000);
  s = act(s, { type: "readStory", id: departure }, 1000);
  assert.deepEqual(s.story.read, [departure]);
  const rest = { ...s },
    expected = { ...before };
  delete rest.story;
  delete expected.story;
  assert.deepEqual(rest, expected);
  assert.throws(() => act(s, { type: "readStory", id: "medicine-road-home-return" }, 1000));
  assert.throws(() => act(s, { type: "readStory", id: "not-a-scene" }, 1000));
});

test("the opening stage only offers its own scenes until the pair has travelled", () => {
  const fresh = initialState(1000);
  assert.deepEqual(ids(fresh), []);
  const departed = start(fresh);
  assert.deepEqual(ids(departed), [nextStage(fresh).quest + "-departure"]);
});

test("banter responds to rest and region; friendship changes pair-specific coordination", () => {
  const s = start(initialState(1000)),
    sq = s.squads[0],
    snapshot = structuredClone(s);
  assert.ok(journeyBanter(s, sq, 4000).length);
  assert.deepEqual(s, snapshot);
  sq.run.phase = "rest";
  assert.match(JSON.stringify(journeyBanter(s, sq, 4000)), /水/);
  // Most stages have their own scripted lines; 2-3 falls through to the pair's own banter.
  const paired = start(testState(1000, 11, 8, 1000));
  paired.squads[0].run.phase = "rest";
  paired.friendship["aria-leon"] = 12;
  assert.match(JSON.stringify(journeyBanter(paired, paired.squads[0], 4000)), /隣/);
  const low = coupleCombo(initialState(0), 0),
    high = coupleCombo({ ...paired, friendship: { "aria-leon": 24 } }, 0);
  assert.notDeepEqual(low, high);
});

test("finishing a stage records its ending and never leaves the run behind", () => {
  let s = start(testState(1000, 3, 8, 1000)),
    i = 0;
  while (s.squads[0].run && i++ < 10000) s = settle(s, s.squads[0].run.nextAt).state;
  assert.ok(i < 10000);
  assert.equal(s.squads[0].run, null);
  assert.ok(ids(s).some((id) => id.endsWith("-return")));
});
