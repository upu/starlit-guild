import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, skipTo, testState } from "../lib/game.ts";
import {
  confrontationTurn,
  paralyzed,
  shiftConfrontationClocks,
} from "../lib/chapter-four-battles.ts";
import { chapterFourBattleBanter } from "../lib/chapter-four-battle-banter.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { roadActorReady, advanceChapterRoad } from "../lib/chapter-road.ts";
import { combination, event } from "../lib/game-run.ts";
import { questById } from "../lib/game-rules.ts";
import { syncEnemyTotals } from "../lib/combat.ts";
import { parseBundle } from "../lib/save-format.ts";
import { portraitAtlases } from "../lib/portrait-expressions.ts";
import { retainBanter, startBanter, nextBanter } from "../lib/banter-exchange.ts";

function roundtrip(state) {
  const id = "44444444-4444-4444-8444-444444444444";
  return parseBundle(
    JSON.parse(
      JSON.stringify({
        format: 4,
        deviceId: id,
        active: id,
        profiles: [{ id, name: "duel", test: true, state }],
        serial: 0,
        sound: false,
        cloudAt: 0,
      }),
    ),
  ).profiles[0].state;
}
function until(state, predicate) {
  for (let i = 0; i < 6000; i++) {
    if (predicate(state.squads[0].run)) return state;
    state = settle(state, state.updatedAt + 100);
  }
  assert.fail("encounter cue never arrived");
}
function start(kind) {
  let s = testState(1000, 34, 25, 10000);
  s = act(
    s,
    {
      type: "start",
      id: kind === "lico" ? "lico-records" : "merrill-seedlings",
      readDeparture: true,
      value: false,
    },
    s.updatedAt,
  );
  return until(s, (r) => r?.enemies?.some((e) => e.trick === kind && !e.actions));
}
const frame = (s) =>
  chapterRoadFrame({ squad: s.squads[0], now: s.updatedAt, ready: true, paused: false });
const noEmit = () => {};

test("Merrill throws independent mushrooms, then heals allies without resurrection or exceeding the cap", () => {
  const s = until(start("merrill"), (r) => r?.enemies?.[0]?.cue === "summon");
  const r = s.squads[0].run,
    master = r.enemies[0],
    mushroom = r.enemies[1];
  assert.equal(mushroom.trick, "mushroom");
  assert.equal(r.enemies.length, 5, "four mushrooms appear in the same action");
  assert.equal(new Set(r.enemies.slice(1).map((e) => e.nextAt)).size, 1);
  assert.deepEqual(roundtrip(s), JSON.parse(JSON.stringify(s)));
  for (const enemy of frame(s).battle.enemies) {
    assert.ok(Number.isFinite(enemy.x) && Number.isFinite(enemy.lane));
  }
  assert.ok(r.road.opponents[mushroom.id]);
  assert.equal(mushroom.nextAt, master.cueAt + 1900);
  assert.equal(frame(s).battle.effects.filter((e) => e.kind === "mushroomThrow").length, 4);
  for (const enemy of r.enemies.slice(1)) enemy.hp = 1;
  master.hp -= 2;
  confrontationTurn(r, master, master.nextAt, noEmit);
  assert.ok(mushroom.hp > 1);
  assert.equal(master.hp, master.maxHp);
  assert.ok(
    r.enemies.every((e) => e.hp > 1),
    "the same song heals every living ally",
  );
  confrontationTurn(r, master, master.nextAt + master.period, noEmit);
  assert.equal(r.enemies.length, 5);
  mushroom.hp = 0;
  const second = r.enemies[2];
  second.hp = second.maxHp - 1;
  for (let i = 0; i < 10; i++)
    confrontationTurn(r, master, master.nextAt + 7200 + i * 3600, noEmit);
  assert.equal(mushroom.hp, 0);
  assert.equal(second.hp, second.maxHp);
  assert.equal(r.enemies.length, 5);
});

test("Lico stops one actor temporarily without poison damage; movement and pair actions obey the status", () => {
  const s = until(start("lico"), (r) => r?.enemies?.[0]?.cue === "paralyze");
  const sq = s.squads[0],
    r = sq.run,
    at = s.updatedAt;
  const affected = r.actors.filter((a) => paralyzed(a, at));
  assert.equal(affected.length, 1);
  const actor = affected[0],
    q = questById(r.quest),
    x = r.road.members[actor.hero].x;
  assert.equal(roadActorReady(q, r, actor.hero), false);
  assert.equal(paralyzed(actor, actor.paralyzedUntil), false);
  const health = structuredClone(r.health),
    events = r.events.length;
  combination(s, sq, at);
  assert.equal(r.events.length, events);
  advanceChapterRoad(q, r, at + 100);
  assert.equal(r.road.members[actor.hero].x, x);
  assert.deepEqual(r.health, health);
  const master = r.enemies[0],
    untilAt = actor.paralyzedUntil;
  for (let i = 0; i < 8; i++) confrontationTurn(r, master, at + 200 + i, noEmit);
  assert.equal(actor.paralyzedUntil, untilAt, "a guarded actor cannot be repeatedly paralyzed");
  assert.deepEqual(r.health, health, "smoke never deals poison damage");
});

test("active status, summons and action cues survive saves and deterministic advancement", () => {
  for (const kind of ["lico", "merrill"]) {
    const s = until(start(kind), (r) => r?.enemies?.[0]?.actions >= 2);
    assert.deepEqual(roundtrip(s), JSON.parse(JSON.stringify(s)));
    const saved = roundtrip(s),
      end = s.updatedAt + 8000;
    const resumed = skipTo(saved, saved.updatedAt + 3600000);
    assert.deepEqual(resumed.squads[0].run.health, saved.squads[0].run.health);
    assert.deepEqual(
      resumed.squads[0].run.enemies.map((e) => e.hp),
      saved.squads[0].run.enemies.map((e) => e.hp),
    );
    assert.deepEqual(roundtrip(resumed), JSON.parse(JSON.stringify(resumed)));
    assert.equal(
      resumed.squads[0].run.enemies[0].cueAt,
      saved.squads[0].run.enemies[0].cueAt + 3600000,
    );
    let fine = saved;
    while (fine.updatedAt < end) fine = settle(fine, fine.updatedAt + 100);
    assert.deepEqual(JSON.parse(JSON.stringify(fine)), JSON.parse(JSON.stringify(settle(s, end))));
    const r = s.squads[0].run,
      master = r.enemies[0],
      cueAt = master.cueAt;
    const clocks = r.actors.map((a) => a.paralyzedUntil);
    shiftConfrontationClocks(r, 10000);
    assert.equal(master.cueAt, cueAt + 10000);
    r.actors.forEach((a, i) =>
      assert.equal(a.paralyzedUntil, clocks[i] === undefined ? undefined : clocks[i] + 10000),
    );
    const invalid = structuredClone(saved);
    invalid.squads[0].run.enemies[0].trick = kind === "lico" ? "merrill" : "lico";
    assert.throws(() => roundtrip(invalid));
    const old = structuredClone(saved);
    for (const enemy of old.squads[0].run.enemies) {
      delete enemy.trick;
      delete enemy.actions;
      delete enemy.cue;
      delete enemy.cueAt;
    }
    assert.doesNotThrow(() => roundtrip(old));
  }
});

test("Merrill's healing actually restores an injured mushroom during ordinary play", () => {
  const s = until(start("merrill"), (r) =>
    r?.events.some((e) => e.text.includes("メリルの歌") && e.amount > 0),
  );
  assert.ok(s.squads[0].run.enemies.some((e) => e.trick === "mushroom" && e.hp > 0));
});

test("battle lines have real portraits and short-lived enemy exchanges are retained in order", () => {
  for (const kind of ["lico", "merrill"]) {
    const s = start(kind),
      r = s.squads[0].run,
      master = r.enemies[0];
    let exchange = startBanter([{ speaker: "aria", text: "道中の会話" }]);
    const expected = [];
    for (let i = 0; i < 3; i++) {
      const lines = chapterFourBattleBanter(r);
      for (const line of lines)
        assert.ok(portraitAtlases[line.speaker].expressions.includes(line.expression), line.text);
      if (!expected.includes(lines[0].text)) expected.push(lines[0].text);
      exchange = retainBanter(exchange, lines);
      confrontationTurn(r, master, s.updatedAt + i * 3600, event);
      syncEnemyTotals(r);
    }
    for (let i = 0; i < 20; i++) exchange = nextBanter(exchange, []);
    assert.deepEqual(
      exchange.history.filter((l) => expected.includes(l.text)).map((l) => l.text),
      expected,
    );
    assert.ok(exchange.history.some((l) => l.speaker === kind));
  }
});
