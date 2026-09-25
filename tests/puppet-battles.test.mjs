import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, act, settle, allQuests, estimate } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { createEnemies, syncEnemyTotals, damageEnemy } from "../lib/combat.ts";
import { groupEnemyTurns } from "../lib/enemy-turns.ts";
import { placeRoadEnemies, advanceChapterRoad } from "../lib/chapter-road.ts";
import { event } from "../lib/game-run.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { questNodes, puppetCue } from "../lib/puppet-battles.ts";
import { adventureFrame, adventureAssets, spriteSize } from "../lib/adventure-presentation.ts";
import { parseBundle } from "../lib/save-format.ts";
import { joinStoryMira } from "../lib/game-actions.ts";
const ids = ["spinning-signpost", "begging-golem", "sweet-blockade"];
function ready(id, level = 25) {
  const s = initialState(1000);
  joinStoryMira(s);
  s.xp = { aria: 30 * (level - 1) ** 2, leon: 30 * (level - 1) ** 2, mira: 30 * (level - 1) ** 2 };
  for (const { quest } of storyStages.slice(
    0,
    storyStages.findIndex((stage) => stage.quest === id),
  )) {
    s.done[quest] = 1;
    s.story.departed.push(quest);
    s.story.completed.push(quest);
    s.story.read.push(quest + "-departure", quest + "-return");
  }
  return act(s, { type: "start", id, readDeparture: true, value: false }, s.updatedAt);
}
function roundtrip(state) {
  const id = crypto.randomUUID();
  return parseBundle(
    JSON.parse(
      JSON.stringify({
        format: 4,
        deviceId: id,
        active: id,
        profiles: [{ id, name: "人形戦確認", test: true, state }],
        serial: 1,
        sound: false,
        cloudAt: 0,
      }),
    ),
  ).profiles[0].state;
}
function finalBattle() {
  const s = ready(ids[2]),
    r = s.squads[0].run;
  r.node = 2;
  r.enemies = createEnemies(
    allQuests.find((q) => q.id === ids[2]),
    2,
    r.phaseAt,
  );
  syncEnemyTotals(r);
  placeRoadEnemies(r);
  // Direct strike tests start with both sides already in melee range.
  for (const position of Object.values(r.road.members)) position.x = 560;
  for (const position of Object.values(r.road.opponents)) position.x = 600;
  return s;
}
test("short stages retain full coins and XP, distinct formations and live/offline results", () => {
  for (const id of ids) {
    const initial = ready(id),
      q = allQuests.find((q) => q.id === id);
    let s = roundtrip(initial),
      seen = new Map();
    assert.equal(s.squads[0].run.nodes, questNodes(id));
    assert.ok(estimate(s, s.squads[0], q) > 0);
    for (let i = 0; s.squads[0].run && i < 10000; i++) {
      const r = s.squads[0].run;
      seen.set(
        r.road?.ambushNode ?? r.node,
        r.enemies.map((e) => e.role),
      );
      s = roundtrip(settle(s, r.nextAt).state);
    }
    assert.equal(s.squads[0].run, null);
    assert.equal(s.gold - initial.gold, q.gold);
    assert.ok(Math.abs(s.xp.aria - initial.xp.aria - q.xp) < 1e-8);
    const offline = settle(initial, s.updatedAt).state;
    assert.deepEqual({ ...s, log: [] }, { ...offline, log: [] });
    if (id === ids[0]) assert.deepEqual(seen.get(7), ["puppet", "puppet"]);
    if (id === ids[1])
      assert.deepEqual([...seen.values()], [["puppet"], ["golem"], ["puppet", "golem"]]);
    if (id === ids[2]) assert.deepEqual(seen.get(2), ["puppet", "sweeper", "puppeteer"]);
  }
});
test("heavy attacks hit harder, sweep hits two distinct members, and commands repeat only living dolls", () => {
  const s = finalBattle(),
    sq = s.squads[0],
    r = sq.run,
    q = allQuests.find((q) => q.id === r.quest),
    [small, big, master] = r.enemies;
  assert.ok(small.period < big.period);
  assert.ok(small.attack < big.attack);
  let events = [];
  const emit = (_r, at, kind, text, amount, hero, target, enemy) =>
    events.push({ at, kind, text, amount, target, enemy });
  big.nextAt = 5000;
  small.nextAt = 9000;
  master.nextAt = 10000;
  groupEnemyTurns(s, sq, r, q, 5000, emit);
  assert.equal(events.length, 2);
  assert.equal(new Set(events.map((e) => e.target)).size, 2);
  assert.ok(events.every((e) => e.text.includes("なぎ払い")));
  events = [];
  small.hp = 0;
  groupEnemyTurns(s, sq, r, q, 10000, emit);
  assert.equal(events[0].text, "カボチャ頭の少女「もう一回なのよ！」");
  assert.equal(events.filter((e) => e.kind === "hurt").length, 2);
  assert.ok(
    events
      .filter((e) => e.kind === "hurt")
      .every((e) => e.enemy === big.id && e.text.includes("追撃")),
  );
  big.hp = 1;
  damageEnemy(r, 1000, 100);
  assert.equal(master.hp, 0);
  assert.equal(r.target, 0);
});
test("command light travels from the master to living dolls, survives loading and expires with its cue", () => {
  const s = finalBattle(),
    r = s.squads[0].run;
  const [small, big, master] = r.enemies;
  const at = s.updatedAt;
  small.nextAt = big.nextAt = at + 5000;
  master.nextAt = at;
  r.road.opponents[master.id].x = 780;
  groupEnemyTurns(
    s,
    s.squads[0],
    r,
    allQuests.find((q) => q.id === r.quest),
    at,
    event,
  );
  const frame = (state, now = at + 200, reduced = false) =>
    chapterRoadFrame(
      {
        squad: state.squads[0],
        startQuest: r.quest,
        now,
        ready: true,
        paused: false,
      },
      reduced,
    );
  const before = structuredClone(s);
  const shown = frame(s);
  const commands = shown.battle.effects.filter((e) => e.kind === "command");
  assert.equal(commands.length, 2);
  assert.equal(new Set(commands.map((e) => e.id)).size, 2);
  for (const effect of commands) {
    assert.equal(effect.fromX, shown.battle.enemies[2].x);
    assert.equal(effect.fromLane, shown.battle.enemies[2].lane);
    assert.ok(
      shown.battle.enemies.slice(0, 2).some((e) => e.x === effect.x && e.lane === effect.lane),
    );
  }
  assert.equal(shown.look.enemies[3].label, "もう一回なのよ！");
  assert.deepEqual(s, before); // Presentation does not move actors or apply another attack.
  assert.deepEqual(frame(roundtrip(s)), shown);
  assert.equal(
    frame(s, at + 200, true).battle.effects.filter((e) => e.kind === "command").length,
    2,
  );
  small.hp = 0;
  assert.equal(frame(s).battle.effects.filter((e) => e.kind === "command").length, 1);
  assert.equal(frame(s, at - 1).battle.effects.filter((e) => e.kind === "command").length, 0);
  assert.equal(frame(s, at + 900).battle.effects.filter((e) => e.kind === "command").length, 0);
  assert.notEqual(frame(s, at + 900).look.enemies[3].label, "もう一回なのよ！");
  r.road.scene = { kind: "escape", at };
  assert.deepEqual(frame(s).battle.effects, []);
});

test("the master backs away behind living dolls throughout repeated golem knockback", () => {
  const s = finalBattle(),
    r = s.squads[0].run;
  const q = allQuests.find((q) => q.id === r.quest);
  const [small, big, master] = r.enemies;
  const golem = r.road.opponents[big.id],
    leader = r.road.opponents[master.id];
  leader.x = leader.previousX = golem.x + 100;
  const origin = leader.x;
  for (let tick = 0; tick < 150; tick++) {
    golem.recoil = 50;
    const previous = leader.x;
    advanceChapterRoad(q, r, r.road.at + 100);
    assert.ok(leader.x >= golem.x + 99);
    assert.ok(leader.x - previous <= 11.001);
  }
  assert.ok(golem.x > origin + 400);
  const stopped = leader.x;
  big.hp = 0;
  advanceChapterRoad(q, r, r.road.at + 100);
  assert.equal(leader.x, stopped); // Do not chase back into the front line after the golem falls.
  const doll = r.road.opponents[small.id];
  doll.x = leader.x - 99;
  doll.recoil = 50;
  advanceChapterRoad(q, r, r.road.at + 100);
  assert.ok(leader.x >= doll.x + 99);
  // An in-progress save may already have the master in front of the remaining doll.
  leader.x = doll.x - 120;
  for (let tick = 0; tick < 30; tick++) advanceChapterRoad(q, r, r.road.at + 100);
  assert.ok(leader.x >= doll.x + 99);
});
test("commands, telegraphs, individual art and clocks survive saving and reduced-size layouts", () => {
  const s = roundtrip(finalBattle()),
    r = s.squads[0].run,
    master = r.enemies[2];
  assert.equal(puppetCue(master, master.nextAt - 1200), "");
  assert.equal(puppetCue(master, master.nextAt - 500), "もう一回なのよ！");
  const frame = adventureFrame({
    squad: s.squads[0],
    startQuest: r.quest,
    now: master.nextAt - 500,
    ready: true,
    paused: false,
  });
  assert.equal(frame.targets[2].cue, "もう一回なのよ！");
  assert.equal(new Set(frame.targets.map((t) => t.asset)).size, 3);
  for (const target of frame.targets) assert.ok(adventureAssets(frame).includes(target.asset));
  for (const [width, height] of [
    [320, 220],
    [390, 260],
    [900, 420],
  ])
    for (const target of frame.targets) {
      const size = spriteSize(width, height) * target.scale;
      assert.ok(target.x * width - size / 3 >= 0);
      assert.ok(target.x * width + size / 3 <= width);
      assert.ok(target.y * height - size * 0.9 >= 0);
    }
  const loaded = roundtrip(s);
  assert.deepEqual(loaded.squads[0].run.enemies, r.enemies);
  const end = s.updatedAt + 90000,
    offline = settle(loaded, end).state;
  let live = s;
  while (live.squads[0].run && live.squads[0].run.nextAt <= end)
    live = roundtrip(settle(live, live.squads[0].run.nextAt).state);
  live = settle(live, end).state;
  assert.deepEqual({ ...live, log: [] }, { ...offline, log: [] });
  const bad = structuredClone(s);
  bad.squads[0].run.enemies[0].role = "unknown";
  assert.throws(() => roundtrip(bad));
});
test("old 15-node saves keep HP, clocks, rewards and composition until completing the run", () => {
  for (const id of ids) {
    let s = ready(id);
    const r = s.squads[0].run,
      q = allQuests.find((q) => q.id === id);
    delete r.road; // Historical saves have no spatial clock.
    r.nodes = 15;
    r.node = id === ids[0] ? 7 : 10;
    r.enemies = createEnemies(q, r.node, r.phaseAt, false);
    r.enemies[0].hp -= 11;
    syncEnemyTotals(r);
    r.nextAt = Math.min(...r.actors.map((a) => a.nextAt), r.enemyAt, r.comboAt);
    const before = structuredClone(r);
    s = roundtrip(s);
    assert.deepEqual(s.squads[0].run, before);
    let seenLater = false;
    for (let i = 0; s.squads[0].run && i < 10000; i++) {
      const current = s.squads[0].run;
      assert.equal(current.nodes, 15);
      assert.ok(current.enemies.every((enemy) => !enemy.role));
      seenLater ||= current.node > before.node;
      s = roundtrip(settle(s, current.nextAt).state);
    }
    assert.ok(seenLater);
    assert.equal(s.done[id], 1);
    s = act(s, { type: "readStory", id: id + "-return" }, s.updatedAt);
    s = act(s, { type: "start", id, value: false }, s.updatedAt);
    assert.equal(s.squads[0].run.nodes, questNodes(id));
  }
});
test("sweeps consume shared wards once per hit and never hit fallen members", () => {
  const s = finalBattle(),
    sq = s.squads[0],
    r = sq.run,
    q = allQuests.find((q) => q.id === r.quest);
  r.health.aria.hp = 0;
  r.ward = 1000;
  r.enemies.forEach((e) => {
    e.nextAt = e.role === "sweeper" ? 5000 : 9000;
  });
  const before = structuredClone(r.health),
    events = [];
  groupEnemyTurns(s, sq, r, q, 5000, (_r, _at, kind, _text, amount, _hero, target) => {
    events.push({ kind, amount, target });
  });
  assert.deepEqual(r.health, before);
  assert.ok(r.ward < 1000);
  assert.equal(events.length, 2);
  assert.ok(events.every((e) => e.target !== "aria" && e.amount === 0));
});
test("short battles recover after defeat, keep rewards on return and survive capped offline time", () => {
  let s = ready(ids[1], 1),
    rest;
  for (let i = 0; s.updatedAt < 601000 && !rest; i++) {
    s = settle(s, s.squads[0].run.nextAt).state;
    if (s.squads[0].run.phase === "rest") rest = roundtrip(s);
  }
  assert.ok(rest);
  const recovered = roundtrip(settle(rest, rest.squads[0].run.nextAt).state);
  assert.equal(recovered.squads[0].run.nodes, 3);
  assert.ok(recovered.squads[0].run.enemies.every((e) => e.role));
  assert.deepEqual(
    recovered.squads[0].run.enemies.map((e) => e.role),
    rest.squads[0].run.enemies.map((e) => e.role),
  );
  const capped = roundtrip(settle(rest, rest.updatedAt + 13 * 3600000).state);
  assert.ok(capped.squads[0].run.nextAt >= capped.updatedAt);
  s = ready(ids[0]);
  const gold = s.gold;
  while (s.squads[0].run.node < 3) s = settle(s, s.squads[0].run.nextAt).state;
  assert.ok(s.gold > gold);
  const stopped = roundtrip(act(s, { type: "stop" }, s.updatedAt));
  assert.equal(stopped.gold, s.gold);
  assert.equal(stopped.done[ids[0]], undefined);
});
