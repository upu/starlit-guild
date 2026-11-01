import { test } from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadFigureDepth } from "../lib/road-layout.ts";
import { brekkaLedgerAssets } from "../lib/road-brekka-ledger.ts";
import {
  brekkaLedgerLayout,
  brekkaVisitPortraitBackdrop,
} from "../lib/road-brekka-ledger-layout.ts";

function setup() {
  const quest = "brekka-arrival";
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
  for (
    let i = 0;
    i < 3000 && !(state.squads[0].run?.node === 2 && state.squads[0].run.phase === "work");
    i++
  )
    state = settle(state, state.updatedAt + 100);
  assert.equal(state.squads[0].run?.node, 2);
  return state;
}

for (const [width, height] of [
  [390, 260],
  [936, 624],
  [390, 700],
])
  test(`Finn approaches the brewery records at ${width}x${height} without changing the run`, () => {
    const state = setup(),
      before = JSON.stringify(state),
      view = { width, height };
    const motion = new RoadMotion();
    let first,
      last,
      walking = false,
      inspecting = false;
    for (let elapsed = 0; elapsed <= 7000; elapsed += 50) {
      const input = {
        squad: state.squads[0],
        startQuest: "brekka-arrival",
        now: state.updatedAt + elapsed,
        ready: true,
        paused: false,
        storybookHeroes: true,
        backgroundOverride: brekkaLedgerAssets.bank,
      };
      const frame = chapterRoadFrame(input, false, 1400, view);
      const out = motion.update(frame, "ledger-trial", view.width, false, view.height);
      const finn = out.battle.heroes.find((hero) => hero.id === "finn");
      first ??= finn;
      last = finn;
      walking ||= finn.walking;
      const actions = out.battle.waterwayActions;
      assert.ok(actions.props.some((prop) => prop.id === "brekka-ledger-table"));
      assert.ok(actions.props.some((prop) => prop.id === "brekka-ledger-open"));
      const worker = actions.actors.find((actor) => actor.id === "brekka-brewery-worker");
      const table = actions.props.find((prop) => prop.id === "brekka-ledger-table");
      assert.ok(worker);
      assert.ok(roadFigureDepth(worker.point.lane, view, out.look) > 1);
      assert.ok(
        roadFigureDepth(worker.point.lane, view, out.look) <
          roadFigureDepth(table.depth, view, out.look),
      );
      inspecting ||= actions.poses.finn?.frame === 1;
    }
    const expected = brekkaLedgerLayout(view).world(750, 685);
    assert.ok(walking && inspecting);
    assert.ok(last.x > first.x);
    assert.ok((Math.abs(last.x - expected.x) * width) / 560 < 3);
    assert.ok(Math.abs(last.lane - expected.lane) < 0.02);
    assert.equal(JSON.stringify(state), before);
  });

test("both brewery compositions preserve object coordinates through orientation changes", () => {
  const state = setup();
  const motion = new RoadMotion();
  let out;
  for (let elapsed = 0; elapsed <= 8000; elapsed += 50) {
    const view = elapsed < 5000 ? { width: 936, height: 624 } : { width: 390, height: 700 };
    const input = {
      squad: state.squads[0],
      startQuest: "brekka-arrival",
      now: state.updatedAt + elapsed,
      ready: true,
      paused: false,
      storybookHeroes: true,
      backgroundOverride: brekkaLedgerAssets.bank,
    };
    out = motion.update(
      chapterRoadFrame(input, false, 1400, view),
      "rotated-ledger",
      view.width,
      false,
      view.height,
    );
  }
  assert.equal(out.look.brekkaLedger.portrait, true);
  const expected = brekkaLedgerLayout({ width: 390, height: 700 }).world(750, 685);
  const finn = out.battle.heroes.find((hero) => hero.id === "finn");
  assert.ok((Math.abs(finn.x - expected.x) * 390) / 560 < 3);
  assert.ok(Math.abs(finn.lane - expected.lane) < 0.02);
  assert.equal(out.battle.waterwayActions.poses.finn?.frame, 1);
});

test("the ledger trial does not replace other backgrounds or a live battle", () => {
  const state = setup(),
    input = {
      squad: state.squads[0],
      startQuest: "brekka-arrival",
      now: state.updatedAt,
      ready: true,
      paused: false,
      storybookHeroes: true,
      backgroundOverride: "/storybook-study/brekka-homes-v1.png",
    };
  assert.equal(chapterRoadFrame(input).look.brekkaLedger, undefined);
  const battleState = structuredClone(state);
  battleState.squads[0].run.enemies = [{ id: "enemy-1", hp: 100, maxHp: 100, nextAt: 1000 }];
  const fighting = chapterRoadFrame({
    ...input,
    squad: battleState.squads[0],
    backgroundOverride: brekkaLedgerAssets.bank,
  });
  assert.equal(fighting.look.brekkaLedger, undefined);
});

test("the portrait visit fills the canvas instead of showing a dim surround", () => {
  for (const view of [
    { width: 390, height: 700 },
    { width: 320, height: 680 },
  ]) {
    const background = brekkaVisitPortraitBackdrop(view);
    assert.ok(background.x <= 0 && background.y <= 0);
    assert.ok(background.x + background.width >= view.width);
    assert.ok(background.y + background.height >= view.height);
  }
});
