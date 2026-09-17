import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  initialPrologueState,
  act,
  settle,
  availableQuests,
  allQuests,
  encounter,
} from "../lib/game.ts";
import {
  inPrologue,
  storyStages,
  TRADE_QUEST,
  RETURN_QUEST,
  tradeEndingPending,
} from "../lib/prologue.ts";
import { availableStories, journeyBanter } from "../lib/stories.ts";
import { nextGoal, journeyNotice } from "../lib/journey.ts";
import { parseBundle } from "../lib/save-format.ts";
import { adventureFrame } from "../lib/adventure-presentation.ts";

function roundtrip(state) {
  const id = crypto.randomUUID();
  return parseBundle(
    JSON.parse(
      JSON.stringify({
        format: 4,
        deviceId: id,
        active: id,
        profiles: [{ id, name: "序章", test: true, state }],
        serial: 1,
        sound: false,
        cloudAt: 0,
        legacyImported: true,
      }),
    ),
  ).profiles[0].state;
}
const depart = (s) =>
  act(s, { type: "start", id: TRADE_QUEST, readDeparture: true, value: true }, s.updatedAt);

// The detour system is gone, but a story save written before it was removed can still carry one.
test("a pending detour in an older story save is forgotten and frees its explorer", () => {
  const pending = depart(initialPrologueState(1000)),
    run = pending.squads[0].run;
  const explorer = run.actors[0];
  run.detour = {
    node: run.node,
    kind: "spirit",
    hero: explorer.hero,
    at: 1900,
    finishAt: 7200,
    claimed: false,
  };
  explorer.nextAt = run.detour.finishAt;
  run.nextAt = Math.min(run.nextAt, run.detour.finishAt);
  const before = structuredClone(pending),
    restored = roundtrip(pending);
  assert.deepEqual(pending, before, "input save remains unchanged");
  assert.equal(restored.squads[0].run.detour, undefined, "the discovery is dropped");
  assert.equal(restored.gold, pending.gold, "no loot is awarded");
  assert.equal(restored.discoveries, 0);
  const freed = restored.squads[0].run.actors[0];
  assert.equal(freed.hero, explorer.hero);
  assert.equal(freed.nextAt, explorer.arrivesAt, "the explorer acts again from its arrival");
  assert.ok(restored.squads[0].run.nextAt <= freed.nextAt);
  // The freed timeline reaches the same place as a save that never held a discovery.
  const clean = settle(depart(initialPrologueState(1000)), 3601000).state,
    resumed = settle(restored, 3601000).state;
  assert.equal(resumed.gold, clean.gold);
  assert.equal(resumed.herbs, clean.herbs);
  assert.equal(resumed.discoveries, 0);
});

test("new profiles begin with the two villagers and only the repeatable trade quest", () => {
  const s = initialPrologueState(1000),
    snapshot = structuredClone(s);
  assert.deepEqual(s.owned, ["aria", "leon"]);
  assert.equal(s.squads[0].run, null);
  assert.deepEqual(
    availableQuests(s).map((q) => q.id),
    [TRADE_QUEST],
  );
  assert.equal(availableQuests(s)[0].availability, "repeatable");
  assert.deepEqual(availableStories(s), []);
  assert.equal(nextGoal(s).destination, "quests");
  assert.equal(nextGoal(s).questId, TRADE_QUEST);
  assert.deepEqual(s, snapshot);
  assert.throws(() => act(s, { type: "start", id: "herbs" }, 1000));
  assert.equal(roundtrip(s).prologue, true);
});

test("departure reading is atomic; offline arrival stops once and preserves its unread ending", () => {
  let s = depart(initialPrologueState(1000));
  assert.deepEqual(s.story.read, [TRADE_QUEST + "-departure"]);
  s = roundtrip(s);
  const before = structuredClone(s);
  const arrival = settle(s, 1000 + 13 * 3600000).state;
  assert.equal(arrival.squads[0].run, null);
  assert.equal(arrival.done[TRADE_QUEST], 1);
  assert.equal(tradeEndingPending(roundtrip(arrival)), true);
  assert.equal(journeyNotice(before, arrival).title, "街に到着しました");
  assert.deepEqual(settle(arrival, arrival.updatedAt).state, arrival);
  assert.throws(() => depart(arrival), /物語/);
  const read = act(arrival, { type: "readStory", id: TRADE_QUEST + "-return" }, arrival.updatedAt);
  assert.equal(tradeEndingPending(roundtrip(read)), false);
  assert.equal(read.gold, arrival.gold);
  assert.equal(inPrologue(read), true);
  const once = act(
    roundtrip(read),
    { type: "start", id: TRADE_QUEST, readDeparture: true, value: false },
    read.updatedAt,
  );
  const again = settle(once, read.updatedAt + 3600000).state;
  assert.equal(again.done[TRADE_QUEST], 2);
  assert.equal(again.squads[0].run, null);
  assert.equal(tradeEndingPending(again), false);
  assert.deepEqual(again.story.read, read.story.read);
  assert.deepEqual(
    availableQuests(again).map((q) => q.id),
    [TRADE_QUEST, RETURN_QUEST],
  );
  assert.deepEqual(
    availableStories(again).map((st) => st.id),
    [TRADE_QUEST + "-departure", TRADE_QUEST + "-return"],
  );
});

test("trade checkpoints and explicit interruption never award an ending early", () => {
  let s = depart(initialPrologueState(1000));
  while (s.squads[0].run.node < 3) s = settle(s, s.squads[0].run.nextAt).state;
  assert.ok(s.gold > 60);
  assert.equal(tradeEndingPending(s), false);
  const stopped = act(s, { type: "stop" }, s.updatedAt);
  assert.equal(stopped.gold, s.gold);
  assert.equal(stopped.done[TRADE_QUEST], undefined);
  assert.equal(tradeEndingPending(roundtrip(stopped)), false);
  assert.ok(depart(stopped).squads[0].run);
});

test("tapping helps and heals in the prologue", () => {
  let s = depart(initialPrologueState(1000)),
    target = s.squads[0].run.target;
  s = act(s, { type: "assist", mode: "strike" }, 1000);
  assert.ok(s.squads[0].run.target < target);
  s.squads[0].run.health.aria.hp -= 30;
  const hp = s.squads[0].run.health.aria.hp;
  for (let i = 0; i < 25; i++) s = act(s, { type: "assist", mode: "heal" }, 1000);
  assert.ok(s.squads[0].run.health.aria.hp > hp);
  assert.equal(s.squads[0].run.scene, null);
  assert.ok(s.squads[0].run.events.every((e) => !e.text.includes("団長")));
});

test("trade carries cargo and gathers herbs without showing an unintroduced escort companion", () => {
  const q = allQuests.find((q) => q.id === TRADE_QUEST);
  assert.deepEqual(
    [0, 1, 2].map((n) => encounter(q, n)),
    ["escort", "gather", "battle"],
  );
  const s = depart(initialPrologueState(1000));
  const frame = adventureFrame({
    squad: s.squads[0],
    now: 1000,
    ready: true,
    paused: false,
    startQuest: TRADE_QUEST,
  });
  assert.equal(frame.target.asset, "/items/chest.png");
  assert.equal(frame.target.name, "村から預かった荷物");
  assert.deepEqual(
    frame.members.map((m) => m.id),
    ["aria", "leon"],
  );
  assert.ok(
    journeyBanter(s, s.squads[0], 1000).every((line) => ["aria", "leon"].includes(line.speaker)),
  );
});

test("many trades never open the base, other quests or recruitment; legacy records no longer load", () => {
  const s = initialPrologueState(1000);
  s.clears = 60;
  s.gold = 100000;
  s.wood = 10000;
  assert.deepEqual(
    availableQuests(s).map((q) => q.id),
    [TRADE_QUEST],
  );
  for (const action of [
    { type: "build" },
    { type: "newSquad" },
    { type: "party", members: ["aria"] },
  ])
    assert.throws(() => act(s, action, 1000));
  assert.equal(nextGoal(s).destination, "quests");
  // The legacy mode is not maintained: its records are dropped instead of loading.
  const legacy = initialState(1000);
  legacy.clears = 60;
  legacy.gold = 12345;
  legacy.done.herbs = 60;
  const restored = roundtrip(legacy);
  assert.equal(inPrologue(restored), true);
  assert.equal(restored.clears, 0);
  assert.deepEqual(restored.done, {});
  assert.deepEqual(
    availableQuests(restored).map((q) => q.id),
    [TRADE_QUEST],
  );
});

test("one-off quest policy forbids replay and stops even with repeat enabled", () => {
  const q = {
    ...allQuests.find((q) => q.id === TRADE_QUEST),
    id: "one-off-test",
    availability: "once",
  };
  allQuests.push(q);
  storyStages.unshift({ ...storyStages[0], quest: q.id });
  try {
    const started = act(initialPrologueState(1000), { type: "start", id: q.id, value: true }, 1000);
    const done = settle(started, 3601000).state;
    assert.equal(done.done[q.id], 1);
    assert.equal(done.squads[0].run, null);
    assert.throws(() => act(done, { type: "start", id: q.id }, done.updatedAt), /達成済み/);
  } finally {
    allQuests.splice(allQuests.indexOf(q), 1);
    storyStages.splice(
      storyStages.findIndex((stage) => stage.quest === q.id),
      1,
    );
  }
});
