import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { act, settle, testState, availableQuests, encounter, level } from "../lib/game.ts";
import { questById } from "../lib/game-rules.ts";
import { availableStories, stories } from "../lib/stories.ts";
import { storyArtAt } from "../lib/story-art.ts";
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
import { trainedChapter } from "../scripts/check-combat-balance.mjs";
import { chapterRoute, measure } from "../scripts/check-chapter-two-balance.mjs";
import { chapterThreeRoute, outfitBerne } from "../scripts/check-chapter-three-balance.mjs";

const read = (s, id) => act(s, { type: "readStory", id }, s.updatedAt);
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
        legacyImported: true,
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

test("quiet jobs never spawn enemies; exchange happens before the playable night road and bridge dialogue after", () => {
  for (const { quest } of chapterThreeStages) {
    if ([BERNE_QUEST, STONE_RETURN_QUEST].includes(quest)) continue;
    for (let node = 0; node < 15; node++)
      assert.notEqual(encounter(questById(quest), node), "battle");
  }
  const departure = stories.find((s) => s.id === STONE_RETURN_QUEST + "-departure");
  const ending = stories.find((s) => s.id === STONE_RETURN_QUEST + "-return");
  assert.ok(departure.lines.some((l) => l.text.includes("覆いの下へ布")));
  assert.match(departure.lines.at(-1).text, /橋まで運んで/);
  assert.equal(ending.lines[0].text, "二人とも、こちらへ。傷はない？");
  assert.ok(!ending.lines.some((l) => l.text.includes("覆いの下へ布")));
  for (const id of [
    BERNE_QUEST + "-departure",
    STONE_RETURN_QUEST + "-departure",
    "berne-restoration-return",
  ]) {
    assert.equal(storyArtAt(id, 4), undefined);
    assert.ok(storyArtAt(id, 5));
  }
  const png = readFileSync(new URL("../assets/source/road/finn-v1.png", import.meta.url));
  assert.equal(png[25], 6, "Finn uses real transparency");
});

test("earned chapter-two state carries through all nine stages with sustainable growth and equipped advantage", () => {
  const first = trainedChapter(true),
    second = chapterRoute("standard", first.state);
  const original = structuredClone(second.state);
  const third = chapterThreeRoute(second.state);
  assert.deepEqual(second.state, original);
  assert.equal(third.records.length, 9);
  assert.ok(third.records.every((r) => r.cleared));
  assert.ok(third.trainingSeconds <= 3600, "implementation guardrail, not an agreed time target");
  assert.ok(third.state.owned.every((id) => level(third.state.xp[id]) >= 20));
  assert.deepEqual(roundtrip(third.state), JSON.parse(JSON.stringify(third.state)));
  const start = testState(1000, 25, 19, 10000);
  const plain = measure(start, STONE_RETURN_QUEST);
  const equipped = measure(outfitBerne(start), STONE_RETURN_QUEST);
  assert.ok(
    equipped.record.cleared || equipped.state.squads[0].run.node > plain.state.squads[0].run.node,
  );
  const strong = measure(outfitBerne(testState(1000, 25, 30, 10000)), STONE_RETURN_QUEST);
  assert.ok(strong.record.cleared);
  assert.equal(strong.record.rests, 0);
});
