import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { lanternRoadAssets } from "../lib/road-lantern-layout.ts";
import { roadX, roadY } from "../lib/road-layout.ts";
import {
  restorationPreviewState,
  updateStudySnapshot,
} from "../app/sprite-lab/storybook/restoration-preview-state.ts";

for (const view of [
  { width: 900, height: 600 },
  { width: 390, height: 700 },
])
  test(`the lantern-road study guides the porter and reaches both work positions at ${view.width}`, () => {
    const quest = "lantern-detour";
    let state = testState(
      1000,
      storyStages.findIndex((stage) => stage.quest === quest),
      40,
      10000,
    );
    const interlude = pendingInterlude(state);
    if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
    state = act(
      state,
      { type: "start", id: quest, readDeparture: true, value: false },
      state.updatedAt,
    );
    assert.ok(state.squads[0].run);
    const motion = new RoadMotion(),
      porterFrames = new Set(),
      weedFrames = new Set();
    let leonWorked = false,
      ariaWalked = false;
    for (let node = 0; node < 3; node++) {
      state.squads[0].run.node = node;
      state.squads[0].run.phase = "work";
      for (let step = 0; step < 80; step++) {
        const before = JSON.stringify(state);
        const frame = chapterRoadFrame(
          {
            squad: state.squads[0],
            startQuest: quest,
            now: 1000 + node * 4000 + step * 50,
            ready: true,
            storybookHeroes: true,
            backgroundOverride: lanternRoadAssets.bank,
          },
          false,
          1400,
          view,
        );
        const drawn = motion.update(frame, "lantern-road", view.width, false, view.height);
        assert.equal(JSON.stringify(state), before, "visual motion must not change the save");
        const actions = drawn.battle.waterwayActions;
        assert.ok(actions.actors.some((actor) => actor.id === "lantern-porter"));
        assert.ok(actions.props.some((prop) => prop.id === "road-lantern"));
        assert.ok(actions.props.some((prop) => prop.id === "road-grass"));
        porterFrames.add(actions.actors[0].pose.frame);
        const aria = drawn.battle.heroes.find((hero) => hero.id === "aria");
        if (node === 2 && aria.walking) ariaWalked = true;
        const weed = actions.poses.aria;
        if (weed?.asset === lanternRoadAssets.ariaWeed) weedFrames.add(weed.frame);
        if (actions.poses.leon?.asset === lanternRoadAssets.ariaWork) leonWorked = true;
      }
    }
    assert.ok(porterFrames.has(8) || porterFrames.has(9), "porter walks during the approach");
    assert.ok(
      ariaWalked && weedFrames.has(1) && weedFrames.has(2),
      "Aria approaches and cuts with two frames",
    );
    assert.ok(leonWorked, "Leon reaches the lantern to inspect it");
    state.squads[0].run.phase = "move";
    const travelling = chapterRoadFrame(
      {
        squad: state.squads[0],
        startQuest: quest,
        now: 13000,
        ready: true,
        storybookHeroes: true,
        backgroundOverride: lanternRoadAssets.bank,
      },
      false,
      1400,
      view,
    );
    const duringMove = motion.update(travelling, "lantern-road", view.width, false, view.height);
    assert.equal(
      duringMove.battle.waterwayActions.poses.aria,
      undefined,
      "no cutting during travel",
    );
  });

test("the lantern visual queue cannot block completion when the workers are incapacitated", () => {
  const quest = "lantern-detour",
    view = { width: 390, height: 700 };
  let state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === quest),
    40,
    10000,
  );
  const interlude = pendingInterlude(state);
  if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
  state = act(
    state,
    { type: "start", id: quest, readDeparture: true, value: false },
    state.updatedAt,
  );
  const motion = new RoadMotion();
  let completedAt;
  for (let step = 0; step < 2400; step++) {
    const frame = chapterRoadFrame(
      {
        squad: state.squads[0],
        startQuest: quest,
        now: 1000 + step * 50,
        ready: true,
        storybookHeroes: true,
        backgroundOverride: lanternRoadAssets.bank,
      },
      false,
      1400,
      view,
    );
    frame.battle.heroes.forEach((hero) => {
      hero.hp = 0;
    });
    if (step > 0) Object.assign(frame.look.lanternRoad, { node: 14, completed: true });
    const drawn = motion.update(frame, "unavailable-lantern", view.width, false, view.height);
    if (drawn.look.lanternRoad.visualComplete) {
      completedAt = step * 50;
      break;
    }
  }
  assert.ok(completedAt !== undefined && completedAt < 100000);
});

for (const view of [
  { width: 900, height: 600 },
  { width: 390, height: 700 },
])
  test(`rapid help preserves the lantern-road visual sequence at ${view.width}`, () => {
    const quest = "lantern-detour";
    let state = testState(
      1000,
      storyStages.findIndex((stage) => stage.quest === quest),
      40,
      10000,
    );
    const interlude = pendingInterlude(state);
    if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
    state = act(
      state,
      { type: "start", id: quest, readDeparture: true, value: false },
      state.updatedAt,
    );
    let snapshot = updateStudySnapshot({ state: null, lastRun: null }, state);
    const motion = new RoadMotion(),
      seen = new Set(),
      worked = new Set();
    let after = 0,
      last,
      completedWhileVisualPending = false,
      sawFinalReturn = false,
      firstLeon,
      firstAria,
      maxDrift = 0;
    for (let i = 0; i < 6000; i++) {
      const visual = restorationPreviewState(quest, snapshot, false);
      const frame = chapterRoadFrame(
        {
          squad: visual.squads[0],
          startQuest: quest,
          now: state.updatedAt + after * 50,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: lanternRoadAssets.bank,
          questComplete: !!state.done[quest],
        },
        false,
        1400,
        view,
      );
      const before = JSON.stringify(state);
      last = motion.update(frame, "rapid-lantern", view.width, false, view.height);
      assert.equal(JSON.stringify(state), before);
      const site = last.look.lanternRoad;
      seen.add(site.node);
      const pose = last.battle.waterwayActions.poses;
      const leon = last.battle.heroes.find((hero) => hero.id === "leon");
      const aria = last.battle.heroes.find((hero) => hero.id === "aria");
      if (pose.leon?.asset === lanternRoadAssets.ariaWork && !firstLeon)
        firstLeon = { x: leon.x, lane: leon.lane };
      if (pose.aria?.asset === lanternRoadAssets.ariaWeed && !firstAria)
        firstAria = { x: aria.x, lane: aria.lane };
      if (site.node >= 6 && site.node < 14 && firstLeon && firstAria)
        for (const [hero, saved] of [
          [leon, firstLeon],
          [aria, firstAria],
        ])
          maxDrift = Math.max(
            maxDrift,
            Math.hypot(
              roadX(hero.x, 0, view.width) - roadX(saved.x, 0, view.width),
              roadY(hero.lane, view.height, view.width) -
                roadY(saved.lane, view.height, view.width),
            ),
          );
      if (
        pose.aria?.asset === lanternRoadAssets.ariaWeed ||
        pose.leon?.asset === lanternRoadAssets.ariaWork
      )
        worked.add(site.node);
      if (state.done[quest] && !site.visualComplete) completedWhileVisualPending = true;
      if (
        state.done[quest] &&
        site.node === 14 &&
        worked.has(14) &&
        last.battle.heroes.find((hero) => hero.id === "aria").walking
      )
        sawFinalReturn = true;
      if (site.visualComplete) break;
      if (!state.squads[0].run) after++;
      else {
        state = settle(state, state.updatedAt + 50);
        if (state.squads[0].run)
          state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
        snapshot = updateStudySnapshot(snapshot, state);
      }
    }
    assert.ok(completedWhileVisualPending, "completion does not cut off the visible work");
    assert.ok(sawFinalReturn, "Aria rejoins the group after cutting grass");
    assert.ok(after * 50 < 20000, `visual finish took ${after * 50}ms after quest completion`);
    assert.ok(maxDrift < 5, `the workers should stay near their work: ${maxDrift}px`);
    assert.equal(last.look.lanternRoad.visualComplete, true);
    assert.deepEqual(
      [...seen],
      Array.from({ length: 15 }, (_, i) => i),
    );
    for (let node = 0; node < 15; node++)
      if (node % 3 !== 0) assert.ok(worked.has(node), `work was visible for node ${node}`);
  });
