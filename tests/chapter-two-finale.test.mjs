import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { initialPrologueState, act, settle, allQuests, encounter } from "../lib/game.ts";
import { storyStages, stageEndingPending, stageUnlocked } from "../lib/prologue.ts";
import { BLOCKADE_QUEST, HOUSE_CALLS_QUEST, MEDICINE_RETURN_QUEST } from "../lib/chapter-two.ts";
import { finaleStories } from "../lib/chapter-two-finale-stories.ts";
import { parseBundle } from "../lib/save-format.ts";
import { nextGoal } from "../lib/journey.ts";
import { storyArtAt } from "../lib/story-art.ts";
import { availableStories, journeyBanter } from "../lib/stories.ts";
import { createEnemies } from "../lib/combat.ts";
import { adventureFrame } from "../lib/adventure-presentation.ts";
const stages = [BLOCKADE_QUEST, HOUSE_CALLS_QUEST, MEDICINE_RETURN_QUEST];
const start = (s, id) =>
  act(s, { type: "start", id, readDeparture: true, value: true }, s.updatedAt);
const read = (s, id) => act(s, { type: "readStory", id: id + "-return" }, s.updatedAt);
function roundtrip(state) {
  const id = crypto.randomUUID();
  return parseBundle(
    JSON.parse(
      JSON.stringify({
        format: 4,
        deviceId: id,
        active: id,
        profiles: [{ id, name: "終盤確認", test: true, state }],
        serial: 1,
        sound: false,
        cloudAt: 0,
        legacyImported: true,
      }),
    ),
  ).profiles[0].state;
}
function ready() {
  const s = initialPrologueState(1000);
  s.clears = 15;
  s.owned.push("mira");
  s.xp = { aria: 30 * 24 ** 2, leon: 30 * 24 ** 2, mira: 30 * 24 ** 2 };
  for (const { quest } of storyStages.slice(0, 15)) {
    s.done[quest] = 1;
    s.story.departed.push(quest);
    s.story.completed.push(quest);
    s.story.read.push(quest + "-departure", quest + "-return");
  }
  return roundtrip(s);
}
const frame = (s) =>
  adventureFrame({
    squad: s.squads[0],
    startQuest: s.squads[0].run.quest,
    now: s.updatedAt,
    ready: true,
    paused: false,
  });
test("2-6 save continues through 2-9 with first-ending gates, offline parity and repeatable completion", () => {
  let s = ready();
  assert.equal(nextGoal(s).questId, BLOCKADE_QUEST);
  assert.throws(() => start(s, HOUSE_CALLS_QUEST));
  assert.throws(() => start(s, MEDICINE_RETURN_QUEST));
  for (const [index, id] of stages.entries()) {
    const before = structuredClone(s),
      away = roundtrip(start(s, id));
    assert.deepEqual(s, before);
    assert.deepEqual(away.squads[0].members, ["aria", "leon", "mira"]);
    const stopped = roundtrip(act(away, { type: "stop" }, away.updatedAt));
    assert.equal(stopped.done[id], undefined);
    assert.deepEqual(stopped.owned, s.owned);
    let live = roundtrip(start(stopped, id));
    const resumed = structuredClone(live);
    let battleCount = 0,
      seenNodes = new Set();
    for (let limit = 0; live.squads[0].run && limit < 20000; limit++) {
      const run = live.squads[0].run,
        q = allQuests.find((q) => q.id === id);
      const encounterNode = run.road?.ambushNode ?? run.node;
      if (!seenNodes.has(encounterNode)) {
        seenNodes.add(encounterNode);
        if (encounter(q, encounterNode) === "battle") battleCount++;
      }
      if (id === HOUSE_CALLS_QUEST) {
        assert.equal(frame(live).target.battle, false);
        assert.equal(run.enemies?.length ?? 0, 0);
      }
      live = settle(live, run.nextAt).state;
    }
    assert.equal(live.squads[0].run, null);
    assert.equal(live.done[id], 1);
    assert.equal(battleCount, id === BLOCKADE_QUEST ? 3 : id === HOUSE_CALLS_QUEST ? 0 : 3);
    const offline = roundtrip(settle(resumed, resumed.updatedAt + 13 * 3600000).state);
    for (const key of ["gold", "herbs", "ore", "owned", "xp", "done", "story"])
      assert.deepEqual(offline[key], live[key]);
    assert.equal(stageEndingPending(offline), id);
    assert.ok(availableStories(offline).some((st) => st.id === id + "-return"));
    if (index < 2) assert.equal(stageUnlocked(offline, stages[index + 1]), false);
    s = roundtrip(read(offline, id));
    assert.equal(stageEndingPending(s), undefined);
    assert.deepEqual(read(s, id), s);
    for (const key of ["gold", "herbs", "ore", "owned", "inventory"])
      assert.deepEqual(s[key], offline[key]);
  }
  assert.match(nextGoal(s).title, /幕間/);
  assert.doesNotMatch(nextGoal(s).detail, /準備中/);
  for (const id of stages) {
    const repeated = roundtrip(settle(start(s, id), s.updatedAt + 3600000).state);
    assert.ok(repeated.done[id] > 1);
    assert.deepEqual(repeated.story, s.story);
    assert.deepEqual(repeated.owned, s.owned);
  }
});
test("2-7 advances through mixed puppets to their masked commander, with distinct delivery banter", () => {
  const away = start(ready(), BLOCKADE_QUEST);
  for (let node = 0; node < 3; node++) {
    const run = away.squads[0].run;
    run.node = node;
    run.enemies = createEnemies(
      allQuests.find((q) => q.id === BLOCKADE_QUEST),
      node,
      run.phaseAt,
    );
    const targets = frame(away).targets;
    assert.equal(targets.length, node === 2 ? 3 : 2);
    assert.equal(targets[0].asset, "/enemies/mountain-puppet.png");
    assert.equal(
      targets[1].asset,
      node === 0 ? "/enemies/mountain-puppet.png" : "/enemies/cargo-golem.png",
    );
    if (node === 2) assert.equal(targets[2].asset, "/enemies/masked-pumpety.png");
    for (const target of targets) assert.ok(existsSync("public" + target.asset));
  }
  for (const id of [HOUSE_CALLS_QUEST, MEDICINE_RETURN_QUEST]) {
    away.squads[0].run.quest = id;
    const banter = journeyBanter(away, away.squads[0], away.updatedAt);
    assert.doesNotMatch(JSON.stringify(banter), /大きい手|小さいのも/);
  }
});
test("finale stills reveal at the delivery and first sip, and the antagonist stays masked and unjoined", () => {
  for (const [id, action] of [
    [HOUSE_CALLS_QUEST, "薬の包みと蜜の瓶"],
    [MEDICINE_RETURN_QUEST, "一口飲んだ"],
  ]) {
    const story = finaleStories.find((st) => st.id === id + "-return"),
      index = story.lines.findIndex((line) => line.text.includes(action));
    assert.ok(index > 0);
    assert.equal(storyArtAt(story.id, index - 1), undefined);
    assert.ok(existsSync("public" + storyArtAt(story.id, index).src));
  }
  const blockade = finaleStories.filter((st) => st.quest === BLOCKADE_QUEST);
  assert.ok(blockade.every((st) => st.lines.every((line) => line.speaker !== "pumpety")));
  assert.ok(
    blockade.every((st) =>
      st.lines.filter((line) => line.speaker).every((line) => !line.text.includes("プティ")),
    ),
  );
  assert.equal(finaleStories.at(-1).lines.at(-1).text, "第二章 完");
});
