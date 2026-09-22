import { LUNCH_INTERLUDE } from "../lib/chapter-three.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { initialPrologueState, act, settle } from "../lib/game.ts";
import { storyStages, TRADE_QUEST, RETURN_QUEST } from "../lib/prologue.ts";
import { questChapter } from "../lib/quest-navigation.ts";
import { parseBundle } from "../lib/save-format.ts";

const dispatch = (s, a) => act(s, a, s.updatedAt);
const arrive = (s, id) =>
  settle(dispatch(s, { type: "start", id, readDeparture: true }), s.updatedAt + 13 * 3600000).state;
const read = (s, id) => dispatch(s, { type: "readStory", id: id + "-return" });
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
        legacyImported: true,
      }),
    ),
  ).profiles[0].state;
}

test("old saves default to off; setting persists and can be disabled without changing destination", () => {
  const old = initialPrologueState(1000),
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

test("all 27 stages advance only after ending, cross chapters, persist and never auto-depart", () => {
  let s = dispatch(initialPrologueState(1000), { type: "autoNextQuest", value: true });
  s.xp.aria = s.xp.leon = 30 * 24 ** 2;
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
    assert.equal(s.squads[0].lastQuest, storyStages[index + 1]?.quest || stage.quest);
    assert.equal(s.squads[0].run, null);
    assert.equal(s.gold, before.gold);
    assert.deepEqual(s.done, before.done);
    assert.deepEqual(read(s, stage.quest), s, "rereading does not advance again");
  }
  assert.equal(questChapter(storyStages[8].quest), "one");
  assert.equal(questChapter(storyStages[9].quest), "two");
  assert.equal(questChapter("herbs"), "other");
  s = arrive(s, TRADE_QUEST);
  s = read(s, TRADE_QUEST);
  assert.equal(s.squads[0].lastQuest, TRADE_QUEST, "replaying an old stage keeps its destination");
});

test("turning off before reading keeps the destination; enabling later does not jump on reread", () => {
  let s = dispatch(initialPrologueState(1000), { type: "autoNextQuest", value: true });
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
