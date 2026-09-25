import { test } from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState, availableQuests, encounter } from "../lib/game.ts";
import { questById } from "../lib/game-rules.ts";
import { availableStories } from "../lib/stories.ts";
import { stageUnlocked, stageEndingPending } from "../lib/prologue.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import {
  chapterThreeStages,
  LUNCH_INTERLUDE,
  BERNE_QUEST,
  STONE_RETURN_QUEST,
} from "../lib/chapter-three.ts";
import { inventoryOf, shopItems } from "../lib/equipment.ts";
import { parseBundle } from "../lib/save-format.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { measure } from "../scripts/check-chapter-two-balance.mjs";
import { outfitBerne } from "../scripts/check-chapter-three-balance.mjs";
import { roadActionKind, roadHasEnemies } from "../lib/chapter-road.ts";
import { techniqueMultiplier } from "../lib/techniques.ts";
import { idleBanter } from "../lib/idle-banter.ts";
import { chapterThreeBanter } from "../lib/chapter-three-banter.ts";

const read = (s, id) => act(s, { type: "readStory", id }, s.updatedAt);
test("stopped cargo recruits every living member into combat, then resumes its remaining journey", () => {
  let s = act(
    read(testState(1000, 18, 17, 5000), LUNCH_INTERLUDE),
    { type: "start", id: BERNE_QUEST },
    1000,
  );
  const q = questById(BERNE_QUEST);
  for (let i = 0; i < 2000 && !roadHasEnemies(s.squads[0].run); i++)
    s = settle(s, s.squads[0].run.nextAt).state;
  const run = s.squads[0].run,
    node = run.node,
    remaining = run.target,
    began = s.updatedAt;
  assert.equal(encounter(q, node), "escort");
  assert.ok(roadHasEnemies(run));
  for (const id of s.squads[0].members) assert.equal(roadActionKind(q, run, id), "battle", id);
  const participants = new Set();
  for (let i = 0; i < 2000 && roadHasEnemies(s.squads[0].run); i++) {
    s = settle(s, s.squads[0].run.nextAt).state;
    const r = s.squads[0].run;
    assert.equal(r.target, remaining, "cart waits while the party fights");
    for (const e of r.events)
      if (e.at > began && ["hit", "skill", "heal"].includes(e.kind) && e.hero)
        participants.add(e.hero);
  }
  assert.deepEqual([...participants].sort(), ["aria", "finn", "leon", "mira"]);
  assert.ok(!roadHasEnemies(s.squads[0].run));
  for (let i = 0; i < 2000 && s.squads[0].run.target >= remaining; i++)
    s = settle(s, s.squads[0].run.nextAt).state;
  assert.equal(s.squads[0].run.node, node);
  assert.ok(s.squads[0].run.target < remaining, "remaining cargo resumes after combat");
});

test("Finn passive is purchased, equipped, persisted and applies only to his combat", () => {
  let s = testState(1000, 19, 17, 5000);
  const old = structuredClone(s);
  s = act(s, { type: "learnTechnique", id: "finn-opening" }, 1000);
  assert.equal(s.gold, old.gold - 120);
  assert.equal(techniqueMultiplier(s, "finn", "battle", false, 1), 1);
  s = roundtrip(
    act(
      s,
      { type: "setTechnique", hero: "finn", techniqueSlot: "passive", id: "finn-opening" },
      1000,
    ),
  );
  assert.equal(techniqueMultiplier(s, "finn", "battle", false, 1), 1.15);
  assert.equal(techniqueMultiplier(s, "finn", "battle", true, 1.6), 1.6 * 1.15);
  assert.equal(techniqueMultiplier(s, "finn", "gather", false, 1), 1);
  assert.equal(techniqueMultiplier(s, "aria", "battle", false, 1), 1);
  assert.throws(() =>
    act(testState(1000, 18, 17, 5000), { type: "learnTechnique", id: "finn-opening" }, 1000),
  );
});

test("four-person camp and each third-chapter route have distinct dialogue without future injuries", () => {
  const party = ["aria", "leon", "mira", "finn"];
  const camp = Array.from({ length: 8 }, (_, i) => idleBanter(i * 30000, party));
  assert.equal(new Set(camp.map(JSON.stringify)).size, 8);
  assert.ok(camp.every((lines) => lines.some((line) => line.speaker === "finn")));
  for (const { quest } of chapterThreeStages) {
    const lines = [0, 3, 6].map((node) => chapterThreeBanter({ quest, node, phase: "move" }));
    assert.equal(new Set(lines.map(JSON.stringify)).size, 3, quest);
    if (![STONE_RETURN_QUEST, "berne-restoration"].includes(quest))
      assert.ok(!JSON.stringify(lines).includes("包帯"));
  }
});
function roundtrip(s) {
  const id = "11111111-1111-4111-8111-111111111111";
  return parseBundle(
    JSON.parse(
      JSON.stringify({
        format: 4,
        deviceId: id,
        active: id,
        profiles: [{ id, name: "third chapter", test: true, state: s }],
        serial: 0,
        sound: false,
        cloudAt: 0,
      }),
    ),
  ).profiles[0].state;
}

test("an old chapter-two record opens a reward-free interlude, then chapter three; rereading is inert", () => {
  const old = testState(1000, 18, 17, 5000),
    snapshot = structuredClone(old);
  assert.equal(pendingInterlude(old).id, LUNCH_INTERLUDE);
  assert.equal(stageUnlocked(old, BERNE_QUEST), false);
  assert.throws(() => act(old, { type: "start", id: BERNE_QUEST }, 1000));
  assert.throws(() => read(testState(1000, 17, 17, 5000), LUNCH_INTERLUDE));
  const next = roundtrip(read(old, LUNCH_INTERLUDE));
  assert.deepEqual(old, snapshot);
  assert.equal(next.gold, old.gold);
  assert.deepEqual(next.xp, old.xp);
  assert.deepEqual(next.done, old.done);
  assert.equal(next.clears, old.clears);
  assert.deepEqual(next.owned, old.owned);
  assert.equal(pendingInterlude(next), undefined);
  assert.ok(availableQuests(next).some((q) => q.id === BERNE_QUEST));
  assert.deepEqual(read(next, LUNCH_INTERLUDE), next);
  assert.ok(availableStories(next).some((s) => s.id === LUNCH_INTERLUDE));
});

test("first departure adds Finn once at earned level, keeps older parties and supports saves and four health bars", () => {
  const initial = read(testState(1000, 18, 17, 5000), LUNCH_INTERLUDE);
  initial.xp.mira -= 100;
  const begun = act(initial, { type: "start", id: BERNE_QUEST, readDeparture: true }, 1000);
  assert.deepEqual(begun.squads[0].members, ["aria", "leon", "mira", "finn"]);
  assert.equal(begun.xp.finn, initial.xp.mira);
  assert.equal(inventoryOf(begun).items["familiar-dagger"], 1);
  assert.equal(inventoryOf(begun).equipped.finn.weapon, "familiar-dagger");
  const live = settle(begun, 6000).state;
  assert.deepEqual(roundtrip(live), JSON.parse(JSON.stringify(live)));
  const drawn = chapterRoadFrame({ squad: live.squads[0], now: 6000, ready: true, paused: false });
  assert.equal(drawn.battle.heroes.length, 4);
  assert.equal(
    drawn.battle.heroes.find((h) => h.id === "finn").maxHp,
    live.squads[0].run.health.finn.maxHp,
  );
  const stopped = act(live, { type: "stop" }, 6000);
  const repeat = act(stopped, { type: "start", id: BERNE_QUEST }, 6000);
  assert.equal(inventoryOf(repeat).items["familiar-dagger"], 1);
  assert.equal(repeat.xp.finn, live.xp.finn);
  const older = act(stopped, { type: "start", id: "mountain-entrance" }, 6000);
  assert.deepEqual(older.squads[0].members, ["aria", "leon", "mira"]);
});

test("Berne assortment requires arrival reading and remains buyable on revisiting earlier chapters", () => {
  let s = read(testState(1000, 18, 30, 10000), LUNCH_INTERLUDE);
  assert.equal(shopItems(s).filter((item) => item.tier === 2).length, 0);
  assert.throws(() => act(s, { type: "buy", id: "berne-dagger" }, 1000));
  s = measure(s, BERNE_QUEST).state;
  assert.equal(stageEndingPending(s), BERNE_QUEST);
  assert.equal(shopItems(s).filter((item) => item.tier === 2).length, 0);
  s = read(s, BERNE_QUEST + "-return");
  assert.equal(shopItems(s).filter((item) => item.tier === 2).length, 6);
  const gold = s.gold;
  s = outfitBerne(s);
  assert.equal(gold - s.gold, 2760);
  assert.deepEqual(roundtrip(s), JSON.parse(JSON.stringify(s)));
  s = act(s, { type: "start", id: "village-trade" }, s.updatedAt);
  assert.equal(shopItems(s).filter((item) => item.tier === 2).length, 6);
});

test("quiet jobs never spawn enemies", () => {
  for (const { quest } of chapterThreeStages) {
    if ([BERNE_QUEST, STONE_RETURN_QUEST].includes(quest)) continue;
    for (let node = 0; node < 15; node++)
      assert.notEqual(encounter(questById(quest), node), "battle");
  }
});
