import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import {
  journeyCartGrip,
  journeyCartWidth,
  journeyCartObstacles,
  journeyCartWorkState,
  RoadJourneyCartMotion,
} from "../lib/road-journey-cart.ts";
import { roadScale, roadHeroSize, roadX } from "../lib/road-layout.ts";
import { partyOverlap } from "../lib/road-party-spacing.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";

for (const [quest, index] of [
  ["village-trade", 0],
  ["evening-trade-road", 1],
])
  for (const [width, height] of [
    [374, 249],
    [936, 624],
  ])
    test(`${quest} cart remains through pauses and rejoins both carriers at ${width}px`, () => {
      let state = act(
        testState(1000, index, 8, 10000),
        { type: "start", id: quest, readDeparture: true, value: false },
        1000,
      );
      const motion = new RoadMotion(),
        seen = new Set();
      let previous,
        last,
        identity,
        after = 0,
        attached = 0;
      for (let f = 0; f < 20000 && after < 300; f++) {
        const before = JSON.stringify(state),
          input = storybookAdventureInput({
            squad: state.squads[0],
            startQuest: quest,
            now: state.updatedAt,
            ready: true,
            paused: false,
            storybookHeroes: true,
          });
        const frame = chapterRoadFrame(input, false, 1400, { width, height });
        identity = roadPaintKey(state.squads[0].id, state.squads[0].run, frame.look, identity);
        last = motion.update(frame, identity.key, width, false, height);
        assert.equal(JSON.stringify(state), before);
        const cart = last.battle.journeyCart;
        assert.ok(cart, "task transitions must not remove the cart");
        seen.add(cart.phase);
        if (previous) {
          assert.ok(
            cart.x >= previous.x,
            "a later work point must not teleport the cart backwards",
          );
          assert.ok(cart.x - previous.x <= 4.351, "movement is bounded by elapsed drawing time");
          if (previous.phase === "parked" && cart.phase === "parked")
            assert.equal(cart.x, previous.x);
        }
        if (cart.phase === "moving") {
          attached++;
          for (const hero of last.battle.heroes.filter((h) => h.hp > 0)) {
            const grip = journeyCartGrip(hero, cart, { width, height }, last.battle.stage);
            assert.equal(
              hero.facing,
              1,
              `attached carriers face the shafts: ${JSON.stringify({ hero, cart, time: state.updatedAt, camera: last.battle.distance })}`,
            );
            assert.ok(
              Math.abs(grip.x - hero.x) * roadScale(width, last.battle.stage) <= 12.1,
              JSON.stringify({ hero: hero.id, x: hero.x, grip, cart }),
            );
            assert.ok(Math.abs(grip.lane - hero.lane) < 0.025);
          }
        }
        previous = { ...cart };
        if (!state.squads[0].run) after++;
        if (after > 0 && cart.x >= last.look.length) break;
        state = settle(state, state.updatedAt + 50);
      }
      assert.equal(state.done[quest], 1);
      assert.ok(
        last.battle.journeyCart.x >= last.look.length,
        "cart must reach arrival after the final battle",
      );
      assert.ok(attached > 10, `Carriers never rejoined: ${attached}`);
      assert.ok(seen.has("parked") && seen.has("moving"));
    });

test("idle views do not create a cart and a new quest does not inherit the previous run identity", () => {
  const look = { quest: "village-trade", storybookHeroes: true },
    run = { quest: "village-trade", started: 1000 };
  const active = roadPaintKey("test", run, look);
  assert.equal(roadPaintKey("test", null, look, active), active);
  assert.notEqual(
    roadPaintKey("test", null, { ...look, quest: "evening-trade-road" }, active).key,
    active.key,
  );
  assert.notEqual(roadPaintKey("test", { ...run, started: 2000 }, look, active).key, active.key);
  const state = testState(1000, 0, 8, 10000),
    input = storybookAdventureInput({
      squad: state.squads[0],
      startQuest: "village-trade",
      now: 1000,
      ready: true,
      storybookHeroes: true,
    });
  const drawn = new RoadMotion().update(chapterRoadFrame(input), "idle", 936, false, 624);
  assert.equal(drawn.battle.journeyCart, undefined);
});

test("desktop and phone retain the trade dialogue's cart-to-body ratio", async () => {
  const css = await readFile(new URL("../app/story-stage.css", import.meta.url), "utf8");
  const cartPercent = Number(/\.story-stage-cart \{[\s\S]*?width:\s*(\d+)%/.exec(css)[1]);
  const cellPercent = Number(/--stage-cell:\s*var\(--party-cell,\s*(\d+)cqw/.exec(css)[1]);
  const dialogueRatio = (cartPercent / cellPercent) * (192 / 144);
  for (const [width, height] of [
    [374, 249],
    [936, 624],
  ])
    assert.ok(
      Math.abs(
        journeyCartWidth({ width, height }) / (roadHeroSize(width, height) * 0.9) - dialogueRatio,
      ) < 1e-12,
    );
});

test("both trade carriers can reach their grips without entering the cart's ground footprint", () => {
  for (const view of [
    { width: 374, height: 249 },
    { width: 936, height: 624 },
  ]) {
    const cart = { x: 220, lane: 0.82, phase: "retrieving", returning: false };
    const battle = { journeyCart: cart, distance: 180, stage: "forest" };
    const obstacles = journeyCartObstacles(battle, view);
    for (const id of ["aria", "leon"]) {
      const foot = journeyCartGrip({ id }, cart, view, battle.stage);
      const point = {
        x: (roadX(foot.x, battle.distance, view.width, battle.stage) / view.width) * 560,
        lane: foot.lane,
      };
      assert.ok(obstacles.every((obstacle) => !partyOverlap(point, obstacle, { x: 0, lane: 0 })));
    }
  }
});

test("Brekka's carriers retain their cart poses when the next work node is already an inspection", () => {
  const cart = {
    asset: "/storybook-study/brekka-medical-cart-v1.webp",
    x: 450,
    lane: 0.82,
    phase: "moving",
    returning: false,
  };
  const gathering = { kind: "herb", task: "inspect", x: 800, remaining: 2, total: 2 };
  const state = { journeyCart: cart, gathering };
  const shown = journeyCartWorkState(state);
  assert.equal(shown.gathering.kind, "cargo");
  assert.equal(shown.gathering.task, "carry");
  assert.equal(state.gathering, gathering, "the simulation's work stays unchanged");
  assert.equal(
    journeyCartWorkState({ ...state, journeyCart: { ...cart, phase: "parked" } }).gathering,
    gathering,
  );
  assert.equal(
    journeyCartWorkState({ ...state, journeyCart: { ...cart, asset: undefined } }).gathering,
    gathering,
  );
});

test("carriers use walking poses only while the attached cart actually advances", () => {
  const view = { width: 936, height: 624 };
  const heroes = ["aria", "leon"].map((id) => ({
    id,
    hp: 10,
    x: 0,
    lane: 0.5,
    walking: true,
    facing: 1,
  }));
  const frame = {
    battle: {
      stage: "forest",
      time: 1000,
      distance: 500,
      phase: "journey",
      heroes,
      enemies: [],
      effects: [],
      gathering: { kind: "cargo", task: "carry", x: 435 },
    },
    look: {
      quest: "brekka-arrival",
      storybookHeroes: true,
      brekkaJourney: {},
      workers: [],
      length: 2000,
    },
  };
  const motion = new RoadJourneyCartMotion();
  const attached = motion.prepare(frame, "run", view);
  assert.equal(motion.finish(attached.battle, view).phase, "moving");
  const stopped = motion.prepare(
    { ...frame, battle: { ...frame.battle, time: 1050 } },
    "run",
    view,
  );
  assert.ok(stopped.battle.heroes.every((h) => !h.walking));
  const walking = motion.prepare(
    {
      ...frame,
      battle: { ...frame.battle, time: 1100, gathering: { ...frame.battle.gathering, x: 535 } },
    },
    "run",
    view,
  );
  assert.ok(walking.battle.journeyCart.x > stopped.battle.journeyCart.x);
  assert.ok(walking.battle.heroes.every((h) => h.walking));
});

test("reduced motion places an already completed cart at arrival without inventing an idle journey", () => {
  const state = act(
    testState(1000, 0, 8, 10000),
    { type: "start", id: "village-trade", readDeparture: true, value: false },
    1000,
  );
  const frame = chapterRoadFrame(
    storybookAdventureInput({
      squad: state.squads[0],
      startQuest: "village-trade",
      now: 1000,
      ready: true,
      storybookHeroes: true,
    }),
  );
  const motion = new RoadMotion();
  motion.update(frame, "same-run", 374, false, 249);
  const arrived = {
    battle: { ...frame.battle, phase: "arrived", gathering: null, time: 2000, enemies: [] },
    look: frame.look,
  };
  const drawn = motion.update(arrived, "same-run", 374, true, 249);
  assert.equal(drawn.battle.journeyCart.x, drawn.look.length);
});
