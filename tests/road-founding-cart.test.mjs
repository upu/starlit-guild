import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import {
  foundingCartAsset,
  foundingRoadBackground,
  journeyCartGrip,
  journeyCartWidth,
  RoadJourneyCartMotion,
} from "../lib/road-journey-cart.ts";
import { roadDepth, roadHeroSize, roadScale, roadX } from "../lib/road-layout.ts";
import { foundingGrip } from "../lib/road-founding-grip.ts";
import { FoundingOpening } from "../lib/road-founding-opening.ts";

const quest = "starlit-guild-founding";
function start() {
  let state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === quest),
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

for (const width of [390, 936])
  test(`Finn starts at the cart grip before releasing it at ${width}px`, () => {
    const view = { width, height: (width * 2) / 3 };
    const motion = new RoadMotion();
    let state = start();
    let last;
    for (let elapsed = 0; elapsed <= 1200; elapsed += 100) {
      const before = JSON.stringify(state);
      const input = {
        squad: state.squads[0],
        startQuest: quest,
        now: state.updatedAt,
        ready: true,
        paused: false,
        storybookHeroes: true,
        backgroundOverride: foundingRoadBackground,
      };
      const frame = motion.update(
        chapterRoadFrame(input, false, 1400, view),
        "opening",
        width,
        false,
        view.height,
      );
      const finn = frame.battle.heroes.find((hero) => hero.id === "finn");
      const grip = journeyCartGrip(finn, frame.battle.journeyCart, view, frame.battle.stage);
      if (elapsed < 800) {
        assert.equal(frame.look.foundingDraft.openingGrip, true);
        assert.ok(Math.abs(finn.x - grip.x) * roadScale(width) < 0.01);
        assert.ok(Math.abs(finn.lane - grip.lane) * roadDepth(width, view.height) < 0.01);
        assert.equal(finn.walking, false);
      } else assert.equal(frame.look.foundingDraft.openingGrip, undefined);
      if (last) {
        assert.ok(Math.abs(finn.x - last.x) * roadScale(width) < 20);
        assert.ok(Math.abs(finn.lane - last.lane) * roadDepth(width, view.height) < 20);
      }
      last = finn;
      assert.equal(JSON.stringify(state), before);
      state = settle(state, state.updatedAt + 100);
    }
  });

test("the opening grip is skipped when Finn cannot safely hold the cart", () => {
  const state = start();
  const view = { width: 390, height: 260 };
  const input = {
    squad: state.squads[0],
    startQuest: quest,
    now: state.updatedAt,
    ready: true,
    paused: false,
    storybookHeroes: true,
    backgroundOverride: foundingRoadBackground,
  };
  const base = new RoadJourneyCartMotion().prepare(
    chapterRoadFrame(input, false, 1400, view),
    "opening",
    view,
  );
  for (const condition of ["rest", "down", "paralyzed", "worker", "later", "resumed", "reduced"]) {
    const frame = structuredClone(base);
    const finn = frame.battle.heroes.find((hero) => hero.id === "finn");
    if (condition === "rest") frame.battle.phase = "rest";
    if (condition === "down") finn.hp = 0;
    if (condition === "paralyzed") finn.paralyzed = true;
    if (condition === "worker") frame.look.foundingDraft.actor = "finn";
    if (condition === "later") frame.look.foundingDraft.node = 1;
    if (condition === "resumed") frame.look.foundingDraft.departureAge = 5000;
    const result = new FoundingOpening().prepare(frame, condition, view, condition === "reduced");
    assert.equal(result.look.foundingDraft.openingGrip, undefined, condition);
  }
  const opening = new FoundingOpening();
  assert.equal(
    opening.prepare(base, "interrupted", view, false).look.foundingDraft.openingGrip,
    true,
  );
  const combat = structuredClone(base);
  combat.battle.enemies = [{ hp: 1 }];
  combat.battle.time += 100;
  assert.equal(
    opening.prepare(combat, "interrupted", view, false).look.foundingDraft.openingGrip,
    undefined,
  );
  const resumed = structuredClone(base);
  resumed.battle.time += 200;
  assert.equal(
    opening.prepare(resumed, "interrupted", view, false).look.foundingDraft.openingGrip,
    undefined,
  );
});

for (const width of [390, 936])
  test(`the draft keeps the same cart through stopping and moving at ${width}px`, () => {
    const view = { width, height: (width * 2) / 3 };
    const motion = new RoadMotion();
    let state = start(),
      parked = false,
      moving = false,
      visibleParty = false,
      cartX;
    for (let i = 0; i < 1600 && !(parked && moving && visibleParty); i++) {
      const before = JSON.stringify(state);
      const input = {
        squad: state.squads[0],
        startQuest: quest,
        now: state.updatedAt,
        ready: true,
        paused: false,
        storybookHeroes: true,
        backgroundOverride: foundingRoadBackground,
      };
      const frame = motion.update(
        chapterRoadFrame(input, false, 1400, view),
        "founding",
        width,
        false,
        view.height,
      );
      assert.equal(JSON.stringify(state), before);
      const cart = frame.battle.journeyCart;
      assert.ok(cart);
      assert.equal(cart.asset, foundingCartAsset);
      if (cart.phase === "parked" && frame.battle.gathering) {
        parked = true;
        assert.ok(
          Math.abs(cart.x - (frame.battle.gathering.x + 65)) * roadScale(width) >
            journeyCartWidth(view, cart),
        );
      }
      if (cart.phase === "moving") {
        const finn = frame.battle.heroes.find((hero) => hero.id === "finn");
        const grip = journeyCartGrip(finn, cart, view, frame.battle.stage);
        if (
          Math.abs(finn.x - grip.x) * roadScale(width) < 2 &&
          Math.abs(finn.lane - grip.lane) * roadDepth(width, view.height) < 2
        ) {
          assert.deepEqual(frame.look.frontCarriers, ["finn"]);
          moving = true;
          const figure = (roadHeroSize(width, view.height) * 0.9) / 144;
          assert.ok(
            Math.abs(
              (finn.x - cart.x) * roadScale(width) -
                (96 - foundingGrip.handX) * figure -
                foundingGrip.cartX * journeyCartWidth(view, cart),
            ) < 2,
          );
          assert.ok(
            Math.abs(
              (finn.lane - cart.lane) * roadDepth(width, view.height) -
                (176 - foundingGrip.handY) * figure -
                foundingGrip.cartY * journeyCartWidth(view, cart),
            ) < 2,
          );
          visibleParty ||= frame.battle.heroes.every((hero) => {
            const x = roadX(hero.x, frame.battle.distance, width, frame.battle.stage);
            return x >= 10 && x <= width - 10;
          });
        }
      }
      if (cartX !== undefined) assert.ok(Math.abs(cart.x - cartX) < 20, "cart must not jump");
      cartX = cart.x;
      state = settle(state, state.updatedAt + 100);
    }
    assert.ok(parked, "work must stop the cart");
    assert.ok(moving, "Finn must reach the cart and move it");
    assert.ok(visibleParty, "the travelling party and cart must fit in the viewport");
  });

test("the draft cart waits if Finn is unable to move or the group rests", () => {
  const state = start();
  const view = { width: 936, height: 624 };
  const input = {
    squad: state.squads[0],
    startQuest: quest,
    now: state.updatedAt,
    ready: true,
    paused: false,
    storybookHeroes: true,
    backgroundOverride: foundingRoadBackground,
  };
  const original = chapterRoadFrame(input, false, 1400, view);
  for (const reason of ["rest", "down", "paralyzed", "missing"]) {
    const frame = structuredClone(original);
    frame.battle.gathering = null;
    const finn = frame.battle.heroes.find((hero) => hero.id === "finn");
    if (reason === "rest") frame.battle.phase = "rest";
    if (reason === "down") finn.hp = 0;
    if (reason === "paralyzed") finn.paralyzed = true;
    if (reason === "missing")
      frame.battle.heroes = frame.battle.heroes.filter((hero) => hero.id !== "finn");
    const motion = new RoadJourneyCartMotion();
    const first = motion.prepare(frame, reason, view);
    const later = structuredClone(frame);
    later.battle.time += 1000;
    const next = motion.prepare(later, reason, view);
    assert.equal(next.battle.journeyCart.phase, "parked", reason);
    assert.equal(next.battle.journeyCart.x, first.battle.journeyCart.x, reason);
  }
});

test("the cart experiment does not activate on the ordinary or alternate views", () => {
  const state = start();
  const view = { width: 936, height: 624 };
  for (const options of [
    { storybookHeroes: false, backgroundOverride: foundingRoadBackground },
    { storybookHeroes: true, backgroundOverride: "/custom.png" },
    {},
  ]) {
    const input = {
      squad: state.squads[0],
      startQuest: quest,
      now: state.updatedAt,
      ready: true,
      paused: false,
      ...options,
    };
    const frame = chapterRoadFrame(input, false, 1400, view);
    assert.equal(
      new RoadJourneyCartMotion().prepare(frame, "ordinary", view).battle.journeyCart,
      undefined,
    );
  }
});
