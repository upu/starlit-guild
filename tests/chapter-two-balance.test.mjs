import { test } from "node:test";
import assert from "node:assert/strict";
import { act, settle, availableQuests, level, allQuests, estimate } from "../lib/game.ts";
import { chapterTwoPresetState } from "../lib/chapter-two-presets.ts";
import { parseBundle } from "../lib/save-format.ts";
import { measure, isolated, chapterRoute } from "../scripts/check-chapter-two-balance.mjs";
import { equippedTechnique, learnableTechniques } from "../lib/techniques.ts";

test("Mira can learn a passive on joining; only setting it improves actual healing", () => {
  const initial = isolated("begging-golem", 1);
  assert.ok(learnableTechniques(initial).some((t) => t.id === "mira-care"));
  const learned = act(initial, { type: "learnTechnique", id: "mira-care" }, 1000);
  assert.equal(learned.gold, initial.gold - 80);
  assert.equal(equippedTechnique(learned, "mira", "passive"), null);
  const equipped = act(
    learned,
    { type: "setTechnique", hero: "mira", techniqueSlot: "passive", id: "mira-care" },
    1000,
  );
  const removed = act(
    equipped,
    { type: "setTechnique", hero: "mira", techniqueSlot: "passive" },
    1000,
  );
  function firstHeal(input) {
    let state = act(input, { type: "start", id: "begging-golem", readDeparture: true }, 1000);
    state.squads[0].run.health.mira.hp = 1;
    const start = structuredClone(state);
    for (let i = 0; i < 1000 && state.squads[0].run; i++) {
      state = settle(state, state.squads[0].run.nextAt).state;
      const heal = state.squads[0].run?.events.find((e) => e.kind === "heal" && e.hero === "mira");
      if (heal) {
        assert.deepEqual(
          { ...settle(start, state.updatedAt).state, log: [] },
          { ...state, log: [] },
        );
        return heal.amount;
      }
    }
    assert.fail("Mira never healed");
  }
  assert.equal(firstHeal(initial), 6);
  assert.equal(firstHeal(learned), 6);
  assert.equal(firstHeal(equipped), 7);
  assert.equal(firstHeal(removed), 6);
});

test("chapter presets keep the story entry, locked recruitment and independent saved state", () => {
  for (const preset of ["standard", "strong"]) {
    const state = chapterTwoPresetState(preset, 1000),
      id = crypto.randomUUID();
    assert.deepEqual(state.owned, ["aria", "leon"]);
    assert.equal(state.prologue, true);
    assert.equal(state.squads[0].lastQuest, "hilltop-picnic");
    assert.ok(availableQuests(state).some((q) => q.id === "hilltop-picnic"));
    assert.ok(!availableQuests(state).some((q) => q.id === "mountain-entrance"));
    assert.equal(level(state.xp.aria), preset === "standard" ? 10 : 30);
    const restored = parseBundle(
      JSON.parse(
        JSON.stringify({
          format: 4,
          deviceId: id,
          active: id,
          profiles: [{ id, name: preset, test: true, state }],
          serial: 0,
          sound: false,
          cloudAt: 0,
          legacyImported: true,
        }),
      ),
    ).profiles[0].state;
    assert.deepEqual(restored, state);
  }
  const first = chapterTwoPresetState("standard", 1000);
  first.xp.aria = 999;
  assert.notEqual(chapterTwoPresetState("standard", 1000).xp.aria, 999);
});
test("Mira leaves a window of damage between heals and healing survives live/offline settling", () => {
  let state = act(
    isolated("begging-golem", 15),
    { type: "start", id: "begging-golem", readDeparture: true, value: false },
    1000,
  );
  const run = state.squads[0].run;
  run.health.aria.hp = Math.floor(run.health.aria.maxHp / 2);
  const initial = structuredClone(state),
    times = [];
  const seen = new Set();
  while (state.squads[0].run && state.updatedAt < 25000) {
    state = settle(state, state.squads[0].run.nextAt).state;
    for (const e of state.squads[0].run?.events || []) {
      if (e.hero !== "mira" || e.kind !== "heal" || seen.has(e.id)) continue;
      seen.add(e.id);
      times.push(e.at);
      assert.equal(state.squads[0].run.actors.find((a) => a.hero === "mira").actions % 4, 0);
    }
  }
  assert.ok(times.length > 1);
  assert.ok(
    times[0] >=
      run.actors.find((a) => a.hero === "mira").nextAt +
        3 * run.actors.find((a) => a.hero === "mira").period,
  );
  for (let i = 1; i < times.length; i++) assert.ok(times[i] - times[i - 1] >= 4000);
  const offline = settle(initial, state.updatedAt).state;
  assert.deepEqual({ ...offline, log: [] }, { ...state, log: [] });
});
test("boss difficulty rewards growth and defensive technique choice", () => {
  assert.equal(measure(isolated("sweet-blockade", 15), "sweet-blockade").record.cleared, false);
  const challenge = measure(isolated("sweet-blockade", 19), "sweet-blockade").record;
  assert.ok(challenge.cleared);
  assert.ok(challenge.minHp < 40);
  assert.ok(challenge.heals > 0);
  assert.ok(challenge.commands >= 2);
  let guard = isolated("sweet-blockade", 15);
  guard = act(guard, { type: "learnTechnique", id: "leon-guard" }, 1000);
  guard = act(
    guard,
    { type: "setTechnique", hero: "leon", techniqueSlot: "active", id: "leon-guard" },
    1000,
  );
  assert.ok(measure(guard, "sweet-blockade").record.cleared);
  const strong = measure(isolated("sweet-blockade", 30), "sweet-blockade").record;
  assert.ok(strong.cleared && strong.rests === 0 && strong.minHp >= 60);
});
test("non-hostile work takes sustained effort and preserves a partially completed target", () => {
  const before = isolated("medicine-packing", 14),
    result = measure(before, "medicine-packing").record;
  assert.ok(result.cleared && result.seconds >= 90 && result.hurt === 0);
  const q = allQuests.find((q) => q.id === "medicine-packing");
  assert.ok(estimate(before, before.squads[0], q) >= 90);
  const active = act(before, { type: "start", id: q.id, readDeparture: true }, before.updatedAt);
  active.squads[0].run.targetMax = 56;
  active.squads[0].run.target = 31;
  const same = settle(active, active.updatedAt).state;
  assert.equal(same.squads[0].run.target, 31);
  assert.equal(same.squads[0].run.targetMax, 56);
});
test("trained gathering clears resistant work faster without changing its rewards", () => {
  const quest = "medicine-packing",
    weakStart = isolated(quest, 14),
    strongStart = isolated(quest, 30),
    weak = measure(weakStart, quest),
    strong = measure(strongStart, quest);
  assert.ok(weak.record.cleared && strong.record.cleared);
  assert.ok(weak.record.seconds > strong.record.seconds * 1.5);
  assert.equal(weak.record.hurt, 0);
  assert.equal(strong.record.hurt, 0);
  assert.equal(weak.state.xp.aria - weakStart.xp.aria, strong.state.xp.aria - strongStart.xp.aria);
  assert.equal(weak.state.gold - weakStart.gold, strong.state.gold - strongStart.gold);
});
test("escort work also rewards preparation without adding enemy attacks", () => {
  const quest = "waiting-households",
    weak = measure(isolated(quest, 18), quest).record,
    strong = measure(isolated(quest, 30), quest).record;
  assert.ok(weak.cleared && strong.cleared);
  assert.ok(weak.seconds > strong.seconds * 1.5);
  assert.equal(weak.hurt, 0);
  assert.equal(strong.hurt, 0);
});
test("standard reaches the end through earned growth; strong needs no farming", () => {
  const standard = chapterRoute(),
    strong = chapterRoute("strong");
  assert.equal(standard.records.length, 9);
  assert.ok(standard.records.every((r) => r.cleared));
  assert.ok(standard.trainingSeconds >= 1800 && standard.trainingSeconds <= 3600);
  assert.ok(standard.totalSeconds > standard.trainingSeconds);
  assert.equal(strong.records.length, 9);
  assert.ok(strong.records.every((r) => r.cleared && r.rests === 0));
  assert.equal(strong.trainingSeconds, 0);
});
