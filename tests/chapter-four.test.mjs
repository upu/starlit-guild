import { test } from "node:test";
import assert from "node:assert/strict";
import { act, availableQuests, encounter, testState, settle, migrate } from "../lib/game.ts";
import {
  WALNUT_INTERLUDE,
  LINDE_REQUESTS_QUEST,
  LICO_RECORDS_QUEST,
  MERRILL_SEEDLINGS_QUEST,
  MOSS_BEDS_QUEST,
  chapterFourStages,
} from "../lib/chapter-four.ts";
import { chapterFourStories } from "../lib/chapter-four-stories.ts";
import { storyArt } from "../lib/story-art.ts";
import { parseBundle } from "../lib/save-format.ts";
import { questNodes } from "../lib/puppet-battles.ts";
import { chapterFourBanter } from "../lib/chapter-four-banter.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";

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

test("the moss-bed survey uses three companions through resume, rest and repeat; Finn returns in 4-7", () => {
  const members = ["aria", "leon", "mira"];
  let state = dispatch(testState(1000, 32, 40, 10000), {
    type: "start",
    id: MOSS_BEDS_QUEST,
    readDeparture: true,
    value: false,
  });
  const finnXP = state.xp.finn;
  const visits = new Set();
  while (state.squads[0].run) {
    const squad = state.squads[0],
      run = squad.run;
    assert.deepEqual(squad.members, members);
    assert.deepEqual(
      chapterRoadFrame({
        squad,
        now: state.updatedAt,
        ready: true,
        paused: false,
      }).battle.heroes.map((hero) => hero.id),
      members,
    );
    for (const phase of [run.phase, "rest"])
      assert.ok(
        chapterFourBanter({ ...run, phase }).every(
          (line) => !line.speaker || members.includes(line.speaker),
        ),
      );
    if (!visits.has(run.node)) {
      visits.add(run.node);
      state = migrate(roundtrip(state));
    }
    state = settle(state, run.nextAt);
  }
  assert.equal(visits.size, 15);
  assert.equal(state.xp.finn, finnXP);
  state = dispatch(state, { type: "readStory", id: MOSS_BEDS_QUEST + "-return" });
  assert.deepEqual(
    dispatch(state, { type: "start", id: MOSS_BEDS_QUEST }).squads[0].members,
    members,
  );
  assert.deepEqual(
    dispatch(state, { type: "start", id: LICO_RECORDS_QUEST, readDeparture: true }).squads[0]
      .members,
    [...members, "finn"],
  );
});

test("older moss-bed expeditions drop only Finn while preserving progress, HP and rest timers", () => {
  for (const resting of [false, true]) {
    const state = dispatch(testState(1000, 33, 40, 10000), {
      type: "start",
      id: LICO_RECORDS_QUEST,
      readDeparture: true,
      value: false,
    });
    const squad = state.squads[0];
    squad.lastQuest = squad.run.quest = MOSS_BEDS_QUEST;
    state.story.mossTrailSplit = true;
    if (resting) squad.run.phase = "rest";
    const original = structuredClone(state);
    const upgraded = migrate(roundtrip(state)),
      run = upgraded.squads[0].run;
    assert.deepEqual(state, original);
    assert.deepEqual(upgraded.squads[0].members, ["aria", "leon", "mira"]);
    assert.ok(!run.actors.some((actor) => actor.hero === "finn"));
    assert.equal(run.health.finn, undefined);
    assert.equal(run.road?.members.finn, undefined);
    for (const key of ["node", "target", "targetMax", "started", "phase", "phaseAt"])
      assert.equal(run[key], squad.run[key]);
    if (resting) assert.equal(run.nextAt, squad.run.nextAt);
    for (const id of ["aria", "leon", "mira"]) {
      assert.deepEqual(run.health[id], squad.run.health[id]);
      assert.deepEqual(run.road?.members[id], squad.run.road?.members[id]);
      assert.deepEqual(
        run.actors.find((a) => a.hero === id),
        squad.run.actors.find((a) => a.hero === id),
      );
    }
    for (const key of ["owned", "xp", "inventory", "gold", "done", "story", "clears", "updatedAt"])
      assert.deepEqual(upgraded[key], original[key]);
    assert.deepEqual(migrate(roundtrip(upgraded)), upgraded);
    assert.ok(roundtrip(settle(upgraded, run.nextAt)));
  }
});
