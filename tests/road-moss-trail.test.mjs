import { test } from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadHeroSize, roadScale, roadX } from "../lib/road-layout.ts";
import { mossTrailAssets, RoadMossTrail } from "../lib/road-moss-trail.ts";
import { stories } from "../lib/stories.ts";
import { restorationHandoffState } from "../lib/restoration-handoff.ts";
import { restorationVisualInput } from "../lib/restoration-visual-input.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { chapterFourBanter, mossTrailNoteCue } from "../lib/chapter-four-banter.ts";
import { brekkaLedgerLayout } from "../lib/road-brekka-ledger-layout.ts";

function start() {
  const quest = "glowing-moss-trail";
  let state = testState(
    1000,
    storyStages.findIndex((s) => s.quest === quest),
    40,
    10000,
  );
  const interlude = pendingInterlude(state);
  if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
  return act(
    state,
    { type: "start", id: quest, readDeparture: true, value: false },
    state.updatedAt,
  );
}
function scene(state, view) {
  return chapterRoadFrame(
    {
      squad: state.squads[0],
      startQuest: "glowing-moss-trail",
      now: state.updatedAt,
      ready: true,
      paused: false,
      storybookHeroes: true,
      backgroundOverride: mossTrailAssets.bank,
    },
    false,
    1400,
    view,
  );
}

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 700 },
])
  test(`the two travellers follow the driver and empty basket cart at ${view.width}x${view.height}`, () => {
    let state = start();
    const motion = new RoadMotion(),
      seen = new Set(),
      angles = new Set(),
      driverFrames = new Set(),
      scenes = new Set();
    let snapshots = 0,
      previousFork = false;
    for (let i = 0; state.squads[0].run && i < 9000; i++) {
      const before = JSON.stringify(state);
      const input = scene(state, view);
      const frame = motion.update(input, "moss-trail", view.width, false, view.height);
      assert.equal(JSON.stringify(state), before);
      assert.equal(frame.look.destination, false);
      assert.deepEqual(
        frame.battle.heroes.map((hero) => hero.id),
        ["aria", "leon"],
      );
      assert.equal(frame.look.puller, null);
      const actions = frame.battle.waterwayActions;
      const fork = !!frame.look.mossTrail.fork;
      scenes.add(fork ? "fork" : "brewery");
      if (fork && !previousFork)
        assert.equal(frame.look.mossTrail.fade, 1, "the background changes under a full fade");
      previousFork = fork;
      const cart = actions.props.find((prop) => prop.id === "trail-basket-cart");
      const wheel = actions.props.find((prop) => prop.id === "trail-cart-wheel");
      const moss = actions.props.find((prop) => prop.id === "trail-wheel-moss");
      const driver = actions.actors.find((actor) => actor.id === "trail-cart-driver");
      assert.ok(cart && wheel && moss && driver);
      assert.equal(moss.angle, wheel.angle, "the small moss fleck follows the wheel");
      const cartX = roadX(cart.point.x, frame.battle.distance, view.width);
      const driverX = roadX(driver.point.x, frame.battle.distance, view.width);
      for (const hero of frame.battle.heroes) {
        const heroX = roadX(hero.x, frame.battle.distance, view.width);
        assert.ok(heroX < cartX, `${hero.id} follows the cart`);
        if (view.height > view.width)
          assert.ok(
            heroX > brekkaLedgerLayout(view).figureSize * 0.5,
            `${hero.id} remains within the portrait viewport`,
          );
      }
      assert.ok(driverX > cartX, "the driver leads their own cart");
      assert.ok(driverX < view.width && cartX > 0);
      if (view.height > view.width)
        assert.ok(
          driverX + brekkaLedgerLayout(view).figureSize * 0.6 <= view.width - 4,
          "the complete driver's sprite remains inside the portrait viewport",
        );
      assert.ok(cart.size > 0);
      seen.add(frame.look.mossTrail.node);
      angles.add(Math.round(wheel.angle));
      driverFrames.add(driver.pose.frame);
      snapshots++;
      state = settle(state, state.updatedAt + 100);
    }
    assert.ok(state.done["glowing-moss-trail"] && snapshots > 20);
    assert.equal(seen.size, 15);
    assert.deepEqual([...scenes], ["brewery", "fork"]);
    assert.ok(angles.size > 4, "wheel turns with cart movement");
    assert.ok(
      [...driverFrames].some((frame) => frame !== 5),
      "driver has walking frames",
    );
  });

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 700 },
])
  test(`driver hands meet the cart handles at ${view.width}x${view.height}`, () => {
    const state = start();
    const frame = new RoadMossTrail().prepare(scene(state, view), "trial", view, false);
    const { props, actors } = frame.battle.waterwayActions;
    const cart = props.find((prop) => prop.id === "trail-basket-cart");
    const driver = actors[0];
    const scale = roadScale(view.width);
    const cartWidth = cart.size * roadHeroSize(view.width, view.height);
    // Sprite-sheet registration: handle tip at x 490/512; rear hands at x 36 or 32/128.
    const cartHandX = cart.point.x * scale + (490 / 512 - 0.5) * cartWidth;
    const driverHeight = driver.size * roadHeroSize(view.width, view.height);
    assert.equal(driver.facing, 1, "the driver faces the direction of travel");
    for (const hand of [36, 32]) {
      const handX = driver.point.x * scale + ((hand - 64) * driverHeight) / 94;
      assert.ok(Math.abs(cartHandX - handX) < 4);
    }
  });

test("pausing the pursuit freezes the cart, wheel and driver's stride", () => {
  const view = { width: 936, height: 624 },
    state = start();
  const motion = new RoadMossTrail();
  const first = scene(state, view);
  first.look.mossTrail.progress = 0.5;
  motion.prepare(first, "trial", view, false);
  const paused = scene(state, view);
  paused.look.mossTrail.progress = 0.9;
  paused.look.mossTrail.paused = true;
  paused.battle.time += 5000;
  const a = motion.prepare(paused, "trial", view, false);
  paused.battle.time += 5000;
  const b = motion.prepare(paused, "trial", view, false);
  assert.deepEqual(a.battle.waterwayActions, b.battle.waterwayActions);
});

test("Leon uses the notebook only while its dialogue cue is visible and he is stopped", () => {
  const view = { width: 936, height: 624 },
    state = start(),
    motion = new RoadMossTrail();
  const frame = scene(state, view);
  frame.look.mossTrail.node = 10;
  frame.look.mossTrail.writing = true;
  const drawing = motion.prepare(frame, "trial", view, false);
  motion.finish(drawing.battle, drawing.look);
  assert.equal(drawing.battle.waterwayActions.poses.leon.asset, mossTrailAssets.notes);
  drawing.battle.waterwayActions.poses = {};
  drawing.battle.heroes.find((hero) => hero.id === "leon").walking = true;
  motion.finish(drawing.battle, drawing.look);
  assert.equal(drawing.battle.waterwayActions.poses.leon, undefined);
  drawing.battle.heroes.find((hero) => hero.id === "leon").walking = false;
  drawing.battle.heroes.find((hero) => hero.id === "leon").hp = 0;
  motion.finish(drawing.battle, drawing.look);
  assert.equal(drawing.battle.waterwayActions.poses.leon, undefined);
});

test("the phone handoff carries the current note cue without changing the squad", () => {
  const state = start(),
    squad = state.squads[0],
    before = JSON.stringify(squad);
  const input = {
    squad,
    startQuest: "glowing-moss-trail",
    now: state.updatedAt,
    ready: true,
    paused: false,
  };
  const visual = restorationVisualInput(input, {
    active: true,
    quest: "glowing-moss-trail",
    squad,
    skipped: false,
    dialogue: "pending",
    mossTrailNote: true,
  });
  assert.equal(visual.mossTrailNote, true);
  assert.equal(JSON.stringify(squad), before);
  assert.equal(
    chapterRoadFrame(visual, false, 1400, { width: 936, height: 624 }).look.mossTrail.writing,
    true,
  );
});

test("the displayed dialogue pauses the party to write while the cart keeps moving", () => {
  const view = { width: 936, height: 624 },
    state = start(),
    motion = new RoadMossTrail();
  const frame = scene(state, view);
  frame.look.mossTrail.progress = 0.7;
  const first = motion.prepare(frame, "trial", view, false);
  frame.look.mossTrail.progress = 0.9;
  frame.look.mossTrail.writing = true;
  frame.battle.time += 50;
  const writing = motion.prepare(frame, "trial", view, false);
  const leon = writing.battle.heroes.find((hero) => hero.id === "leon");
  assert.equal(leon.x, first.battle.heroes.find((hero) => hero.id === "leon").x);
  assert.ok(
    writing.battle.waterwayActions.props[0].point.x > first.battle.waterwayActions.props[0].point.x,
  );
  motion.finish(writing.battle, writing.look);
  assert.equal(writing.battle.waterwayActions.poses.leon.asset, mossTrailAssets.notes);
  frame.look.mossTrail.writing = false;
  frame.battle.time += 50;
  const resumed = motion.prepare(frame, "trial", view, false);
  assert.ok(resumed.battle.heroes.find((hero) => hero.id === "leon").x > leon.x);
  motion.finish(resumed.battle, resumed.look);
  assert.equal(resumed.battle.waterwayActions.poses.leon, undefined);
  const run = { ...state.squads[0].run, node: 10, phase: "move" };
  const lines = chapterFourBanter(run);
  assert.equal(mossTrailNoteCue(lines[0]), false);
  assert.equal(mossTrailNoteCue(lines[1]), true);
  assert.equal(mossTrailNoteCue(lines[2]), false);
});

test("Leon walks instead of writing while the pursuit continues", () => {
  const view = { width: 936, height: 624 },
    state = start(),
    motion = new RoadMossTrail();
  const frame = scene(state, view);
  frame.look.mossTrail.node = 6;
  frame.look.mossTrail.progress = 0.5;
  motion.prepare(frame, "trial", view, false);
  frame.look.mossTrail.progress = 0.7;
  frame.battle.time += 50;
  const moving = motion.prepare(frame, "trial", view, false);
  assert.equal(moving.battle.heroes.find((hero) => hero.id === "leon").walking, true);
  motion.finish(moving.battle, moving.look);
  assert.equal(moving.battle.waterwayActions.poses.leon, undefined);
});

test("completion waits for the last movement and a full fade, and pauses the ending", () => {
  const view = { width: 936, height: 624 },
    state = start(),
    motion = new RoadMossTrail();
  const frame = scene(state, view);
  frame.look.mossTrail.progress = 0.94;
  motion.prepare(frame, "trial", view, false);
  frame.look.mossTrail.completed = true;
  let output;
  for (let i = 0; i < 400; i++) {
    frame.battle.time += 50;
    output = motion.prepare(frame, "trial", view, false);
    if (output.look.mossTrail.fade > 0 && output.look.mossTrail.fork) break;
  }
  assert.ok(output.look.mossTrail.fade > 0);
  assert.equal(output.look.mossTrail.visualComplete, false);
  frame.look.mossTrail.paused = true;
  const fade = output.look.mossTrail.fade;
  for (let i = 0; i < 25; i++) {
    frame.battle.time += 50;
    output = motion.prepare(frame, "trial", view, false);
  }
  assert.equal(output.look.mossTrail.fade, fade);
  assert.equal(output.look.mossTrail.visualComplete, false);
  frame.look.mossTrail.paused = false;
  for (let i = 0; i < 30 && !output.look.mossTrail.visualComplete; i++) {
    frame.battle.time += 50;
    output = motion.prepare(frame, "trial", view, false);
  }
  assert.equal(output.look.mossTrail.fade, 1);
  assert.equal(output.look.mossTrail.visualComplete, true);
});

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 700 },
])
  test(`the actual return dialog waits for the pursuit at ${view.width}x${view.height}`, () => {
    const quest = "glowing-moss-trail",
      motion = new RoadMotion();
    let state = start(),
      snapshot = state.squads[0],
      identity,
      output,
      after = 0,
      waited = false;
    const ending = stories.find((story) => story.id === `${quest}-return`);
    for (let i = 0; i < 9000; i++) {
      if (state.squads[0].run) snapshot = state.squads[0];
      const args = {
        enabled: true,
        quest,
        squad: state.squads[0],
        snapshot,
        ending: state.done[quest] ? ending : null,
        view: "adventure",
        sheet: null,
        ready: true,
        finished: null,
      };
      const handoff = restorationHandoffState(args);
      const base = {
        squad: state.squads[0],
        startQuest: quest,
        now: state.updatedAt + after * 50,
        ready: true,
        paused: false,
      };
      const visual = storybookAdventureInput(
        restorationVisualInput(base, {
          ...handoff,
          quest,
          squad: handoff.candidate,
          skipped: false,
          dialogue: "pending",
        }),
      );
      const before = JSON.stringify(state);
      const frame = chapterRoadFrame(visual, false, 1400, view);
      identity = roadPaintKey(snapshot.id, visual.squad.run, frame.look, identity);
      output = motion.update(frame, identity.key, view.width, false, view.height);
      assert.equal(JSON.stringify(state), before, "the visual handoff does not modify the save");
      if (state.done[quest]) {
        assert.ok(handoff.waiting && visual.squad.run);
        if (output.look.mossTrail.visualComplete) {
          assert.equal(output.look.mossTrail.fade, 1);
          assert.equal(restorationHandoffState({ ...args, finished: handoff.key }).waiting, false);
          assert.equal(restorationHandoffState({ ...args, snapshot: null }).waiting, false);
          assert.equal(restorationHandoffState({ ...args, view: "memories" }).waiting, false);
          break;
        }
        waited = true;
        after++;
      } else {
        state = settle(state, state.updatedAt + 50);
        if (state.squads[0].run)
          state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
      }
    }
    assert.ok(waited && state.done[quest] && output.look.mossTrail.visualComplete);
  });
