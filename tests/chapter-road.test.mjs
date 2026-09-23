import { LUNCH_INTERLUDE } from "../lib/chapter-three.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState, allQuests, encounter } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { parseBundle } from "../lib/save-format.ts";
import {
  chapterRoadFrame,
  chapterRoadHit,
  chapterRoadX,
} from "../lib/chapter-road-presentation.ts";
import { roadActionKind, roadHasEnemies } from "../lib/chapter-road.ts";
import { travellerLane } from "../lib/road-view.ts";
import { roadY, roadBackdrop } from "../lib/road-layout.ts";

function start(index, level = 30) {
  let state = testState(1000, index, level, 1000);
  if (index === 18) state = act(state, { type: "readStory", id: LUNCH_INTERLUDE }, 1000);
  return act(
    state,
    { type: "start", id: storyStages[index].quest, value: false, readDeparture: true },
    1000,
  );
}
function bundle(state) {
  const id = "11111111-1111-4111-8111-111111111111";
  return {
    format: 4,
    deviceId: id,
    active: id,
    profiles: [{ id, name: "road test", test: true, state }],
    serial: 0,
    sound: false,
    cloudAt: 0,
    legacyImported: true,
  };
}
const roundtrip = (s) => parseBundle(JSON.parse(JSON.stringify(bundle(s)))).profiles[0].state;
const input = (s, now = s.updatedAt) => ({
  squad: s.squads[0],
  startQuest: s.squads[0].lastQuest,
  now,
  ready: true,
  paused: false,
});

test("all 27 scrolling stages finish unattended, roundtrip coordinates, preserve exact rewards and offline parity", () => {
  for (let index = 0; index < storyStages.length; index++) {
    const initial = start(index),
      q = allQuests.find((q) => q.id === storyStages[index].quest);
    let s = initial,
      steps = 0,
      lastNode = -1,
      merged = false;
    while (s.squads[0].run && s.updatedAt < 601000) {
      const r = s.squads[0].run;
      if (steps++ % 40 === 0 || lastNode !== r.node || (!merged && r.road.ambushNode !== undefined))
        assert.deepEqual(roundtrip(s), JSON.parse(JSON.stringify(s)), q.id);
      merged = r.road.ambushNode !== undefined;
      lastNode = r.node;
      const before = structuredClone(r.road.members);
      s = settle(s, r.nextAt).state;
      const next = s.squads[0].run;
      if (next && next.node !== r.node)
        for (const id of Object.keys(before))
          assert.ok(
            Math.abs(next.road.members[id].x - before[id].x) < 30,
            "waypoint must not teleport the party",
          );
    }
    assert.equal(s.squads[0].run, null, q.id);
    assert.equal(s.gold - initial.gold, q.gold, q.id);
    assert.ok(Math.abs(s.xp.aria - initial.xp.aria - q.xp) < 1e-7, q.id);
    assert.equal(s.done[q.id], 1);
    assert.deepEqual(roundtrip(s), JSON.parse(JSON.stringify(s)));
    const offline = settle(initial, s.updatedAt).state;
    assert.deepEqual({ ...s, log: [] }, { ...offline, log: [] }, q.id);
  }
});

test("workers cooperate, split into guard and gatherer under attack and face rear ambushes", () => {
  let s = start(3, 5),
    cooperation = false,
    guard = false,
    rear = false,
    knockback = false,
    differentPaces = false;
  const q = allQuests.find((q) => q.id === s.squads[0].run.quest);
  for (let count = 0; s.squads[0].run && count < 6000; count++) {
    const r = s.squads[0].run;
    const frame = chapterRoadFrame(input(s));
    cooperation ||= frame.look.workers.length === 2 && !roadHasEnemies(r);
    guard ||=
      roadHasEnemies(r) &&
      encounter(q, r.node) !== "battle" &&
      roadActionKind(q, r, "leon") === "battle" &&
      roadActionKind(q, r, "aria") !== "battle";
    rear ||= r.enemies.some((e) => e.hp > 0 && r.road.opponents[e.id].x < r.road.members.aria.x);
    knockback ||= Object.values(r.road.opponents).some((e) => Math.abs(e.recoil) > 5);
    const [a, l] = [r.road.members.aria, r.road.members.leon];
    differentPaces ||=
      a.walking && l.walking && Math.abs(a.x - a.previousX - (l.x - l.previousX)) > 0.1;
    s = settle(s, r.nextAt).state;
    if (cooperation && guard && rear && knockback && differentPaces) break;
  }
  assert.ok(
    cooperation && guard && rear && knockback && differentPaces,
    JSON.stringify({ cooperation, guard, rear, knockback, differentPaces }),
  );
});

test("camera follows leftward recoil and keeps a rear attacker visible, then follows the return to work", () => {
  let s = start(13, 30);
  while (s.squads[0].run.road.ambushNode === undefined) s = settle(s, s.squads[0].run.nextAt).state;
  const run = s.squads[0].run,
    road = run.road,
    enemy = road.opponents[run.enemies[0].id];
  // Reproduce a prolonged rear fight beyond the previously reached camera position.
  enemy.x = enemy.previousX = road.camera - 340;
  road.members.leon.x = road.members.leon.previousX = enemy.x + 55;
  road.members.leon.recoil = -45;
  const oldCamera = road.camera;
  assert.ok(chapterRoadX(enemy.x, oldCamera, 390, "puppets") < 0);
  s = settle(s, s.updatedAt + 100).state;
  assert.ok(s.squads[0].run.road.camera < oldCamera);
  for (const width of [320, 390, 1280]) {
    const { battle } = chapterRoadFrame(input(s, s.updatedAt + 80));
    for (const x of [battle.enemies[0].x, battle.heroes.find((h) => h.id === "leon").x]) {
      const drawn = chapterRoadX(x, battle.distance, width, battle.stage);
      assert.ok(drawn >= 24 && drawn <= width - 24);
    }
  }
  assert.deepEqual(roundtrip(s), JSON.parse(JSON.stringify(s)));
  const leftCamera = s.squads[0].run.road.camera;
  s = settle(s, s.updatedAt + 15000).state;
  assert.ok(s.squads[0].run.road.camera > leftCamera);
});

test("old unfinished saves retain exact HP, clocks and rewards and adopt scrolling on next departure", () => {
  let s = start(9, 30);
  delete s.squads[0].run.road;
  s = settle(s, 3500).state;
  const saved = structuredClone(s);
  assert.deepEqual(roundtrip(s), JSON.parse(JSON.stringify(saved)));
  s = settle(s, 601000).state;
  s = act(s, { type: "readStory", id: "hilltop-picnic-return" }, s.updatedAt);
  s = act(s, { type: "start", id: "hilltop-picnic", value: false }, s.updatedAt);
  assert.equal(s.squads[0].run.road.version, 1);
});

test("drawing is read-only, uses real individual HP and accurately targets taps at interpolated positions", () => {
  const s = settle(start(12), 2300).state,
    before = structuredClone(s);
  s.squads[0].run.health.leon.hp -= 7;
  const modified = structuredClone(s),
    frame = chapterRoadFrame(input(s, 2350));
  assert.equal(frame.battle.heroes.length, 3);
  assert.equal(frame.battle.heroes.find((h) => h.id === "leon").hp, s.squads[0].run.health.leon.hp);
  for (const hero of frame.battle.heroes) {
    const point = {
      x: chapterRoadX(hero.x, frame.battle.distance, 390),
      y: roadY(travellerLane(hero.id), 300) - Math.min(108, 390 * 0.18, 300 * 0.34) * 0.45,
    };
    assert.equal(chapterRoadHit(input(s, 2350), point, 390, 300), `heal:${hero.id}`);
  }
  assert.deepEqual(s, modified);
  assert.notDeepEqual(s, before);
  for (const mutate of [
    (r) => (r.road.members.aria.x = Infinity),
    (r) => delete r.road.members.leon,
    (r) => (r.road.nextAt = 0),
    (r) => (r.road.ambushNode = 14),
  ]) {
    const bad = structuredClone(s);
    mutate(bad.squads[0].run);
    assert.throws(() => roundtrip(bad));
  }
});

test("transport advances behind the cart, pauses for an ambush and never slashes supplies", () => {
  let state = start(1, 5),
    pushing = false,
    defended = false;
  for (let i = 0; i < 6000 && state.squads[0].run; i++) {
    const run = state.squads[0].run;
    const { battle, look } = chapterRoadFrame(input(state));
    if (look.work?.cargo && look.workers.length) {
      pushing = true;
      for (const hero of battle.heroes.filter((h) => look.workers.includes(h.id)))
        assert.ok(hero.x < battle.gathering.x + 65 - 60);
      assert.ok(
        battle.effects.every((e) => ["heal", "hurt"].includes(e.kind) || battle.enemies.length),
      );
    }
    if (look.work?.cargo && roadHasEnemies(run)) {
      defended = true;
      const before = run.target;
      state = settle(state, run.nextAt).state;
      if (state.squads[0].run?.node === run.node) assert.equal(state.squads[0].run.target, before);
    } else state = settle(state, run.nextAt).state;
    if (pushing && defended) break;
  }
  assert.ok(pushing && defended);
});

test("the ground plane stays compact and the untiled background covers all viewport sizes", () => {
  for (const [width, height] of [
    [1280, 900],
    [390, 630],
    [320, 250],
    [844, 240],
  ]) {
    assert.ok(roadY(0.82, height) - roadY(0.54, height) <= 68);
    for (const progress of [0, 0.4, 1]) {
      const box = roadBackdrop(width, height, 1536, 1024, progress);
      assert.ok(box.x <= 0 && box.y <= 0);
      assert.ok(box.x + box.width >= width - 0.01);
      assert.ok(box.y + box.height >= height - 0.01);
    }
  }
});
