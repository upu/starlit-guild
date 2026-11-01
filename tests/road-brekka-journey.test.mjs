import { test } from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { BREKKA_VISIT_BANK } from "../lib/road-brekka-ledger.ts";
import { roadX, roadScale } from "../lib/road-layout.ts";
import { journeyCartGrip, journeyCartObstacles } from "../lib/road-journey-cart.ts";
import { partyFootClearance, partyOverlap } from "../lib/road-party-spacing.ts";

for (const [width, height] of [
  [936, 624],
  [390, 700],
])
  test(`rapid Brekka progress preserves the record scenes at ${width}x${height}`, () => {
    const quest = "brekka-arrival",
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
    let snapshot = state.squads[0],
      identity,
      last,
      lastCart,
      arrivalStarted = false,
      after = 0;
    const inspected = new Set(),
      shown = new Set(),
      notes = new Set(),
      brewery = new Set(),
      motion = new RoadMotion();
    for (let i = 0; i < 9000; i++) {
      if (state.squads[0].run) snapshot = state.squads[0];
      const input = {
        squad: state.squads[0].run ? state.squads[0] : snapshot,
        startQuest: quest,
        now: state.updatedAt + after * 50,
        ready: true,
        paused: false,
        storybookHeroes: true,
        backgroundOverride: BREKKA_VISIT_BANK,
        questComplete: !!state.done[quest],
      };
      const before = JSON.stringify(state);
      const frame = chapterRoadFrame(input, false, 1400, view);
      identity = roadPaintKey(snapshot.id, input.squad.run, frame.look, identity);
      last = motion.update(frame, identity.key, width, false, height);
      assert.equal(JSON.stringify(state), before);
      if (last.look.brekkaJourney.arrival && !arrivalStarted) {
        assert.equal(
          last.look.brekkaJourney.fade,
          1,
          "the final group is placed under a full fade",
        );
        arrivalStarted = true;
        lastCart = undefined;
      }
      if (last.look.brekkaLedger) assert.equal(last.battle.journeyCart, undefined);
      else if (last.battle.journeyCart) {
        const cart = last.battle.journeyCart;
        if (lastCart) {
          assert.ok(cart.x >= lastCart.x, "the same cart does not jump backwards between visits");
          assert.ok(cart.x - lastCart.x <= 4.351, "the cart advances only at walking speed");
        }
        lastCart = { ...cart };
      }
      if (last.look.brekkaLedger || last.look.brekkaNotes) {
        shown.add(last.look.brekkaJourney.displayNode);
        if (last.look.brekkaNotes) {
          notes.add(last.look.brekkaJourney.displayNode);
          assert.ok(last.battle.journeyCart, "the cart stays beside the group");
          assert.ok(last.battle.heroes.length >= 4, "the group remains present in the yard");
        } else brewery.add(last.look.brekkaJourney.displayNode);
        if (Object.keys(last.battle.waterwayActions.poses).length) {
          inspected.add(last.look.brekkaJourney.displayNode);
          if (last.look.brekkaNotes)
            assert.ok(
              last.battle.waterwayActions.props.some((p) => p.id === "brekka-notes-in-hand"),
            );
        }
      }
      if (state.done[quest] && last.look.brekkaJourney.visualComplete) break;
      if (state.done[quest]) after++;
      else {
        state = settle(state, state.updatedAt + 50);
        if (state.squads[0].run)
          state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
      }
    }
    assert.ok(state.done[quest] && last.look.brekkaJourney.visualComplete);
    assert.deepEqual([...shown], [2, 5, 8, 11, 14]);
    assert.deepEqual([...inspected], [2, 5, 8, 11, 14]);
    assert.deepEqual([...notes], [2, 5, 8, 11]);
    assert.deepEqual([...brewery], [14]);
    assert.ok(after * 50 < 90000);
    const idle = chapterRoadFrame(
      {
        squad: state.squads[0],
        startQuest: quest,
        now: state.updatedAt + (after + 1) * 50,
        ready: true,
        paused: false,
        storybookHeroes: true,
        backgroundOverride: BREKKA_VISIT_BANK,
        questComplete: true,
      },
      false,
      1400,
      view,
    );
    identity = roadPaintKey(snapshot.id, null, idle.look, identity);
    for (let i = 0; i < 100; i++) {
      const next = structuredClone(idle);
      next.battle.time += i * 50;
      const arrived = motion.update(next, identity.key, width, false, height);
      assert.equal(
        arrived.battle.journeyCart?.asset,
        "/storybook-study/brekka-medical-cart-v1.webp",
      );
      for (const hero of arrived.battle.heroes) {
        const x = roadX(hero.x, arrived.battle.distance, width, arrived.battle.stage);
        assert.ok(
          x >= width * 0.1 && x <= width * 0.9,
          `${hero.id} stays with the cart after arrival: ${x}`,
        );
      }
    }
  });

test("another available party member can inspect when Finn cannot act", () => {
  const quest = "brekka-arrival",
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
  let actor,
    posed = false;
  for (let elapsed = 0; elapsed < 12000; elapsed += 50) {
    const frame = chapterRoadFrame(
      {
        squad: state.squads[0],
        startQuest: quest,
        now: state.updatedAt + elapsed,
        ready: true,
        paused: false,
        storybookHeroes: true,
        backgroundOverride: BREKKA_VISIT_BANK,
      },
      false,
      1400,
      view,
    );
    frame.look.brekkaJourney.node = 2;
    frame.look.brekkaJourney.working = true;
    frame.battle.enemies = [];
    const finn = frame.battle.heroes.find((hero) => hero.id === "finn");
    finn.hp = 0;
    const out = motion.update(frame, "replacement", view.width, false, view.height);
    if (out.look.brekkaLedger || out.look.brekkaNotes) {
      actor = (out.look.brekkaLedger ?? out.look.brekkaNotes).actor;
      posed ||= !!out.battle.waterwayActions.poses.leon;
    }
  }
  assert.equal(actor, "leon");
  assert.equal(posed, true);
});

for (const [width, height] of [
  [936, 624],
  [390, 700],
])
  test(`Brekka's cart parks during battle and both carriers return at ${width}x${height}`, () => {
    const quest = "brekka-arrival",
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
    const frame = chapterRoadFrame(
      {
        squad: state.squads[0],
        startQuest: quest,
        now: state.updatedAt,
        ready: true,
        paused: false,
        storybookHeroes: true,
        backgroundOverride: BREKKA_VISIT_BANK,
      },
      false,
      1400,
      view,
    );
    const original = JSON.stringify(state),
      motion = new RoadMotion();
    const enemy = {
      id: 1,
      kind: "slime",
      x: frame.battle.distance + 350,
      lane: 0.74,
      hp: 100,
      maxHp: 100,
      boss: false,
    };
    let result;
    for (let time = 1000; time <= 9000; time += 50) {
      const fighting = time < 2000;
      const next = structuredClone(frame);
      next.battle.time = time;
      next.battle.enemies = fighting ? [enemy] : [];
      next.look.brekkaJourney.node = 0;
      next.look.brekkaJourney.working = true;
      result = motion.update(next, "brekka-cart", width, false, height);
      const cart = result.battle.journeyCart;
      assert.equal(cart.asset, "/storybook-study/brekka-medical-cart-v1.webp");
      if (time === 1000) {
        const obstacle = journeyCartObstacles(result.battle, view)[0];
        for (const hero of result.battle.heroes) {
          const p = {
            x: (roadX(hero.x, result.battle.distance, width, result.battle.stage) / width) * 560,
            lane: hero.lane,
          };
          assert.equal(
            partyOverlap(p, obstacle, partyFootClearance(width, height)),
            false,
            `${hero.id} begins outside the parked cart`,
          );
        }
      }
      if (fighting) assert.equal(cart.phase, "parked");
      if (!fighting && cart.phase === "moving") break;
    }
    assert.equal(result.battle.journeyCart.phase, "moving");
    for (const hero of result.battle.heroes.filter((h) => ["aria", "leon"].includes(h.id))) {
      const grip = journeyCartGrip(hero, result.battle.journeyCart, view, result.battle.stage);
      assert.ok(Math.abs(hero.x - grip.x) * roadScale(width, result.battle.stage) < 3, hero.id);
      assert.ok(Math.abs(hero.lane - grip.lane) < 0.025, hero.id);
    }
    assert.equal(JSON.stringify(state), original);
  });
