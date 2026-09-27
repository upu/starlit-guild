import { test } from "node:test";
import assert from "node:assert/strict";
import { act, availableQuests, encounter, testState } from "../lib/game.ts";
import {
  WALNUT_INTERLUDE,
  LINDE_REQUESTS_QUEST,
  LICO_RECORDS_QUEST,
  MERRILL_SEEDLINGS_QUEST,
  chapterFourStages,
} from "../lib/chapter-four.ts";
import { chapterFourStories } from "../lib/chapter-four-stories.ts";
import { storyArt } from "../lib/story-art.ts";
import { parseBundle } from "../lib/save-format.ts";
import { questNodes } from "../lib/puppet-battles.ts";

const dispatch = (state, action) => act(state, action, state.updatedAt);
const roundtrip = (state) => {
  const id = "44444444-4444-4444-8444-444444444444";
  return parseBundle({
    format: 4,
    deviceId: id,
    active: id,
    profiles: [{ id, name: "第四章確認", test: true, state }],
    serial: 0,
    sound: false,
    cloudAt: 0,
  }).profiles[0].state;
};

test("fourth chapter waits for its reward-free interlude and keeps the old save format", () => {
  const earlier = testState(1000, 27, 25, 10000);
  const original = structuredClone(earlier);
  assert.ok(availableQuests(earlier).some((quest) => quest.id === WALNUT_INTERLUDE));
  assert.ok(!availableQuests(earlier).some((quest) => quest.id === LINDE_REQUESTS_QUEST));
  assert.throws(() => dispatch(earlier, { type: "start", id: LINDE_REQUESTS_QUEST }));
  const begun = dispatch(earlier, { type: "start", id: WALNUT_INTERLUDE, readDeparture: true });
  assert.equal(begun.clears, earlier.clears);
  assert.equal(begun.gold, earlier.gold);
  assert.ok(begun.story.read.includes(WALNUT_INTERLUDE));
  assert.ok(availableQuests(begun).some((quest) => quest.id === LINDE_REQUESTS_QUEST));
  assert.deepEqual(roundtrip(begun), JSON.parse(JSON.stringify(begun)));
  assert.deepEqual(earlier, original);
});

test("Lico's apparatus and Merrill's basket confrontation occur once in their routes", () => {
  for (const [id, at] of [
    [LICO_RECORDS_QUEST, 14],
    [MERRILL_SEEDLINGS_QUEST, 0],
  ]) {
    const quest = availableQuests(
      dispatch(testState(1000, 34, 25, 10000), { type: "readStory", id: WALNUT_INTERLUDE }),
    ).find((candidate) => candidate.id === id);
    assert.ok(quest);
    const battles = Array.from({ length: questNodes(id) }, (_, node) => node).filter(
      (node) => encounter(quest, node) === "battle",
    );
    assert.deepEqual(battles, [at]);
  }
});

test("Lico can join the first shared fight without duplicating her level or altering earlier parties", () => {
  const before = testState(1000, 34, 25, 10000);
  assert.ok(!before.owned.includes("lico"));
  const joined = dispatch(before, {
    type: "start",
    id: MERRILL_SEEDLINGS_QUEST,
    readDeparture: true,
  });
  assert.ok(joined.owned.includes("lico"));
  assert.deepEqual(joined.squads[0].members, ["aria", "leon", "mira", "finn", "lico"]);
  assert.equal(
    joined.xp.lico,
    Math.min(...["aria", "leon", "mira", "finn"].map((id) => before.xp[id])),
  );
  assert.deepEqual(roundtrip(joined), JSON.parse(JSON.stringify(joined)));
  const stopped = dispatch(joined, { type: "stop" });
  const replay = dispatch(stopped, { type: "start", id: MERRILL_SEEDLINGS_QUEST });
  assert.equal(replay.xp.lico, joined.xp.lico);
  assert.equal(replay.owned.filter((id) => id === "lico").length, 1);
  const old = dispatch(stopped, { type: "start", id: chapterFourStages[0].quest });
  assert.deepEqual(old.squads[0].members, ["aria", "leon", "mira", "finn"]);
});

test("the approved fourth-chapter stills appear at their matching moments", () => {
  const byId = new Map(chapterFourStories.map((scene) => [scene.id, scene]));
  for (const [id, phrase] of [
    ["glowing-moss-trail-departure", "フィンがミラの顔をのぞく"],
    ["glowing-moss-trail-return", "干してある青い布の陰"],
    ["merrill-seedlings-departure", "胸に抱えてメリルの前へ"],
    ["starlit-guild-founding-return", "代表者欄へ名前を書く"],
  ]) {
    const scene = byId.get(id);
    assert.ok(scene);
    assert.ok(scene.lines[storyArt[id].revealAtLine].text.includes(phrase), id);
  }
  assert.equal(chapterFourStories.length, 21);
});

test("Lico is unnamed until she introduces herself and the waiting quest does not reveal Merrill", () => {
  const scene = chapterFourStories.find((s) => s.id === "brekka-moss-beds-return");
  const introduction = scene.lines.findIndex((l) => l.text.includes("リコリス"));
  assert.ok(introduction > 0);
  for (const line of scene.lines.slice(0, introduction)) {
    assert.notEqual(line.speaker, "lico");
    assert.ok(!line.text.includes("リコ"));
  }
  const q = availableQuests(testState(1000, 34, 25, 10000)).find(
    (q) => q.id === MERRILL_SEEDLINGS_QUEST,
  );
  assert.ok(!q.desc.includes("メリル"));
});
