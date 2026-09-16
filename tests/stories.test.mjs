import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, act, settle, quests, legacyTestState } from "../lib/game.ts";
import { parseBundle } from "../lib/save-format.ts";
import {
  stories,
  availableStories,
  campStories,
  journeyBanter,
  storyProgress,
  coupleCombo,
} from "../lib/stories.ts";

const bundle = (state) => {
  const id = crypto.randomUUID();
  return {
    format: 4,
    deviceId: crypto.randomUUID(),
    active: id,
    profiles: [{ id, name: "ふたりの旅", test: false, state }],
    serial: 1,
    sound: false,
    cloudAt: 0,
    legacyImported: true,
  };
};
const roundtrip = (s) => parseBundle(JSON.parse(JSON.stringify(bundle(s)))).profiles[0].state;
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

test("departure survives skip, return and reload; only finishing awards an ending", () => {
  let s = initialState(1000);
  assert.deepEqual(ids(s), []);
  s = start(s);
  assert.deepEqual(ids(s), ["herbs-departure"]);
  s = act(s, { type: "stop" }, s.updatedAt);
  s = roundtrip(s);
  assert.deepEqual(ids(s), ["herbs-departure"]);
  assert.deepEqual(s.story.read, []);
  s = act(s, { type: "readStory", id: "herbs-departure" }, s.updatedAt);
  s = act(s, { type: "repeat", value: false }, s.updatedAt);
  s = finish(start(s));
  assert.ok(ids(s).includes("herbs-return"));
  assert.ok(ids(s).includes("camp-seat"));
  assert.deepEqual(s.story.departed, ["herbs"]);
  assert.deepEqual(s.story.completed, ["herbs"]);
  assert.deepEqual(roundtrip(s).story, s.story);
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

test("offline rounds unlock one ending without interruption or duplicated story records", () => {
  const original = start(initialState(1000));
  const bulk = settle(original, 601000).state;
  let frames = original;
  for (let now = 1100; now <= 601000; now += 100) frames = settle(frames, now).state;
  assert.deepEqual(bulk.story, frames.story);
  assert.deepEqual(bulk.story.completed, ["herbs"]);
  assert.ok(bulk.done.herbs > 1);
  assert.ok(bulk.squads[0].run);
  assert.deepEqual(bulk.story.read, []);
  assert.deepEqual(roundtrip(bulk).story, bulk.story);
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

test("existing v4 saves retain progress and make cleared stories readable without forced replay", () => {
  const old = initialState(1000);
  delete old.story;
  old.clears = 2;
  old.done = { herbs: 2 };
  const snapshot = structuredClone(old);
  const restored = roundtrip(old);
  assert.ok(ids(restored).includes("herbs-return"));
  assert.deepEqual(storyProgress(restored).departed, ["herbs"]);
  assert.deepEqual(old, snapshot);
  const read = act(restored, { type: "readStory", id: "herbs-return" }, 1000);
  assert.deepEqual(roundtrip(read).story.read, ["herbs-return"]);
  assert.equal(read.gold, old.gold);
  assert.deepEqual(read.done, old.done);
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

test("save validation rejects unknown scenes, duplicate reads and inconsistent completed quests", () => {
  for (const story of [
    { departed: ["herbs"], completed: [], read: ["missing"] },
    { departed: ["herbs"], completed: [], read: ["herbs-departure", "herbs-departure"] },
    { departed: [], completed: ["herbs"], read: [] },
    { departed: ["missing"], completed: [], read: [] },
  ]) {
    const s = initialState(1000);
    s.story = story;
    assert.throws(() => roundtrip(s));
  }
});

test("a departure read before starting is acknowledged atomically at the actual departure time", () => {
  const initial = initialState(1000);
  // The reader holds a departure intent, not a running expedition or a saved unlock.
  const waiting = settle(initial, 301000).state;
  assert.equal(waiting.squads[0].run, null);
  assert.deepEqual(ids(waiting), []);
  assert.equal(waiting.clears, 0);
  const departed = act(
    waiting,
    { type: "start", id: "herbs", readDeparture: true, value: true },
    301000,
  );
  assert.equal(departed.squads[0].run.started, 301000);
  assert.equal(departed.squads[0].run.node, 0);
  assert.deepEqual(departed.story.read, ["herbs-departure"]);
  assert.deepEqual(roundtrip(departed).story, departed.story);
  assert.throws(() => act(departed, { type: "start", id: "herbs", readDeparture: true }, 301000));
  assert.equal(departed.squads[0].run.node, 0);
});
test("new UI departures repeat while legacy one-round saves retain their setting until departure", () => {
  let state = act(initialState(1000), { type: "repeat", value: false }, 1000);
  assert.equal(roundtrip(state).squads[0].repeat, false);
  state = act(state, { type: "start", id: "herbs", value: true }, 2000);
  assert.equal(state.squads[0].repeat, true);
  assert.equal(act(initialState(1000), { type: "start", id: "herbs" }, 1000).story.read.length, 0);
});
