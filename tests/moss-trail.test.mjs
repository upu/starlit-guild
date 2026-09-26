import { test } from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState, migrate, allQuests, targetName } from "../lib/game.ts";
import {
  MOSS_TRAIL_QUEST as first,
  MOSS_TRAIL_SECOND_DAY_QUEST as second,
  MOSS_BEDS_QUEST,
} from "../lib/chapter-four.ts";
import { chapterFourBanter } from "../lib/chapter-four-banter.ts";
import { chapterFourStories } from "../lib/chapter-four-stories.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { storyStages, stageUnlocked } from "../lib/prologue.ts";
import { bundleSchema } from "../lib/save-format.ts";

const dispatch = (state, action) => act(state, action, state.updatedAt);
const start = (id) =>
  dispatch(
    testState(
      1000,
      storyStages.findIndex((s) => s.quest === id),
      40,
      10000,
    ),
    { type: "start", id, readDeparture: true, value: false },
  );
function saved(state) {
  const id = "11111111-1111-4111-8111-111111111111";
  return bundleSchema.parse({
    format: 4,
    deviceId: id,
    active: id,
    profiles: [{ id, name: "追跡", test: true, state }],
    serial: 0,
    sound: false,
    cloudAt: 0,
  }).profiles[0].state;
}

test("day one uses two adventurers through work, rest, resume and repeat; day two restores four", () => {
  for (const [id, members] of [
    [first, ["aria", "leon"]],
    [second, ["aria", "leon", "mira", "finn"]],
  ]) {
    let state = start(id);
    const absentXP = { mira: state.xp.mira, finn: state.xp.finn };
    const visits = new Map();
    while (state.squads[0].run) {
      const squad = state.squads[0],
        run = squad.run;
      assert.deepEqual(squad.members, members);
      const frame = chapterRoadFrame({ squad, now: state.updatedAt, ready: true, paused: false });
      assert.deepEqual(
        frame.battle.heroes.map((h) => h.id),
        members,
      );
      for (const phase of [run.phase, "rest"]) {
        const lines = chapterFourBanter({ ...run, phase });
        assert.ok(lines.every((line) => !line.speaker || members.includes(line.speaker)));
      }
      if (!visits.has(run.node)) {
        visits.set(
          run.node,
          targetName(
            allQuests.find((q) => q.id === id),
            run.node,
            run.nodes,
          ),
        );
        state = saved(state);
      }
      state = settle(state, run.nextAt).state;
    }
    const names = [...visits.values()];
    assert.equal(visits.size, 15);
    assert.equal(new Set(names).size, 3);
    assert.ok(names.slice(0, 5).every((name) => name === names[0]));
    assert.ok(names.slice(5, 10).every((name) => name === names[5]));
    assert.ok(names.slice(10).every((name) => name === names[10]));
    if (id === first) {
      assert.deepEqual({ mira: state.xp.mira, finn: state.xp.finn }, absentXP);
      assert.equal(stageUnlocked(state, second), false);
      state = dispatch(state, { type: "readStory", id: first + "-return" });
      assert.equal(stageUnlocked(state, second), true);
      assert.equal(stageUnlocked(state, MOSS_BEDS_QUEST), false);
      assert.deepEqual(
        dispatch(state, { type: "start", id: second, readDeparture: true }).squads[0].members,
        ["aria", "leon", "mira", "finn"],
      );
    } else state = dispatch(state, { type: "readStory", id: second + "-return" });
    assert.deepEqual(dispatch(state, { type: "start", id }).squads[0].members, members);
  }
});

test("the first day's ending keeps concrete findings and the second morning is a separate departure", () => {
  const lines = (id) =>
    chapterFourStories
      .find((s) => s.id === id)
      .lines.map((l) => l.text)
      .join("\n");
  assert.match(lines(first + "-departure"), /今日は俺も宿に残る/);
  assert.match(lines(first + "-return"), /出てくる時刻と、ここまでの道は分かった/);
  assert.match(lines(first + "-return"), /同じ葉だって確かめられた/);
  assert.doesNotMatch(lines(first + "-return"), /翌朝/);
  assert.match(lines(second + "-departure"), /昨日の道順を書いた手帳/);
});

test("old read-throughs keep later stages unlocked without duplicate rewards", () => {
  const state = testState(
    1000,
    storyStages.findIndex((s) => s.quest === MOSS_BEDS_QUEST),
    25,
    9000,
  );
  delete state.story.mossTrailSplit;
  delete state.done[second];
  for (const key of ["departed", "completed", "read"])
    state.story[key] = state.story[key].filter((id) => !id.startsWith(second));
  const before = structuredClone(state),
    upgraded = migrate(state);
  assert.deepEqual(state, before);
  assert.equal(stageUnlocked(upgraded, MOSS_BEDS_QUEST), true);
  for (const key of ["gold", "xp", "clears", "inventory", "updatedAt"])
    assert.deepEqual(upgraded[key], before[key]);
  assert.deepEqual(migrate(saved(upgraded)), upgraded);
});

test("an old four-person pursuit resumes with two while preserving clocks, progress and their HP", () => {
  const state = start(second);
  const squad = state.squads[0];
  squad.run.quest = first;
  squad.lastQuest = first;
  delete state.story.mossTrailSplit;
  delete state.done[first];
  state.story.completed = state.story.completed.filter((id) => id !== first);
  state.story.read = state.story.read.filter((id) => id !== first + "-return");
  const original = structuredClone(state),
    upgraded = migrate(state),
    run = upgraded.squads[0].run;
  assert.deepEqual(state, original);
  assert.deepEqual(upgraded.squads[0].members, ["aria", "leon"]);
  for (const key of ["node", "target", "targetMax", "started", "phaseAt"])
    assert.equal(run[key], squad.run[key]);
  for (const id of ["aria", "leon"]) assert.deepEqual(run.health[id], squad.run.health[id]);
  assert.ok(saved(upgraded));
  assert.equal(upgraded.done[second], undefined);
});
