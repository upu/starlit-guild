import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, act, settle, quests, legacyTestState } from "../lib/game.ts";
import {
  stories,
  availableStories,
  campStories,
  journeyBanter,
  coupleCombo,
} from "../lib/stories.ts";

const start = (s) => act(s, { type: "start", id: "herbs" }, s.updatedAt);
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
function finish(s) {
  let i = 0;
  while (s.squads[0].run && i++ < 10000) s = settle(s, s.squads[0].run.nextAt).state;
  assert.ok(i < 10000);
  return s;
}

test("all quests have a departure and an ending; the accepted fireside scene is readable", () => {
  assert.equal(new Set(stories.map((st) => st.id)).size, stories.length);
  for (const q of quests) {
    assert.equal(stories.filter((st) => st.quest === q.id && st.chapter === "departure").length, 1);
    assert.equal(stories.filter((st) => st.quest === q.id && st.chapter === "return").length, 1);
  }
  assert.ok(
    stories
      .find((st) => st.id === "pilgrim-return")
      .lines.some((line) => line.text === "今は、どこにも行かないよ。"),
  );
});

test("reading and replaying are idempotent and never award gold or change clocks", () => {
  const before = start(initialState(1000));
  let s = act(before, { type: "readStory", id: "herbs-departure" }, 1000);
  s = act(s, { type: "readStory", id: "herbs-departure" }, 1000);
  assert.deepEqual(s.story.read, ["herbs-departure"]);
  const rest = { ...s },
    expected = { ...before };
  delete rest.story;
  delete expected.story;
  assert.deepEqual(rest, expected);
  assert.throws(() => act(s, { type: "readStory", id: "dragon-return" }, 1000));
  assert.throws(() => act(s, { type: "readStory", id: "not-a-scene" }, 1000));
});

test("a different party does not act out or unlock the couple expedition", () => {
  let s = initialState(1000);
  s = act(s, { type: "party", members: ["aria"] }, 1000);
  s = act(s, { type: "repeat", value: false }, 1000);
  s = start(s);
  assert.deepEqual(journeyBanter(s, s.squads[0], 4000), []);
  s = finish(s);
  assert.deepEqual(s.story, { departed: [], completed: [], read: [] });
  assert.deepEqual(ids(s), []);
  s = act(s, { type: "party", members: ["aria", "leon"] }, s.updatedAt);
  s = start(s);
  assert.deepEqual(ids(s), ["herbs-departure"]);
});

test("camp scenes follow friendship and facilities and only feature people actually at home", () => {
  const s = initialState(1000);
  s.story = { departed: ["herbs"], completed: ["herbs"], read: [] };
  assert.deepEqual(
    campStories(s).map((st) => st.id),
    ["camp-seat"],
  );
  s.friendship["aria-leon"] = 12;
  s.town = 1;
  assert.ok(campStories(s).some((st) => st.id === "camp-cup"));
  assert.ok(!campStories(s).some((st) => st.id === "camp-tomorrow"));
  s.friendship["aria-leon"] = 24;
  assert.ok(campStories(s).some((st) => st.id === "camp-tomorrow"));
  assert.ok(!campStories(s).some((st) => st.id === "camp-quiet-tea"));
  s.owned.push("mira");
  assert.ok(campStories(s).some((st) => st.id === "camp-quiet-tea"));
  s.squads.push({ id: "party-2", name: "お茶の隊", members: ["mira"], repeat: true, run: null });
  const away = act(s, { type: "start", id: "herbs", squad: "party-2" }, 1000);
  assert.ok(!campStories(away).some((st) => st.id === "camp-quiet-tea"));
  assert.deepEqual(campStories(start(s)), []);
  // Memories remain available even when their participants depart.
  assert.ok(ids(start(s)).includes("camp-cup"));
});

test("banter responds to rest, detours and region; friendship changes pair-specific coordination", () => {
  let s = start(initialState(1000)),
    sq = s.squads[0];
  const snapshot = structuredClone(s);
  assert.match(JSON.stringify(journeyBanter(s, sq, 4000)), /光ってる/);
  assert.deepEqual(s, snapshot);
  sq.run.phase = "rest";
  assert.match(JSON.stringify(journeyBanter(s, sq, 4000)), /水/);
  s.friendship["aria-leon"] = 12;
  assert.match(JSON.stringify(journeyBanter(s, sq, 4000)), /隣/);
  const low = coupleCombo(initialState(0), 0),
    high = coupleCombo({ ...s, friendship: { "aria-leon": 24 } }, 0);
  assert.notDeepEqual(low, high);
  s = legacyTestState(1000, 60, 10, 10000);
  s = act(s, { type: "start", id: "pilgrim" }, 1000);
  s.squads[0].run.detour.claimed = true;
  assert.match(JSON.stringify(journeyBanter(s, s.squads[0], 4000)), /霧/);
});
