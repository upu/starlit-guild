import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import {
  townParcelAsset,
  townParcelCarry,
  townParcelFoot,
  townParcelSupported,
  townParcelWidth,
  TownHandoffSync,
  TownParcelLift,
} from "../lib/road-town-parcel.ts";
import { roadDepth, roadScale } from "../lib/road-layout.ts";
import { waterwayPalm } from "../lib/road-waterway-contacts.ts";
import { townHandoff } from "../lib/road-town-handoff.ts";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";
import * as townParcel from "../lib/road-town-parcel.ts";

const { roadGatheringAppearance } = evaluateSourceModule(
  compileSourceModule("../app/phaser/road-town-parcel.ts", import.meta.url),
  {
    "@/lib/road-town-parcel": townParcel,
    "./road-poses": {},
    "./road-storybook-poses": {},
    "./road-work-appearance": { roadWorkAppearance: () => ({ asset: "other", size: 1 }) },
  },
);

function start() {
  return act(
    testState(1000, 2, 40, 10000),
    { type: "start", id: "town-deliveries", readDeparture: true, value: false },
    1000,
  );
}

test("checking and carrying use the same box at the same scale", () => {
  const view = { width: 374, height: 249 };
  const battle = { gathering: { task: "pack" }, heroes: [] };
  const look = {
    quest: "town-deliveries",
    storybookHeroes: true,
    workers: [],
    work: { label: "倉庫で荷札を確かめる" },
  };
  const checked = roadGatheringAppearance(battle, look, view, false);
  battle.gathering.task = "carry";
  const carried = roadGatheringAppearance(battle, look, view, true);
  assert.equal(checked.asset, townParcelAsset);
  assert.equal(checked.asset, carried.asset);
  assert.equal(checked.size, carried.size);
  look.quest = "medicine-packing";
  assert.equal(roadGatheringAppearance(battle, look, view, false).asset, "other");
});

test("the checked box remains in place and neither carrier walks through it", () => {
  for (const view of [
    { width: 374, height: 249 },
    { width: 936, height: 624 },
  ]) {
    let state = start(),
      checked,
      firstCarry,
      both = false;
    const motion = new RoadMotion();
    for (let i = 0; i < 200; i++) {
      state = settle(state, state.updatedAt + 50);
      const raw = chapterRoadFrame(
        {
          squad: state.squads[0],
          now: state.updatedAt,
          ready: true,
          paused: false,
          storybookHeroes: true,
        },
        false,
        1400,
        view,
      );
      const frame = motion.update(raw, "town", view.width, false, view.height);
      const box = frame.battle.gathering;
      if (!box) continue;
      if (raw.look.work?.label === "倉庫で荷札を確かめる")
        checked = { x: box.x + 65, lane: box.lane };
      if (raw.look.work?.label !== "商店へ荷物を運ぶ") continue;
      firstCarry ??= { x: box.x + 65, lane: box.lane };
      if (frame.battle.townParcelLift === 0) {
        for (const hero of frame.battle.heroes) {
          const dx = Math.abs(hero.x - (box.x + 65)) * roadScale(view.width, frame.battle.stage);
          const dy = Math.abs(hero.lane - box.lane) * roadDepth(view.width, view.height);
          assert.ok(
            dx >= townParcelWidth(view) * 0.42 || dy >= townParcelWidth(view) * 0.1,
            `${hero.id} steps onto the box`,
          );
        }
      }
      both ||= frame.battle.townParcelLift === 1;
    }
    assert.deepEqual(firstCarry, checked);
    assert.ok(both);
  }
});

test("the shared parcel and inward hands use the same scale in both viewports", () => {
  assert.equal(townParcelAsset, "/storybook-study/delivery-box-v2.webp");
  for (const view of [
    { width: 374, height: 249 },
    { width: 936, height: 624 },
  ]) {
    const center = 400,
      figure = townParcelWidth(view) / 96;
    const aria = townParcelFoot("aria", center, "forest", view);
    const leon = townParcelFoot("leon", center, "forest", view);
    assert.equal(aria.facing, 1);
    assert.equal(leon.facing, -1);
    assert.ok(
      Math.abs(
        (aria.x - center) * roadScale(view.width) + townParcelWidth(view) * 0.47 + 15 * figure,
      ) < 1e-9,
    );
    assert.ok(
      Math.abs(
        (leon.x - center) * roadScale(view.width) - townParcelWidth(view) * 0.47 - 17 * figure,
      ) < 1e-9,
    );
    assert.ok(
      Math.abs((aria.lane - 0.82) * roadDepth(view.width, view.height) - figure * (-45 + 44)) <
        1e-9,
    );
    assert.ok(
      Math.abs((leon.lane - 0.82) * roadDepth(view.width, view.height) - figure * (-45 + 49)) <
        1e-9,
    );
  }
});

test("the real delivery reaches the shared hold, lifts gradually and leaves game state untouched", () => {
  for (const view of [
    { width: 374, height: 249 },
    { width: 936, height: 624 },
  ]) {
    let state = start();
    const motion = new RoadMotion();
    let firstLift,
      fullLift = false,
      supported = 0;
    for (let i = 0; i < 500; i++) {
      state = settle(state, state.updatedAt + 50);
      const saved = JSON.stringify(state);
      const raw = chapterRoadFrame(
        {
          squad: state.squads[0],
          now: state.updatedAt,
          ready: true,
          paused: false,
          storybookHeroes: true,
        },
        false,
        1400,
        view,
      );
      const frame = motion.update(raw, "town", view.width, false, view.height);
      assert.equal(JSON.stringify(state), saved);
      if (!townParcelCarry(frame.battle, frame.look) || raw.look.work?.label !== "商店へ荷物を運ぶ")
        continue;
      if (townParcelSupported(frame.battle, frame.look)) {
        supported++;
        firstLift ??= frame.battle.townParcelLift;
        fullLift ||= frame.battle.townParcelLift === 1;
        assert.equal(frame.battle.heroes.find((h) => h.id === "aria").facing, 1);
        assert.equal(frame.battle.heroes.find((h) => h.id === "leon").facing, -1);
      }
    }
    assert.ok(supported > 10);
    assert.ok(firstLift > 0 && firstLift < 1);
    assert.ok(fullLift);
  }
});

test("a missing or incapacitated carrier cannot support the box", () => {
  const look = { quest: "town-deliveries", storybookHeroes: true, workers: ["aria", "leon"] };
  const battle = {
    gathering: { task: "carry" },
    heroes: [
      { id: "aria", hp: 10 },
      { id: "leon", hp: 0 },
    ],
  };
  assert.equal(townParcelSupported(battle, look), false);
  battle.heroes[1].hp = 1;
  assert.equal(townParcelSupported(battle, look), true);
  battle.heroes[0].paralyzed = true;
  assert.equal(townParcelSupported(battle, look), false);
});

test("the box waits on the ground until both carriers reach it, then moves with them", () => {
  const motion = new TownParcelLift();
  const look = { quest: "town-deliveries", storybookHeroes: true, workers: [] };
  const snapshot = (center) => ({
    gathering: { task: "carry", x: center - 65 },
    heroes: [
      { id: "aria", hp: 10, x: center - 40 },
      { id: "leon", hp: 10, x: center + 40 },
    ],
  });
  const initial = snapshot(100);
  motion.update(initial, look, 0.05, false, false);
  const original = snapshot(120);
  const before = structuredClone(original);
  motion.update(original, look, 0.05, false, false);
  assert.equal(original.gathering.x + 65, 100);
  assert.equal(before.gathering.x + 65, 120);
  look.workers = ["aria", "leon"];
  for (let i = 0; i < 7; i++) {
    const frame = snapshot(120);
    motion.update(frame, look, 0.05, false, false);
    assert.equal(frame.gathering.x + 65, 100);
    assert.equal(frame.heroes[0].x, 60);
  }
  const next = snapshot(120);
  motion.update(next, look, 0.05, false, false);
  assert.ok(next.gathering.x + 65 > 100);
  assert.equal(next.heroes[0].x, next.gathering.x + 65 - 40);
});

test("the delivered box retains its identity and position while the two carriers lower it", () => {
  for (const view of [
    { width: 374, height: 249 },
    { width: 936, height: 624 },
  ]) {
    let state = start();
    const motion = new RoadMotion();
    let lastCarry,
      previous,
      sawLower = false,
      sawGround = false;
    for (let i = 0; i < 500; i++) {
      state = settle(state, state.updatedAt + 50);
      const saved = JSON.stringify(state);
      const raw = chapterRoadFrame(
        {
          squad: state.squads[0],
          now: state.updatedAt,
          ready: true,
          paused: false,
          storybookHeroes: true,
        },
        false,
        1400,
        view,
      );
      const frame = motion.update(raw, "town", view.width, false, view.height);
      assert.equal(JSON.stringify(state), saved);
      const point = frame.battle.gathering;
      if (raw.look.work?.label === "商店へ荷物を運ぶ" && frame.battle.townParcelLift === 1)
        lastCarry = point.x + 65;
      if (raw.look.work?.label !== "品を渡して控えを受け取る" || lastCarry === undefined) continue;
      assert.equal(point.task, "carry");
      assert.equal(frame.look.work.frame, "town-parcel");
      assert.ok(townParcelSupported(frame.battle, frame.look));
      const center = point.x + 65;
      if (previous === undefined) assert.ok(Math.abs(center - lastCarry) <= 5);
      else assert.ok(Math.abs(center - previous) <= 5);
      previous = center;
      sawLower ||= frame.battle.townParcelLift < 1;
      sawGround ||= frame.battle.townParcelLift === 0;
      if (sawGround) break;
    }
    assert.ok(lastCarry !== undefined);
    assert.ok(sawLower && sawGround);
  }
});

test("reduced motion delivers immediately without losing the shared box", () => {
  const motion = new TownParcelLift();
  const view = { width: 374, height: 249 };
  const look = {
    quest: "town-deliveries",
    storybookHeroes: true,
    workers: ["aria", "leon"],
    work: { label: "商店へ荷物を運ぶ" },
  };
  const heroes = [
    { id: "aria", hp: 10, x: 60 },
    { id: "leon", hp: 10, x: 140 },
  ];
  const carrying = { stage: "forest", gathering: { task: "carry", x: 35 }, heroes };
  motion.update(carrying, look, 0, true, true, view);
  assert.equal(carrying.townParcelLift, 1);
  const delivered = { stage: "forest", gathering: { task: "pack", x: 55 }, heroes };
  const after = { ...look, work: { label: "品を渡して控えを受け取る" } };
  motion.update(delivered, after, 0, true, false, view);
  assert.equal(delivered.gathering.task, "carry");
  assert.equal(delivered.gathering.x + 65, 120);
  assert.equal(delivered.townParcelLift, 0);
});

test("reloading during a delivery reconstructs its box and finishes the handoff", () => {
  const motion = new TownParcelLift();
  const view = { width: 374, height: 249 };
  const heroes = [
    { id: "aria", hp: 10, x: 60, lane: 0.82 },
    { id: "leon", hp: 10, x: 140, lane: 0.82 },
  ];
  let completed = false,
    sawReceipt = false;
  for (let time = 0; time <= 3000; time += 50) {
    const battle = {
      time,
      stage: "forest",
      gathering: { task: "pack", x: 55 },
      heroes: structuredClone(heroes),
    };
    const look = {
      quest: "town-deliveries",
      townFinalizing: true,
      storybookHeroes: true,
      workers: [],
      work: { label: "品を渡して控えを受け取る" },
    };
    motion.update(battle, look, 0.05, false, false, view);
    sawReceipt ||= !!battle.waterwayActions?.props.some((p) => p.id === "town-receipt");
    if (battle.townVisualComplete) {
      completed = true;
      break;
    }
  }
  assert.ok(sawReceipt && completed);
});

test("recipient approaches the box before passing the receipt to Leon", () => {
  for (const view of [
    { width: 374, height: 249 },
    { width: 936, height: 624 },
  ]) {
    let state = start();
    const motion = new RoadMotion();
    let sawBend = false,
      sawReceipt = false,
      sawLeonOffer = false,
      sawEnd = false;
    for (let i = 0; i < 500; i++) {
      state = settle(state, state.updatedAt + 50);
      const saved = JSON.stringify(state);
      const raw = chapterRoadFrame(
        {
          squad: state.squads[0],
          now: state.updatedAt,
          ready: true,
          paused: false,
          storybookHeroes: true,
        },
        false,
        1400,
        view,
      );
      const frame = motion.update(raw, "town", view.width, false, view.height);
      assert.equal(JSON.stringify(state), saved);
      const action = frame.battle.waterwayActions;
      const resident = action?.actors?.find((a) => a.id === "town-delivery-recipient");
      if (resident?.pose.frame === 2 && resident.pose.asset.includes("service")) sawBend = true;
      const receipt = action?.props.find((p) => p.id === "town-receipt");
      if (!receipt) continue;
      assert.ok(sawBend, "recipient must bend before the receipt appears");
      assert.equal(receipt.asset, "/storybook-study/shipping-record-v1.webp");
      sawReceipt = true;
      sawLeonOffer ||= action.poses.leon?.frame === 2;
      const leon = frame.battle.heroes.find((h) => h.id === "leon");
      const hand = waterwayPalm(leon, [134, 105], -1, view);
      sawEnd ||=
        Math.abs(receipt.point.x - hand.x) < 1e-6 &&
        Math.abs(receipt.point.lane - hand.lane) < 1e-6;
    }
    assert.ok(sawBend && sawReceipt && sawLeonOffer && sawEnd);
  }
});

test("the recipient picks up the same box before handing over the receipt", () => {
  for (const view of [
    { width: 374, height: 249 },
    { width: 936, height: 624 },
  ]) {
    const frame = (age) => {
      const battle = {
        stage: "forest",
        heroes: [
          { id: "aria", x: 0, lane: 0.82 },
          { id: "leon", x: 1, lane: 0.82 },
        ],
      };
      townHandoff(battle, view, 400, age);
      return battle.waterwayActions;
    };
    const before = frame(449);
    assert.equal(before.debrisHidden, false);
    assert.equal(
      before.props.some((p) => p.id === "town-delivered-box"),
      false,
    );
    const start = frame(450),
      middle = frame(750),
      held = frame(1050);
    const box = (actions) => actions.props.find((p) => p.id === "town-delivered-box");
    assert.equal(start.debrisHidden, true);
    assert.equal(box(start).asset, townParcelAsset);
    assert.deepEqual(box(start).point, { x: 400, lane: 0.82 });
    assert.ok(box(middle).point.x > box(start).point.x);
    assert.ok(box(middle).point.lane < box(start).point.lane);
    assert.ok(box(held).point.x > box(middle).point.x);
    assert.ok(box(held).point.lane < box(middle).point.lane);
    assert.equal(held.actors[0].pose.asset, "/storybook-study/merchant-turn-carry-v2.webp");
    assert.equal(held.poses.aria.asset, "/storybook-study/aria-conversation-v1.webp");
    const receipt = frame(1500);
    assert.equal(box(receipt).asset, townParcelAsset);
    assert.ok(receipt.props.some((p) => p.id === "town-receipt"));
  }
});

test("the waiting recipient fades in as the carriers approach", () => {
  const view = { width: 374, height: 249 };
  for (const [appearance, expected] of [
    [0, 0],
    [0.5, 0.5],
    [2, 1],
  ]) {
    const battle = { stage: "forest", heroes: [] };
    townHandoff(battle, view, 400, undefined, appearance);
    assert.equal(battle.waterwayActions.actors[0].alpha, expected);
  }
});

test("carriers leave the handoff without a sudden jump in world position", () => {
  for (const view of [
    { width: 374, height: 249 },
    { width: 936, height: 624 },
  ]) {
    let state = start();
    const motion = new RoadMotion();
    let previous,
      checked = false;
    for (let i = 0; i < 500; i++) {
      state = settle(state, state.updatedAt + 50);
      const raw = chapterRoadFrame(
        {
          squad: state.squads[0],
          now: state.updatedAt,
          ready: true,
          paused: false,
          storybookHeroes: true,
        },
        false,
        1400,
        view,
      );
      const frame = motion.update(raw, "town", view.width, false, view.height);
      const heroes = frame.battle.heroes.filter((h) => h.id === "aria" || h.id === "leon");
      if (previous?.active && !frame.battle.townParcelHandoff) {
        for (const hero of heroes) {
          const old = previous.heroes.find((h) => h.id === hero.id);
          const dx = (hero.x - old.x) * roadScale(view.width, frame.battle.stage);
          const dy = (hero.lane - old.lane) * roadDepth(view.width, view.height);
          assert.ok(Math.hypot(dx, dy) <= 5.51, `${hero.id} moved too far at handoff end`);
        }
        checked = true;
        break;
      }
      previous = { active: !!frame.battle.townParcelHandoff, heroes };
    }
    assert.ok(checked);
  }
});

test("pausing and starting a different run do not advance or retain the handoff rejoin", () => {
  const sync = new TownHandoffSync();
  const view = { width: 374, height: 249 };
  const positions = new Map(),
    feet = new Map();
  const frame = (handoff, x) => ({
    stage: "forest",
    distance: 0,
    townParcelHandoff: handoff,
    heroes: [{ id: "leon", hp: 10, x, lane: 0.82, walking: false }],
  });
  sync.update(frame(true, 100), view, 0.05, false, false, positions, feet);
  const paused = frame(false, 500);
  sync.update(paused, view, 0, false, false, positions, feet);
  assert.equal(paused.heroes[0].x, 100);
  const restarted = frame(false, 500);
  sync.update(restarted, view, 0.05, false, true, positions, feet);
  assert.equal(restarted.heroes[0].x, 500);
});

test("the actual return waits for the receipt before fading to the next warehouse", () => {
  const view = { width: 936, height: 624 };
  let state = start(),
    receipt = false,
    partialFade = false,
    previousFade = 0,
    changed = false;
  const motion = new RoadMotion();
  for (let i = 0; i < 500; i++) {
    state = settle(state, state.updatedAt + 50);
    const raw = chapterRoadFrame(
      {
        squad: state.squads[0],
        now: state.updatedAt,
        ready: true,
        paused: false,
        storybookHeroes: true,
      },
      false,
      1400,
      view,
    );
    const frame = motion.update(raw, "town", view.width, false, view.height);
    receipt ||= !!frame.battle.waterwayActions?.props.some((p) => p.id === "town-receipt");
    if (frame.battle.townNextWarehouseX !== undefined) {
      assert.equal(frame.battle.townNextWarehouseX, raw.battle.gathering.x + 65);
      const fade = frame.battle.townTransitionFade ?? 0;
      if (fade > 0) assert.ok(receipt);
      partialFade ||= fade > 0 && fade < 1;
      previousFade = fade;
    } else if (previousFade > 0 && !frame.battle.townParcelHandoff) {
      changed = true;
      break;
    }
  }
  assert.ok(receipt && partialFade && previousFade >= 0.8 && changed);
});
