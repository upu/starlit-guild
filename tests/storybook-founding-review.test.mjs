import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterFourWork } from "../lib/chapter-four.ts";
import { reviewPointReady } from "../app/sprite-lab/storybook/adventure-review-points.ts";
import {
  restorationPreviewState,
  updateStudySnapshot,
  visibleStudyState,
} from "../app/sprite-lab/storybook/restoration-preview-state.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { foundingRoadBackground } from "../lib/road-journey-cart.ts";

test("return-road review points use real work states for the three different jobs", () => {
  const quest = "starlit-guild-founding";
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
  const checks = [
    ["founding-letter", "返事の手紙を渡す"],
    ["founding-loan", "借り物を返す"],
    ["founding-warehouse", "リンデの倉庫へ向かう"],
    ["founding-third-basket", "借り物を返す"],
    ["founding-arrival", "リンデの倉庫へ向かう"],
  ];
  let found = 0,
    travel = false;
  for (let i = 0; i < 3000 && (found < checks.length || !travel); i++) {
    if (reviewPointReady(state, "founding-travel", () => false)) travel = true;
    if (found === checks.length) {
      state = settle(state, state.updatedAt + 100);
      continue;
    }
    const [mode, label] = checks[found];
    if (reviewPointReady(state, mode, () => false)) {
      const run = state.squads[0].run;
      assert.equal(chapterFourWork(quest, run.node, run.nodes)?.name, label);
      assert.equal(run.phase, "work");
      found++;
    }
    state = settle(state, state.updatedAt + 100);
  }
  assert.equal(found, checks.length);
  assert.ok(travel);
});

test("the completed study keeps only a visual snapshot until the cart arrives", () => {
  const quest = "starlit-guild-founding";
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
  const run = state.squads[0].run;
  const completed = structuredClone(state);
  completed.squads[0].run = null;
  completed.done[quest] = 1;
  const before = JSON.stringify(completed),
    snapshot = { state: completed, lastRun: run };
  assert.equal(restorationPreviewState(quest, snapshot, false).squads[0].run, run);
  assert.equal(
    restorationPreviewState(quest, snapshot, true).squads[0].run,
    run,
    "the preview retains the arrival picture after finishing",
  );
  assert.equal(visibleStudyState(quest, snapshot, false, false), completed);
  assert.equal(JSON.stringify(completed), before);
});

for (const width of [390, 936])
  test(`rapid completion finishes the active handoff and cart arrival at ${width}px`, () => {
    const quest = "starlit-guild-founding",
      view = { width, height: (width * 2) / 3 };
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
    const motion = new RoadMotion();
    let pendingAfterCompletion = false,
      complete = false,
      lastCargo;
    const visited = new Set();
    const carried = new Set();
    let previousBackground = foundingRoadBackground,
      sawFadeOut = false,
      sawFadeIn = false;
    for (let i = 0; i < 4000 && !complete; i++) {
      const visual = restorationPreviewState(quest, snapshot, false);
      const before = JSON.stringify(state);
      const input = {
        squad: visual.squads[0],
        startQuest: quest,
        now: state.updatedAt,
        ready: true,
        paused: false,
        storybookHeroes: true,
        backgroundOverride: foundingRoadBackground,
        questComplete: !!state.done[quest] && !state.squads[0].run,
      };
      const result = motion.update(
        chapterRoadFrame(input, false, 1400, view),
        "rapid",
        view.width,
        false,
        view.height,
      );
      lastCargo = result.battle.journeyCart?.cargo;
      assert.equal(JSON.stringify(state), before);
      if (input.questComplete && result.look.foundingDraft?.visualNode !== undefined)
        pendingAfterCompletion = true;
      if (result.look.foundingDraft?.visualNode !== undefined)
        visited.add(result.look.foundingDraft.visualNode);
      const node = result.look.foundingDraft?.visualNode;
      const fade = result.look.foundingDraft?.fade ?? 0;
      if (fade > 0 && !result.look.foundingDraft?.arrivalScene) sawFadeOut = true;
      if (fade > 0 && result.look.foundingDraft?.arrivalScene) sawFadeIn = true;
      if (result.look.background !== previousBackground) {
        assert.ok(fade > 0.99, "the scenery changes only behind the fully dark transition");
        previousBackground = result.look.background;
      }
      if (node !== undefined) {
        const kind = node % 3 === 0 ? "letter" : "basket";
        const item = result.battle.waterwayActions?.props.find(
          (prop) => prop.id === `founding-${kind}`,
        );
        if (item) {
          carried.add(node);
          assert.equal(
            result.battle.journeyCart.cargo.slots[kind][Math.floor(node / 3)],
            false,
            "the object in someone's hand must not also appear on the cart",
          );
        }
      }
      complete = !!result.look.foundingDraft?.visualComplete;
      if (!complete) {
        state = settle(state, state.updatedAt + 100);
        if (state.squads[0].run)
          state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
        snapshot = updateStudySnapshot(snapshot, state);
      }
    }
    assert.ok(state.done[quest]);
    assert.equal(state.squads[0].run, null);
    assert.ok(pendingAfterCompletion, "the completed game state must not discard queued visuals");
    assert.ok(complete, "the preview must eventually release the snapshot");
    assert.ok(sawFadeOut && sawFadeIn, "the group fades from the road to the warehouse");
    const visible = [...visited];
    assert.equal(visible[0], 0, "the handoff already on screen must finish");
    assert.ok(visible.every((node, index) => index === 0 || visible[index - 1] < node));
    assert.deepEqual([...carried], visible, "each displayed handoff must include its object");
    assert.ok(
      lastCargo && Object.values(lastCargo.slots).every((slots) => slots.every((shown) => !shown)),
      "offscreen deliveries clear their slots",
    );
    let arrival;
    for (let i = 0; i < 30; i++) {
      state = settle(state, state.updatedAt + 100);
      snapshot = updateStudySnapshot(snapshot, state);
      const visual = restorationPreviewState(quest, snapshot, true);
      arrival = motion.update(
        chapterRoadFrame(
          {
            squad: visual.squads[0],
            startQuest: quest,
            now: state.updatedAt,
            ready: true,
            paused: false,
            storybookHeroes: true,
            backgroundOverride: foundingRoadBackground,
            questComplete: true,
          },
          false,
          1400,
          view,
        ),
        "rapid",
        view.width,
        false,
        view.height,
      );
    }
    assert.equal(arrival.battle.journeyCart.phase, "parked");
    assert.deepEqual(arrival.look.frontCarriers, []);
    assert.equal(arrival.battle.heroes.find((hero) => hero.id === "finn").walking, false);
  });
