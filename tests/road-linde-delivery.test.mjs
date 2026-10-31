import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { lindeDeliveryAssets, lindeDeliveryObstacles } from "../lib/road-linde-delivery.ts";
import { partyOverlap } from "../lib/road-party-spacing.ts";
import { chapterFourWork } from "../lib/chapter-four.ts";
import { lindeDeliveryLayout } from "../lib/road-housecalls-layout.ts";
import { roadFigureDepth, roadX, roadY } from "../lib/road-layout.ts";
import { LindeViewportTransition } from "../lib/road-linde-viewport.ts";
import { lindeHandoffSide } from "../lib/road-linde-handoff-side.ts";
import { LindePaperPickup } from "../lib/road-linde-pickup.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";

for (const view of [
  { width: 374, height: (374 * 2) / 3 },
  { width: 936, height: 624 },
  { width: 390, height: 700 },
])
  test(`Linde delivery displays actual work with two residents at ${view.width}x${view.height}`, () => {
    const { width, height } = view,
      motion = new RoadMotion();
    const index = storyStages.findIndex((stage) => stage.quest === "linde-requests");
    let state = testState(1000, index, 40, 10000);
    const interlude = pendingInterlude(state);
    if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
    state = act(
      state,
      { type: "start", id: "linde-requests", readDeparture: true, value: false },
      state.updatedAt,
    );
    assert.ok(state.squads[0].run, "quest starts");
    const nodes = new Set(),
      strides = new Set();
    let sawLetter = false,
      sawReturn = false,
      visualComplete = false;
    for (let i = 0; i < 5000; i++) {
      const before = JSON.stringify(state);
      const frame = chapterRoadFrame(
        storybookAdventureInput({
          squad: state.squads[0],
          startQuest: "linde-requests",
          now: state.updatedAt,
          ready: true,
          questComplete: !!state.done["linde-requests"],
        }),
        false,
        1400,
        view,
      );
      const { battle, look } = motion.update(frame, "linde-test", width, false, height);
      assert.equal(JSON.stringify(state), before, "presentation cannot modify the save");
      assert.equal(look.background, lindeDeliveryAssets.bank);
      assert.equal(look.puller, null);
      assert.equal(battle.journeyCart, undefined);
      assert.equal(battle.waterwayActions.actors.length, 2);
      const layout = lindeDeliveryLayout(view);
      for (const actor of [
        ...battle.heroes,
        ...battle.waterwayActions.actors.map((a) => a.point),
      ]) {
        const x = roadX(actor.x, 0, width),
          y = roadY(actor.lane, height, width);
        assert.ok(x > layout.figureSize * 0.25 && x < width - layout.figureSize * 0.25);
        assert.ok(y > layout.figureSize && y < height - 2);
        assert.ok(
          roadFigureDepth(actor.lane, view, look) > 1,
          "figure is above backdrop and shade",
        );
      }
      for (const hero of battle.heroes) {
        const point = { x: (roadX(hero.x, 0, width) / width) * 560, lane: hero.lane };
        for (const resident of lindeDeliveryObstacles(view, look.lindeDelivery.portrait))
          assert.equal(
            partyOverlap(point, resident, resident.clearance),
            false,
            `${hero.id} crosses a resident's feet`,
          );
      }
      nodes.add(look.lindeDelivery.node);
      if (look.work)
        assert.equal(
          look.work.label,
          chapterFourWork("linde-requests", look.lindeDelivery.node).name,
        );
      const leon = battle.heroes.find((h) => h.id === "leon");
      const pose = battle.waterwayActions.poses.leon;
      const letter = battle.waterwayActions.props.find((p) => p.id === "linde-letter");
      if (pose?.asset === lindeDeliveryAssets.walk) strides.add(pose.frame);
      if (letter) {
        sawLetter = true;
        assert.ok(letter.depth > leon.lane, "letter is visible in front of hands");
      }
      if (battle.enemies.some((e) => e.hp > 0)) {
        assert.equal(letter, undefined, "handoff pauses during combat");
      }
      if (look.lindeDelivery.completed && look.lindeDelivery.node === 14 && leon.walking && letter)
        sawReturn = true;
      if (look.lindeDelivery.visualComplete) {
        visualComplete = true;
        assert.equal(look.lindeDelivery.completed, true);
        assert.equal(leon.walking, false);
        assert.ok(letter, "the received reply remains in Leon's hand");
        break;
      }
      state = settle(state, state.updatedAt + 50);
    }
    assert.ok(sawLetter);
    assert.ok(strides.size >= 3, "walking uses distinct frames");
    assert.deepEqual(
      [...nodes],
      Array.from({ length: 15 }, (_, i) => i),
    );
    assert.equal(state.done["linde-requests"], 1);
    assert.ok(sawReturn, "Leon carries the reply back before completion");
    assert.ok(visualComplete, "completion waits for Leon's return");
  });

test("Linde defaults to the reviewed town and preserves comparison backgrounds", () => {
  const state = testState(
    1000,
    storyStages.findIndex((s) => s.quest === "linde-requests"),
    40,
    10000,
  );
  const input = { squad: state.squads[0], startQuest: "linde-requests", now: 1000, ready: true };
  const base = storybookAdventureInput(input);
  assert.equal(base.backgroundOverride, lindeDeliveryAssets.bank);
  assert.equal(base.squad, input.squad);
  assert.equal(
    storybookAdventureInput({ ...input, storybookHeroes: false }).storybookHeroes,
    false,
  );
  assert.equal(
    storybookAdventureInput({ ...input, backgroundOverride: "/custom.png" }).backgroundOverride,
    "/custom.png",
  );
  for (const extra of [
    { storybookHeroes: false, backgroundOverride: lindeDeliveryAssets.bank },
    { storybookHeroes: true, backgroundOverride: "/custom.png" },
  ]) {
    const frame = chapterRoadFrame({
      squad: state.squads[0],
      startQuest: "linde-requests",
      now: 1000,
      ready: true,
      ...extra,
    });
    assert.equal(frame.look.lindeDelivery, undefined);
  }
});

for (const unavailable of ["absent", "down", "paralyzed"])
  test(`Linde completion does not wait for a courier who is ${unavailable}`, () => {
    const view = { width: 390, height: 700 };
    const state = testState(
      1000,
      storyStages.findIndex((s) => s.quest === "linde-requests"),
      40,
      10000,
    );
    const motion = new RoadMotion();
    const before = JSON.stringify(state);
    for (const [node, completed] of [
      [2, false],
      [8, false],
      [14, true],
    ]) {
      const frame = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: "linde-requests",
          now: 1000 + node * 100,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: lindeDeliveryAssets.bank,
        },
        false,
        1400,
        view,
      );
      frame.look.lindeDelivery.node = node;
      frame.look.lindeDelivery.completed = completed;
      if (unavailable === "absent")
        frame.battle.heroes = frame.battle.heroes.filter((hero) => hero.id === "lico");
      else {
        for (const hero of frame.battle.heroes) {
          if (unavailable === "down") hero.hp = 0;
          else hero.paralyzed = true;
        }
      }
      const drawn = motion.update(
        frame,
        `unavailable-${unavailable}`,
        view.width,
        false,
        view.height,
      );
      assert.equal(drawn.look.lindeDelivery.node, node);
      assert.equal(!!drawn.look.lindeDelivery.visualComplete, completed);
      assert.equal(drawn.battle.waterwayActions.poses.leon, undefined);
      assert.equal(
        drawn.battle.waterwayActions.props.find((prop) => prop.id === "linde-letter"),
        undefined,
      );
    }
    assert.equal(JSON.stringify(state), before);
  });

for (const id of ["aria", "mira", "finn"])
  test(`${id} delivers and returns when the others cannot act`, () => {
    const view = { width: 390, height: 700 };
    const index = storyStages.findIndex((s) => s.quest === "linde-requests");
    let state = testState(1000, index, 40, 10000);
    const interlude = pendingInterlude(state);
    if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
    state = act(
      state,
      { type: "start", id: "linde-requests", readDeparture: true, value: false },
      state.updatedAt,
    );
    const motion = new RoadMotion();
    let after = 0,
      sawWalk = false,
      sawLetter = false,
      done = false,
      last;
    for (let i = 0; i < 12000; i++) {
      const frame = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: "linde-requests",
          now: state.updatedAt + after * 50,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: lindeDeliveryAssets.bank,
          questComplete: !!state.done["linde-requests"],
        },
        false,
        1400,
        view,
      );
      for (const hero of frame.battle.heroes) if (hero.id !== id) hero.hp = 0;
      const drawn = motion.update(frame, `solo-${id}`, view.width, false, view.height);
      last = drawn;
      const pose = drawn.battle.waterwayActions.poses[id];
      if (pose && drawn.battle.heroes.find((hero) => hero.id === id)?.walking) sawWalk = true;
      if (drawn.battle.waterwayActions.props.some((prop) => prop.id === "linde-letter"))
        sawLetter = true;
      if (drawn.look.lindeDelivery.visualComplete) {
        done = true;
        break;
      }
      if (!state.squads[0].run) after++;
      else {
        state = settle(state, state.updatedAt + 50);
        if (state.squads[0].run && i % 4 === 0)
          state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
      }
    }
    assert.ok(
      sawWalk && sawLetter && done,
      `${id}: walk=${sawWalk} letter=${sawLetter} done=${done} run=${!!state.squads[0].run} cleared=${!!state.done["linde-requests"]} heroes=${JSON.stringify(last.battle.heroes)} pose=${JSON.stringify(last.battle.waterwayActions.poses)}`,
    );
  });

for (const view of [
  { width: 390, height: 700 },
  { width: 936, height: 624 },
])
  test(`a replacement picks up the dropped reply and returns at ${view.width}`, () => {
    const index = storyStages.findIndex((s) => s.quest === "linde-requests");
    let state = testState(1000, index, 40, 10000);
    const interlude = pendingInterlude(state);
    if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
    state = act(
      state,
      { type: "start", id: "linde-requests", readDeparture: true, value: false },
      state.updatedAt,
    );
    const motion = new RoadMotion();
    let after = 0,
      replaced = false,
      picked = false,
      carried = false,
      previousPaper,
      checkedContinuity = false,
      done = false,
      replacementAt = 0,
      finishedAt = 0;
    for (let i = 0; i < 12000; i++) {
      const frame = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: "linde-requests",
          now: state.updatedAt + after * 50,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: lindeDeliveryAssets.bank,
          questComplete: !!state.done["linde-requests"],
        },
        false,
        1400,
        view,
      );
      if (replaced) frame.battle.heroes.find((hero) => hero.id === "leon").hp = 0;
      const drawn = motion.update(frame, "replacement", view.width, false, view.height);
      const leon = drawn.battle.heroes.find((hero) => hero.id === "leon");
      const aria = drawn.battle.heroes.find((hero) => hero.id === "aria");
      const pose = drawn.battle.waterwayActions.poses.aria;
      const paper = drawn.battle.waterwayActions.props.find((prop) => prop.id === "linde-letter");
      if (replaced && !checkedContinuity && previousPaper && paper) {
        const dx = roadX(paper.point.x, 0, view.width) - roadX(previousPaper.x, 0, view.width);
        const dy =
          roadY(paper.point.lane, view.height, view.width) -
          roadY(previousPaper.lane, view.height, view.width);
        assert.ok(Math.hypot(dx, dy) < 8, `letter jumped ${Math.hypot(dx, dy)}px`);
        checkedContinuity = true;
      }
      if (
        replaced &&
        pose?.asset === "/storybook-study/aria-night-handheld-v1.webp" &&
        pose.frame === 1
      )
        picked = true;
      if (
        picked &&
        aria.walking &&
        drawn.battle.waterwayActions.props.some((prop) => prop.id === "linde-letter")
      )
        carried = true;
      if (drawn.look.lindeDelivery.visualComplete) {
        done = true;
        finishedAt = drawn.battle.time;
        break;
      }
      if (!replaced && drawn.look.lindeDelivery.completed && leon.walking) {
        replaced = true;
        replacementAt = drawn.battle.time;
        previousPaper = paper?.point;
      }
      if (!state.squads[0].run) after++;
      else {
        state = settle(state, state.updatedAt + 50);
        if (state.squads[0].run && i % 4 === 0)
          state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
      }
    }
    assert.ok(
      replaced && checkedContinuity && picked && carried && done,
      `replacement=${replaced} continuity=${checkedContinuity} picked=${picked} carried=${carried} done=${done}`,
    );
    assert.ok(
      finishedAt - replacementAt < 10000,
      "the normal handoff finished before the safety timeout",
    );
  });

test("the handoff side stays stable if the blocked side clears during an approach", () => {
  const view = { width: 390, height: 700 };
  const point = { x: 600, y: 465 };
  const layout = lindeDeliveryLayout(view);
  const leon = {
    id: "leon",
    hp: 0,
    maxHp: 1,
    ...layout.world(501, 465),
    walking: false,
    facing: 1,
  };
  const battle = { heroes: [leon], distance: 0, stage: "forest" };
  const switched = lindeHandoffSide(battle, view, point, "aria", true, -1);
  assert.equal(switched, 1);
  leon.hp = 1;
  assert.equal(lindeHandoffSide(battle, view, point, "aria", true, switched), 1);
});

test("a second replacement drops the paper from the current pickup position", () => {
  const view = { width: 390, height: 700 },
    l = lindeDeliveryLayout(view);
  const pickup = new LindePaperPickup();
  const leon = { id: "leon", hp: 0, maxHp: 1, ...l.world(500, 500), facing: 1, walking: false };
  const aria = { id: "aria", hp: 1, maxHp: 1, ...l.world(400, 600), facing: 1, walking: false };
  pickup.rememberParty({ heroes: [leon, aria] }, view, true);
  pickup.remember(leon, l.world(530, 450), true, false, view, true);
  pickup.replace("leon", "aria", 1000);
  const target = pickup.target("aria", view, true);
  Object.assign(aria, l.world(...target));
  pickup.finish(aria, { time: 1400 }, view, true);
  const duringLift = pickup.finish(aria, { time: 1750 }, view, true).point;
  pickup.replace("aria", "mira", 1750);
  const afterSwitch = pickup.point(1750, view, true);
  assert.ok(Math.abs(duringLift.x - afterSwitch.x) < 1e-7);
  assert.ok(Math.abs(duringLift.lane - afterSwitch.lane) < 1e-7);
});

test("the resident turns with the same letter instead of moving it instantly", () => {
  const view = { width: 390, height: 700 },
    l = lindeDeliveryLayout(view);
  const pickup = new LindePaperPickup();
  const leon = { id: "leon", hp: 1, maxHp: 1, ...l.world(501, 465), facing: 1, walking: false };
  const left = l.world(546, 401),
    right = l.world(654, 401);
  pickup.remember(leon, left, false, false, view, true);
  assert.equal(pickup.residentHas("leon"), true);
  pickup.residentTurns(1000);
  const first = pickup.residentPoint(right, 1000, view, true);
  const last = pickup.residentPoint(right, 1350, view, true);
  assert.ok(Math.abs(first.x - left.x) < 1e-7);
  assert.ok(Math.abs(first.lane - left.lane) < 1e-7);
  assert.ok(Math.abs(last.x - right.x) < 1e-7);
  assert.ok(Math.abs(last.lane - right.lane) < 1e-7);
});

for (const replacement of ["mira", "finn"])
  test(`${replacement} reaches the dropped letter when earlier couriers are down`, () => {
    const view = { width: 1178, height: 608 };
    const index = storyStages.findIndex((s) => s.quest === "linde-requests");
    let state = testState(1000, index, 40, 10000);
    const interlude = pendingInterlude(state);
    if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
    state = act(
      state,
      { type: "start", id: "linde-requests", readDeparture: true, value: false },
      state.updatedAt,
    );
    const motion = new RoadMotion(),
      priority = ["leon", "aria", "mira", "finn"];
    let after = 0,
      replaced = false,
      picked = false,
      carried = false,
      done = false;
    for (let i = 0; i < 12000; i++) {
      const frame = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: "linde-requests",
          now: state.updatedAt + after * 50,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: lindeDeliveryAssets.bank,
          questComplete: !!state.done["linde-requests"],
        },
        false,
        1400,
        view,
      );
      if (replaced)
        for (const hero of frame.battle.heroes)
          if (priority.indexOf(hero.id) < priority.indexOf(replacement)) hero.hp = 0;
      const drawn = motion.update(
        frame,
        `multi-down-${replacement}`,
        view.width,
        false,
        view.height,
      );
      const leon = drawn.battle.heroes.find((hero) => hero.id === "leon");
      const hero = drawn.battle.heroes.find((item) => item.id === replacement);
      const pose = drawn.battle.waterwayActions.poses[replacement];
      if (
        pose?.asset ===
          `/storybook-study/${replacement === "finn" ? "finn-handheld-balanced-v2" : "mira-handheld-v1"}.webp` &&
        pose.frame === 1
      )
        picked = true;
      if (
        picked &&
        hero.walking &&
        drawn.battle.waterwayActions.props.some((prop) => prop.id === "linde-letter")
      )
        carried = true;
      if (drawn.look.lindeDelivery.visualComplete) {
        done = true;
        break;
      }
      const leonX = roadX(leon.x, 0, view.width);
      if (
        !replaced &&
        drawn.look.lindeDelivery.node === 0 &&
        leon.walking &&
        leonX > 470 &&
        leonX < 490 &&
        drawn.battle.waterwayActions.props.some((prop) => prop.id === "linde-letter")
      )
        replaced = true;
      if (!state.squads[0].run) after++;
      else {
        state = settle(state, state.updatedAt + 50);
        if (replaced && state.squads[0].run && i % 4 === 0)
          state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
      }
    }
    assert.ok(
      replaced && picked && carried && done,
      `replaced=${replaced} picked=${picked} carried=${carried} done=${done}`,
    );
  });

test("the Linde backdrop covers narrow, intermediate and wide canvases", () => {
  for (const view of [
    { width: 374, height: 249 },
    { width: 600, height: 400 },
    { width: 936, height: 624 },
    { width: 900, height: 400 },
    { width: 390, height: 700 },
  ]) {
    const { backdrop } = lindeDeliveryLayout(view);
    assert.ok(backdrop.x <= 0.001 && backdrop.y <= 0.001);
    assert.ok(backdrop.x + backdrop.width >= view.width - 0.001);
    assert.ok(backdrop.y + backdrop.height >= view.height - 0.001);
  }
});

test("orientation changes fade once and do not flicker near square", () => {
  const transition = new LindeViewportTransition();
  assert.deepEqual(transition.update({ width: 600, height: 600 }, 0, false), {
    portrait: false,
    fade: 0,
  });
  assert.deepEqual(transition.update({ width: 600, height: 620 }, 10, false), {
    portrait: false,
    fade: 0,
  });
  assert.deepEqual(transition.update({ width: 600, height: 700 }, 100, false), {
    portrait: false,
    fade: 0,
  });
  assert.deepEqual(transition.update({ width: 600, height: 700 }, 225, false), {
    portrait: false,
    fade: 0.5,
  });
  assert.deepEqual(transition.update({ width: 600, height: 700 }, 350, false), {
    portrait: true,
    fade: 1,
  });
  assert.deepEqual(transition.update({ width: 600, height: 700 }, 600, false), {
    portrait: true,
    fade: 0,
  });
  assert.deepEqual(transition.update({ width: 600, height: 590 }, 610, false), {
    portrait: true,
    fade: 0,
  });
  assert.deepEqual(transition.update({ width: 600, height: 500 }, 620, true), {
    portrait: false,
    fade: 0,
  });
});

test("paused resizing preserves each character's ground location", () => {
  const index = storyStages.findIndex((s) => s.quest === "linde-requests");
  let state = testState(1000, index, 40, 10000);
  const interlude = pendingInterlude(state);
  if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
  state = act(
    state,
    { type: "start", id: "linde-requests", readDeparture: true, value: false },
    state.updatedAt,
  );
  const motion = new RoadMotion(),
    a = { width: 936, height: 624 },
    b = { width: 390, height: 700 };
  const input = {
    squad: state.squads[0],
    startQuest: "linde-requests",
    now: 1000,
    paused: true,
    ready: true,
    storybookHeroes: true,
    backgroundOverride: lindeDeliveryAssets.bank,
  };
  const first = motion.update(
    chapterRoadFrame(input, false, 1400, a),
    "resize",
    a.width,
    false,
    a.height,
  );
  const second = motion.update(
    chapterRoadFrame(input, false, 1400, b),
    "resize",
    b.width,
    false,
    b.height,
  );
  assert.equal(first.look.lindeDelivery.portrait, false);
  assert.equal(second.look.lindeDelivery.portrait, true);
  for (const h of first.battle.heroes) {
    const next = second.battle.heroes.find((item) => item.id === h.id);
    const p = lindeDeliveryLayout(a, false).unproject(
      roadX(h.x, 0, a.width),
      roadY(h.lane, a.height, a.width),
    );
    const q = lindeDeliveryLayout(b, true).unproject(
      roadX(next.x, 0, b.width),
      roadY(next.lane, b.height, b.width),
    );
    assert.ok(Math.hypot(p.x - q.x, p.y - q.y) < 0.01, `${h.id} changed ground location`);
  }
});

for (const reduced of [false, true])
  test(`rapid help keeps the final reply until return, reduced=${String(reduced)}`, () => {
    const view = { width: 374, height: (374 * 2) / 3 },
      motion = new RoadMotion();
    const index = storyStages.findIndex((s) => s.quest === "linde-requests");
    let state = testState(1000, index, 40, 10000),
      after = 0,
      last;
    const interlude = pendingInterlude(state);
    if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
    state = act(
      state,
      { type: "start", id: "linde-requests", readDeparture: true, value: false },
      state.updatedAt,
    );
    for (let i = 0; i < 12000; i++) {
      const raw = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: "linde-requests",
          now: state.updatedAt + after * 50,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: lindeDeliveryAssets.bank,
          questComplete: !!state.done["linde-requests"],
        },
        reduced,
        1400,
        view,
      );
      last = motion.update(raw, "rapid-linde", view.width, reduced, view.height);
      if (last.look.lindeDelivery.visualComplete) break;
      if (!state.squads[0].run) after++;
      else {
        state = settle(state, state.updatedAt + 50);
        if (state.squads[0].run && i % 4 === 0)
          state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
      }
    }
    assert.equal(state.done["linde-requests"], 1);
    assert.equal(last.look.lindeDelivery.node, 14);
    assert.equal(last.look.lindeDelivery.visualComplete, true);
    assert.equal(last.battle.heroes.find((h) => h.id === "leon").walking, false);
  });
