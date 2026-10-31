import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { groundWorkVisible } from "../lib/road-storybook-work.ts";
import { FoundingVisualQueue } from "../lib/road-founding-queue.ts";
import { foundingRoadBackground, journeyCartWidth } from "../lib/road-journey-cart.ts";
import { roadDepth, roadHeroSize, roadScale, roadX } from "../lib/road-layout.ts";
import { foundingCargo, removeFoundingCargo } from "../lib/road-founding-cargo.ts";
import { foundingWaitingCompanion } from "../lib/road-founding-formation.ts";
import {
  FoundingRecipient,
  foundingRecipientHand,
  foundingRecipientItemPoint,
  foundingRecipientCarryWalk,
  foundingRecipientTurn,
  foundingRecipientWalk,
} from "../lib/road-founding-recipient.ts";

test("the founding scene never displays the legacy ground letter while waiting for its handoff", () => {
  const state = { gathering: { task: "inspect" } };
  const look = {
    storybookHeroes: true,
    quest: "starlit-guild-founding",
    foundingDraft: { node: 0 },
  };
  assert.equal(groundWorkVisible(state, look), false);
  assert.equal(groundWorkVisible(state, { ...look, foundingDraft: undefined }), true);
});

test("the recipient keeps a receiving hand extended while turning with the item", () => {
  const motion = new FoundingRecipient();
  const target = { x: 400, lane: 0.5 };
  const view = { width: 390, height: 260 };
  const battle = { distance: 400, stage: "road", time: 0 };
  assert.equal(motion.update("pickup", target, battle, view).pose.asset, foundingRecipientWalk);
  battle.time = 100_000;
  assert.equal(motion.update("give", target, battle, view).pose.frame, 1);
  const turning = motion.update("return", target, battle, view);
  assert.equal(turning.pose.asset, foundingRecipientTurn);
  assert.equal(turning.pose.frame, 0, "the recipient first reaches toward the offered item");
  for (let frame = 1; frame < 4; frame++) {
    battle.time += 150;
    const next = motion.update("return", target, battle, view);
    assert.equal(next.pose.asset, foundingRecipientTurn);
    assert.equal(next.pose.frame, frame);
    assert.equal(next.facing, 1, "each turn pose already has its own direction");
  }
  battle.time += 150;
  assert.equal(
    motion.update("return", target, battle, view).pose.asset,
    foundingRecipientCarryWalk,
  );
});

test("a retained frame with an earlier clock keeps a valid turn and hand position", () => {
  const motion = new FoundingRecipient();
  const target = { x: 400, lane: 0.5 };
  const view = { width: 390, height: 260 };
  const battle = { distance: 400, stage: "road", time: 100_000 };
  motion.update("pickup", target, battle, view);
  motion.update("return", target, battle, view);
  battle.time -= 200;
  const recipient = motion.update("return", target, battle, view);
  assert.equal(recipient.pose.frame, 0);
  const point = foundingRecipientItemPoint(recipient, view, battle.stage);
  assert.ok(Number.isFinite(point.x) && Number.isFinite(point.lane));
});

test("carrying steps keep the item at the recipient's cupped hands", async () => {
  const motion = new FoundingRecipient();
  const target = { x: 400, lane: 0.5 };
  const view = { width: 390, height: 260 };
  const battle = { distance: 400, stage: "forest", time: 0 };
  motion.update("pickup", target, battle, view);
  battle.time = 100_000;
  motion.update("return", target, battle, view);
  const { data, info } = await sharp("public/storybook-study/merchant-carry-walk-v1.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const frames = new Set();
  for (let age = 600; age < 5000; age += 50) {
    battle.time = 100_000 + age;
    const recipient = motion.update("return", target, battle, view);
    if (recipient.pose.asset !== foundingRecipientCarryWalk) break;
    assert.equal(recipient.facing, 1, "the carrying sheet already faces right");
    const point = foundingRecipientItemPoint(recipient, view, battle.stage);
    const size = roadHeroSize(view.width, view.height);
    const x = Math.round(64 + ((point.x - recipient.point.x) * roadScale(view.width) * 104) / size);
    const y = Math.round(
      120 + ((point.lane - recipient.point.lane) * roadDepth(view.width, view.height) * 104) / size,
    );
    const pixel = (y * info.width + 128 * recipient.pose.frame + x) * 4;
    const [r, g, b, a] = data.subarray(pixel, pixel + 4);
    assert.ok(a > 200 && r > 140 && r > g && g > b, `step ${recipient.pose.frame} touches a hand`);
    frames.add(recipient.pose.frame);
  }
  assert.deepEqual([...frames].sort(), [0, 1, 2, 3]);
});

test("turning poses hold the received object at the visible palms", async () => {
  const motion = new FoundingRecipient();
  const target = { x: 400, lane: 0.5 };
  const view = { width: 390, height: 260 };
  const battle = { distance: 400, stage: "forest", time: 0 };
  motion.update("pickup", target, battle, view);
  battle.time = 100_000;
  const { data, info } = await sharp("public/storybook-study/merchant-turn-carry-v2.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let frame = 0; frame < 4; frame++) {
    const recipient = motion.update("return", target, battle, view);
    const point = foundingRecipientItemPoint(recipient, view, battle.stage);
    const size = roadHeroSize(view.width, view.height);
    const x = Math.round(64 + ((point.x - recipient.point.x) * roadScale(view.width) * 104) / size);
    const y = Math.round(
      120 + ((point.lane - recipient.point.lane) * roadDepth(view.width, view.height) * 104) / size,
    );
    const pixel = (y * info.width + 128 * frame + x) * 4;
    const [r, g, b, a] = data.subarray(pixel, pixel + 4);
    assert.ok(
      a > 200 && r > 140 && r > g && g > b,
      `turn frame ${frame} contact falls on the hand`,
    );
    battle.time += 150;
  }
});

test("the received object follows a visible hand in each walking frame", async () => {
  const view = { width: 390, height: 260 };
  const foot = { x: 400, lane: 0.5 };
  const size = roadHeroSize(view.width, view.height);
  const { data, info } = await sharp("public/storybook-study/merchant-walk-v2.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let frame = 0; frame < 4; frame++) {
    for (const facing of [1, -1]) {
      const point = foundingRecipientHand(foot, view, "forest", facing, frame);
      const x = Math.round(
        64 + ((point.x - foot.x) * roadScale(view.width) * 104) / (size * facing),
      );
      const y = Math.round(
        120 + ((point.lane - foot.lane) * roadDepth(view.width, view.height) * 104) / size,
      );
      const pixel = (y * info.width + frame * 128 + x) * 4;
      const [r, g, b, a] = data.subarray(pixel, pixel + 4);
      assert.ok(a > 200 && r > 140 && r > g && g > b, `frame ${frame} contact falls on the hand`);
    }
  }
});

test("the handoff meets the recipient's outstretched hand", async () => {
  const view = { width: 390, height: 260 };
  const foot = { x: 400, lane: 0.5 };
  const size = roadHeroSize(view.width, view.height);
  const point = foundingRecipientHand(foot, view, "forest");
  const x = Math.round(64 + ((point.x - foot.x) * roadScale(view.width) * 104) / size);
  const y = Math.round(
    120 + ((point.lane - foot.lane) * roadDepth(view.width, view.height) * 104) / size,
  );
  const { data, info } = await sharp("public/storybook-study/merchant-service-v1.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixel = (y * info.width + 128 + x) * 4;
  const [r, g, b, a] = data.subarray(pixel, pixel + 4);
  assert.ok(a > 200 && r > 140 && r > g && g > b);
});

test("recipient footsteps follow travel distance rather than the game clock", () => {
  const target = { x: 400, lane: 0.5 };
  const view = { width: 390, height: 260 };
  const early = new FoundingRecipient();
  const later = new FoundingRecipient();
  const seen = new Set();
  for (let elapsed = 0; elapsed <= 1600; elapsed += 100) {
    const a = early.update(
      "pickup",
      target,
      { distance: 400, stage: "forest", time: elapsed },
      view,
    );
    const b = later.update(
      "pickup",
      target,
      { distance: 400, stage: "forest", time: elapsed + 730 },
      view,
    );
    assert.deepEqual(a.point, b.point);
    assert.equal(a.pose.frame, b.pose.frame, "the same position has the same walking pose");
    seen.add(a.pose.frame);
  }
  assert.ok(seen.size > 1, "travel advances the walking cycle");
});

test("each taken item leaves the other cargo in its original slots", () => {
  const delivered = new Set();
  for (const node of [0, 1, 3, 4, 6, 7, 9, 10, 12, 13]) {
    const kind = node % 3 === 0 ? "letter" : "basket";
    const cargo = foundingCargo(15, delivered);
    const before = structuredClone(cargo.slots);
    removeFoundingCargo(cargo, { kind, node });
    const index = Math.floor(node / 3);
    assert.equal(before[kind][index], true);
    assert.equal(cargo.slots[kind][index], false);
    before[kind][index] = false;
    assert.deepEqual(cargo.slots, before, "other objects must not move or disappear");
    delivered.add(node);
    assert.deepEqual(foundingCargo(15, delivered).slots, before);
  }
  assert.equal(foundingCargo(15, delivered).slots.letter.some(Boolean), false);
  assert.equal(foundingCargo(15, delivered).slots.basket.some(Boolean), false);
});

test("recent work stays queued once when game progress moves ahead", () => {
  const queue = new FoundingVisualQueue();
  const point = { kind: "herb", task: "inspect", x: 100, remaining: 5, total: 5 };
  queue.observe("a", 0, true, point);
  point.x = 300;
  queue.observe("a", 1, true, point);
  assert.deepEqual(queue.observe("a", 3, true, point), [1]);
  assert.equal(queue.current.kind, "letter");
  assert.equal(queue.current.point.x, 100);
  queue.complete();
  assert.equal(queue.current.kind, "letter");
  assert.equal(queue.current.node, 3);
  queue.complete();
  assert.equal(queue.current, undefined);
  queue.observe("b", 0, true, point);
  assert.equal(queue.current.kind, "letter", "a new run starts a fresh visual queue");
});

test("a long backlog preserves the active and newest handoffs without replaying a loaded past", () => {
  const queue = new FoundingVisualQueue();
  const point = { kind: "herb", task: "inspect", x: 115, remaining: 5, total: 5 };
  queue.observe("first", 0, true, point, false, 15);
  const omitted = queue.observe("first", 7, true, { ...point, task: "pack", x: 1585 }, false, 15);
  omitted.push(...queue.observe("first", 14, false, null, true, 15));
  const nodes = [];
  while (queue.current) {
    nodes.push(queue.current.node);
    assert.equal(queue.current.point.x, queue.current.node * 210 + 115);
    queue.complete();
  }
  assert.deepEqual(nodes, [0]);
  assert.deepEqual(omitted, [1, 3, 4, 6, 7, 9, 10, 12, 13]);
  queue.observe("loaded", 9, false, null, false, 15);
  queue.observe("loaded", 11, false, null, false, 15);
  assert.equal(queue.current.node, 9);
  queue.complete();
  assert.equal(queue.current.node, 10);
  queue.complete();
  assert.equal(queue.current, undefined);
});

for (const width of [390, 936])
  test(`Leon leaves Finn a clear route to the recipient at ${width}px`, () => {
    const view = { width, height: (width * 2) / 3 };
    const cart = { x: 400, lane: 0.82 };
    const leon = foundingWaitingCompanion({ id: "leon" }, cart, view, "forest", "finn");
    const mira = foundingWaitingCompanion({ id: "mira" }, cart, view, "forest", "finn");
    assert.ok(leon.x < mira.x && mira.x < cart.x);
    assert.ok((mira.x - leon.x) * roadScale(width, "forest") >= roadHeroSize(width, view.height));
  });

for (const width of [390, 936])
  test(`both handoffs retain their objects and finish at ${width}px`, () => {
    const quest = "starlit-guild-founding",
      height = (width * 2) / 3,
      view = { width, height };
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
    const motion = new RoadMotion(),
      seen = new Set(),
      previous = new Map(),
      recipients = new Map();
    let basketGone = false,
      resumed = false,
      visualElapsed = 0;
    for (let i = 0; i < 1600 && !resumed; i++) {
      const before = JSON.stringify(state);
      const input = {
        squad: state.squads[0],
        startQuest: quest,
        now: state.updatedAt + visualElapsed,
        ready: true,
        paused: false,
        storybookHeroes: true,
        backgroundOverride: foundingRoadBackground,
      };
      const result = motion.update(
        chapterRoadFrame(input, false, 1400, view),
        "handoff",
        width,
        false,
        height,
      );
      assert.equal(JSON.stringify(state), before);
      const cart = result.battle.journeyCart,
        scene = result.battle.waterwayActions;
      assert.ok(cart);
      for (const actor of scene?.actors ?? []) {
        if (!actor.id.startsWith("founding-recipient-")) continue;
        const kind = actor.id.slice("founding-recipient-".length);
        const x = roadX(actor.point.x, result.battle.distance, width, result.battle.stage);
        const previousRecipient = recipients.get(kind);
        if (!previousRecipient) recipients.set(kind, { first: x, last: x, exitingWithItem: false });
        const current = recipients.get(kind);
        current.last = x;
        if (
          actor.pose.asset === foundingRecipientCarryWalk &&
          scene.props.some((prop) => prop.id === `founding-${kind}`)
        )
          current.exitingWithItem = true;
      }
      for (const prop of scene?.props ?? []) {
        if (!prop.id?.startsWith("founding-")) continue;
        const kind = prop.id.slice("founding-".length);
        assert.equal(
          result.look.foundingDraft?.visualNode,
          kind === "letter" ? 0 : 1,
          "the displayed work remains aligned with the visible handoff",
        );
        assert.equal(cart.cargo[kind], false, "the same object must not remain on the cart");
        const last = previous.get(kind);
        if (!last) {
          const size = journeyCartWidth(view, cart);
          const expectedX = cart.x - (size * (kind === "letter" ? 0.3 : 0.16)) / roadScale(width);
          const expectedLane =
            cart.lane - (size * (kind === "letter" ? 0.33 : 0.366)) / roadDepth(width, height);
          assert.ok(Math.abs(prop.point.x - expectedX) * roadScale(width) < 1);
          assert.ok(Math.abs(prop.point.lane - expectedLane) * roadDepth(width, height) < 1);
        } else {
          const distance = Math.hypot(
            (prop.point.x - last.x) * roadScale(width),
            (prop.point.lane - last.lane) * roadDepth(width, height),
          );
          const maxStep = (14 * width) / 560 + 4;
          assert.ok(
            distance <= maxStep,
            `${kind} jumped ${distance}px at ${i}: ${JSON.stringify({ last, current: prop.point, cue: result.look.foundingDraft?.cue, recipient: scene.actors })}`,
          );
        }
        previous.set(kind, {
          ...prop.point,
          cue: result.look.foundingDraft?.cue,
          facing: result.battle.heroes.find((h) => h.id === result.look.foundingDraft?.actor)
            ?.facing,
          walking: result.battle.heroes.find((h) => h.id === result.look.foundingDraft?.actor)
            ?.walking,
        });
        seen.add(kind);
      }
      if (recipients.get("basket")?.last > width) basketGone = true;
      if (basketGone && cart.phase === "moving") resumed = true;
      if (state.squads[0].run?.node >= 2) visualElapsed += 100;
      else state = settle(state, state.updatedAt + 100);
    }
    assert.deepEqual([...seen], ["letter", "basket"]);
    assert.ok(resumed, "the group continues after both handoffs");
    for (const kind of ["letter", "basket"]) {
      const actor = recipients.get(kind);
      assert.ok(actor.first > width, `${kind} recipient starts outside the screen`);
      assert.ok(actor.last > width, `${kind} recipient leaves beyond the screen`);
      assert.ok(actor.exitingWithItem, `${kind} remains visible while the recipient leaves`);
    }
  });

test("completion waits for the queued handoff and the cart's arrival", () => {
  const quest = "starlit-guild-founding",
    view = { width: 390, height: 260 };
  let state = testState(
    1000,
    storyStages.findIndex((s) => s.quest === quest),
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
  let completing = false,
    sawPending = false,
    complete = false,
    now = state.updatedAt;
  for (let i = 0; i < 3000 && !complete; i++) {
    const before = JSON.stringify(state);
    const input = {
      squad: state.squads[0],
      startQuest: quest,
      now,
      ready: true,
      paused: false,
      storybookHeroes: true,
      backgroundOverride: foundingRoadBackground,
      questComplete: completing,
    };
    const result = motion.update(
      chapterRoadFrame(input, false, 1400, view),
      "completion",
      view.width,
      false,
      view.height,
    );
    assert.equal(JSON.stringify(state), before);
    if (!completing && result.look.foundingDraft?.cue === "walk") completing = true;
    if (completing && result.look.foundingDraft?.visualNode !== undefined) {
      sawPending = true;
      assert.notEqual(result.look.foundingDraft.visualComplete, true);
    }
    if (result.look.foundingDraft?.visualComplete) {
      assert.ok(result.battle.journeyCart.x >= result.look.length - 1);
      complete = true;
    }
    if (!completing) state = settle(state, state.updatedAt + 100);
    now += 100;
  }
  assert.ok(sawPending);
  assert.ok(complete, "visual completion follows the handoff and final cart movement");
});
