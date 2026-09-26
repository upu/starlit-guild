import { LUNCH_INTERLUDE } from "../lib/chapter-three.ts";
import { WALNUT_INTERLUDE } from "../lib/chapter-four.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, act, settle, testState } from "../lib/game.ts";
import { storyStages, TRADE_QUEST, RETURN_QUEST } from "../lib/prologue.ts";
import { questChapter } from "../lib/quest-navigation.ts";
import { parseBundle } from "../lib/save-format.ts";

const dispatch = (s, a) => act(s, a, s.updatedAt);
const arrive = (s, id) =>
  settle(dispatch(s, { type: "start", id, readDeparture: true }), s.updatedAt + 13 * 3600000);
const read = (s, id) => dispatch(s, { type: "readStory", id: id + "-return" });
const depart = (s, id) => dispatch(s, { type: "start", id, value: false, readDeparture: true });
function rest(s) {
  for (let i = 0; i < 10 && s.squads[0].run; i++) s = settle(s, s.updatedAt + 12 * 3600000);
  assert.equal(s.squads[0].run, null);
  return s;
}
function autoNext(stages) {
  return { ...testState(1000, stages, 50, 0), autoNextQuest: true };
}
function roundtrip(state) {
  const id = crypto.randomUUID();
  return parseBundle(
    JSON.parse(
      JSON.stringify({
        format: 4,
        deviceId: id,
        active: id,
        profiles: [{ id, name: "進行確認", test: true, state }],
        serial: 0,
        sound: false,
        cloudAt: 0,
      }),
    ),
  ).profiles[0].state;
}

test("old saves default to off; setting persists and can be disabled without changing destination", () => {
  const old = initialState(1000),
    original = structuredClone(old);
  assert.equal(roundtrip(old).autoNextQuest, undefined);
  let s = arrive(old, TRADE_QUEST);
  s = read(s, TRADE_QUEST);
  assert.equal(s.squads[0].lastQuest, TRADE_QUEST);
  s = roundtrip(dispatch(s, { type: "autoNextQuest", value: true }));
  assert.equal(s.autoNextQuest, true);
  assert.equal(s.squads[0].lastQuest, TRADE_QUEST);
  s = roundtrip(dispatch(s, { type: "autoNextQuest", value: false }));
  assert.equal(s.autoNextQuest, false);
  assert.deepEqual(old, original);
  assert.throws(() => dispatch(s, { type: "autoNextQuest", value: "yes" }));
  assert.throws(() => roundtrip({ ...s, autoNextQuest: "yes" }));
});

test("all story stages advance only after ending, cross chapters, persist and wait at an unseen departure", () => {
  let s = dispatch(initialState(1000), { type: "autoNextQuest", value: true });
  s.xp.aria = s.xp.leon = 30 * 49 ** 2;
  for (const [index, stage] of storyStages.entries()) {
    s = arrive(s, stage.quest);
    assert.equal(s.squads[0].lastQuest, stage.quest, "arrival does not skip the ending");
    const before = structuredClone(s);
    s = roundtrip(read(s, stage.quest));
    if (index === 17) {
      assert.equal(
        s.squads[0].lastQuest,
        LUNCH_INTERLUDE,
        "selects the interlude without starting it",
      );
      s = roundtrip(dispatch(s, { type: "readStory", id: LUNCH_INTERLUDE }));
    }
    if (index === 26) {
      assert.equal(s.squads[0].lastQuest, WALNUT_INTERLUDE);
      s = roundtrip(dispatch(s, { type: "readStory", id: WALNUT_INTERLUDE }));
    }
    assert.equal(s.squads[0].lastQuest, storyStages[index + 1]?.quest || stage.quest);
    assert.equal(s.squads[0].run, null);
    assert.equal(s.gold, before.gold);
    assert.deepEqual(s.done, before.done);
    assert.deepEqual(read(s, stage.quest), s, "rereading does not advance again");
  }
  assert.equal(questChapter(storyStages[8].quest), "one");
  assert.equal(questChapter(storyStages[9].quest), "two");
  assert.equal(questChapter("herbs"), "other");
  s = dispatch(s, { type: "autoNextQuest", value: false });
  s = rest(depart(s, TRADE_QUEST));
  assert.equal(
    s.squads[0].lastQuest,
    TRADE_QUEST,
    "without Auto-Next a replay keeps its destination",
  );
  assert.equal(s.done[RETURN_QUEST], 1);
});

test("Auto-Next replays a cleared stage onward: the next stage becomes the destination and departs", () => {
  let s = depart(autoNext(storyStages.length), TRADE_QUEST);
  while (s.done[TRADE_QUEST] < 2) s = settle(s, s.updatedAt + 60000);
  assert.equal(s.squads[0].lastQuest, RETURN_QUEST);
  assert.equal(s.squads[0].run?.quest, RETURN_QUEST);
  assert.equal(s.squads[0].repeat, false);
  s = rest(s);
  assert.equal(s.squads[0].lastQuest, storyStages.at(-1).quest, "stops after the last stage");
  for (const { quest } of storyStages) assert.equal(s.done[quest], 2, quest);
  assert.ok(s.story.read.includes(LUNCH_INTERLUDE));
});

test("Auto-Next stops at rest before an unseen departure, then departs after the first ending", () => {
  let s = rest(depart(autoNext(5), TRADE_QUEST));
  for (const { quest } of storyStages.slice(0, 5)) assert.equal(s.done[quest], 2, quest);
  const frontier = storyStages[5].quest;
  assert.equal(s.squads[0].lastQuest, frontier);
  assert.ok(!s.story.departed.includes(frontier), "the departure conversation stays unseen");
  s = rest(depart(s, frontier));
  s.story.departed.push(storyStages[6].quest);
  s = read(s, frontier);
  assert.equal(s.squads[0].lastQuest, storyStages[6].quest);
  assert.equal(s.squads[0].run?.quest, storyStages[6].quest, "a seen departure starts at once");
});

test("turning off before reading keeps the destination; enabling later does not jump on reread", () => {
  let s = dispatch(initialState(1000), { type: "autoNextQuest", value: true });
  s = arrive(s, TRADE_QUEST);
  s = dispatch(s, { type: "autoNextQuest", value: false });
  s = read(s, TRADE_QUEST);
  assert.equal(s.squads[0].lastQuest, TRADE_QUEST);
  s = dispatch(s, { type: "autoNextQuest", value: true });
  s = read(s, TRADE_QUEST);
  assert.equal(s.squads[0].lastQuest, TRADE_QUEST);
  s = arrive(s, RETURN_QUEST);
  s = read(s, RETURN_QUEST);
  assert.equal(s.squads[0].lastQuest, storyStages[2].quest);
});
