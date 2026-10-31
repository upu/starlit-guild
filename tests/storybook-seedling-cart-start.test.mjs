import { test } from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadCartSlot } from "../lib/road-cart-layout.ts";
import { roadHeroSize, roadX } from "../lib/road-layout.ts";
import { seedlingCartObstacle, seedlingCarrierPair } from "../lib/road-seedling-cart-start.ts";
import { avoidPartyStep, partyOverlap, partyFootClearance } from "../lib/road-party-spacing.ts";
import { partyTargets } from "../lib/road-motion-targets.ts";
import { syncEnemyTotals } from "../lib/combat.ts";
import { SeedlingEscortSide } from "../lib/road-seedling-escort.ts";

test("the seedling cart starts with Aria and Finn beside their grips at both viewport sizes", () => {
  for (const view of [
    { width: 936, height: 624 },
    { width: 374, height: 249 },
    { width: 1180, height: 790 },
    { width: 390, height: 740 },
  ]) {
    let state = act(
      testState(1000, storyStages.length, 18, 10000),
      { type: "start", id: "moss-transplant", readDeparture: true, value: false },
      1000,
    );
    const motion = new RoadMotion();
    let ready = false;
    for (let i = 0; i <= 30; i++) {
      const before = JSON.stringify(state);
      const frame = chapterRoadFrame(
        { squad: state.squads[0], now: state.updatedAt, ready: true, storybookHeroes: true },
        false,
        1400,
        view,
      );
      const drawn = motion.update(frame, "seedling-start", view.width, false, view.height);
      const cart = drawn.battle.gathering;
      assert.equal(cart.task, "carry");
      if (i === 0) {
        assert.ok(
          drawn.look.workers.includes("aria"),
          "Aria already pushes when the adventure opens",
        );
        assert.ok(
          drawn.look.workers.includes("finn"),
          "Finn already pulls when the adventure opens",
        );
      }
      for (const id of ["aria", "finn"]) {
        const hero = drawn.battle.heroes.find((member) => member.id === id);
        const slot = roadCartSlot(view, drawn.battle.stage, true, id === "finn", true, id);
        const actual = roadX(hero.x, drawn.battle.distance, view.width, drawn.battle.stage);
        const expected = roadX(
          cart.x + 65 + slot.offset,
          drawn.battle.distance,
          view.width,
          drawn.battle.stage,
        );
        assert.ok(
          Math.abs(actual - expected) < 15,
          `${id} left the grip at ${i * 100}ms (${view.width}px)`,
        );
        assert.ok(Math.abs(hero.lane - slot.lane) < 0.03);
      }
      ready ||= drawn.look.workers.includes("aria") && drawn.look.workers.includes("finn");
      assert.equal(JSON.stringify(state), before, "presentation must not change the save");
      state = settle(state, state.updatedAt + 100);
    }
    assert.ok(ready, "both carriers can reach their work poses");
  }
});

test("an exhausted or paralyzed carrier is not forced into the opening grips", () => {
  for (const id of ["aria", "finn"])
    for (const unavailable of ["exhausted", "paralyzed"]) {
      const state = act(
        testState(1000, storyStages.length, 40, 10000),
        { type: "start", id: "moss-transplant", readDeparture: true, value: false },
        1000,
      );
      const run = state.squads[0].run;
      if (unavailable === "exhausted") run.health[id].hp = 0;
      else run.actors.find((actor) => actor.hero === id).paralyzedUntil = 100000;
      const before = JSON.stringify(state);
      const frame = chapterRoadFrame({
        squad: state.squads[0],
        now: state.updatedAt,
        ready: true,
        storybookHeroes: true,
      });
      assert.equal(!!seedlingCarrierPair(frame), false);
      assert.ok(!frame.look.workers.includes(id));
      assert.equal(JSON.stringify(state), before);
    }
});

test("Mira and Lico rejoin near the cart after different battle positions", () => {
  const licoSides = new Set();
  for (const view of [
    { width: 936, height: 624 },
    { width: 374, height: 249 },
  ]) {
    for (let seed = 0; seed < 12; seed++) {
      const start = 1000 + seed * 7300;
      let state = act(
        testState(start, storyStages.length, 18, 10000),
        { type: "start", id: "moss-transplant", readDeparture: true, value: false },
        start,
      );
      for (let i = 0; i < 3000; i++) {
        const run = state.squads[0].run;
        if (run.phase === "work" && run.enemies?.some((enemy) => enemy.hp > 0)) break;
        state = settle(state, state.updatedAt + 100);
      }
      const run = state.squads[0].run;
      assert.ok(run.enemies.some((enemy) => enemy.hp > 0));
      for (const enemy of run.enemies) if (enemy.hp > 0) enemy.hp = 1;
      syncEnemyTotals(run);
      const motion = new RoadMotion();
      let fought = false,
        firstReturn,
        picked,
        basketPhase,
        samples = 0,
        last,
        lastLico;
      const limit = state.updatedAt + 15000;
      for (let now = state.updatedAt; now < limit && state.squads[0].run; now += 50) {
        state = settle(state, now);
        if (!state.squads[0].run) break;
        const saved = JSON.stringify(state);
        const frame = chapterRoadFrame(
          { squad: state.squads[0], now, ready: true, storybookHeroes: true },
          false,
          1400,
          view,
        );
        const { battle } = motion.update(
          frame,
          "seedling-recovery",
          view.width,
          false,
          view.height,
        );
        assert.equal(JSON.stringify(state), saved);
        const enemy = battle.enemies.some((item) => item.hp > 0);
        fought ||= enemy;
        if (!fought || enemy || battle.gathering?.task !== "carry") continue;
        firstReturn ??= now;
        const basket = battle.handheld?.find((item) => item.hero === "lico");
        if (basketPhase === "lift" && basket?.phase === "held") picked ??= now;
        basketPhase = basket?.phase;
        if (picked && now - picked > 2500 && now - firstReturn > 2500) break;
        const mira = battle.heroes.find((hero) => hero.id === "mira");
        const intended = frame.battle.heroes.find((hero) => hero.id === "mira");
        const x = roadX(mira.x, battle.distance, view.width, battle.stage);
        const cartX = roadX(battle.gathering.x + 65, battle.distance, view.width, battle.stage);
        if (now - firstReturn <= 2500) {
          assert.ok(
            Math.abs(x - cartX) < roadHeroSize(view.width, view.height) * 2.1,
            `Mira took a long detour at ${view.width}, seed ${seed}`,
          );
          const lag = battle.gathering.x - frame.battle.gathering.x;
          last = {
            x: Math.abs(x - roadX(intended.x + lag, battle.distance, view.width, battle.stage)),
            lane: Math.abs(mira.lane - intended.lane),
          };
          samples++;
        }
        const lico = battle.heroes.find((hero) => hero.id === "lico");
        const licoDefault = frame.battle.heroes.find((hero) => hero.id === "lico");
        const licoX = roadX(lico.x, battle.distance, view.width, battle.stage);
        const lag = battle.gathering.x - frame.battle.gathering.x;
        const left = {
          x: Math.abs(
            licoX - roadX(licoDefault.x + lag, battle.distance, view.width, battle.stage),
          ),
          lane: Math.abs(lico.lane - licoDefault.lane),
          side: "left",
        };
        const right = {
          x: Math.abs(licoX - cartX - roadHeroSize(view.width, view.height) * 1.25),
          lane: Math.abs(lico.lane - 0.4),
          side: "right",
        };
        if (picked && now - picked <= 2500) {
          lastLico = left.x / 10 + left.lane < right.x / 10 + right.lane ? left : right;
          assert.ok(
            Math.abs(licoX - cartX) < roadHeroSize(view.width, view.height) * 2.1,
            `Lico took a long detour after pickup at ${view.width}, seed ${seed}`,
          );
        }
      }
      assert.ok(samples >= 30, `no return sequence at ${view.width}, seed ${seed}`);
      assert.ok(
        picked && picked - firstReturn < 2500,
        `basket pickup was delayed at ${view.width}, seed ${seed}`,
      );
      assert.ok(
        last.x < 3 && last.lane < 0.03,
        `Mira did not rejoin at ${view.width}, seed ${seed}`,
      );
      assert.ok(
        lastLico && lastLico.x < 3 && lastLico.lane < 0.03,
        `Lico did not rejoin at ${view.width}, seed ${seed}`,
      );
      licoSides.add(lastLico.side);
    }
  }
  assert.deepEqual(licoSides, new Set(["left", "right"]), "both sides are exercised");
});

test("escorts can walk around the seedling cart while its carriers retain access", () => {
  for (const view of [
    { width: 936, height: 624 },
    { width: 374, height: 249 },
  ]) {
    const state = act(
      testState(1000, storyStages.length, 18, 10000),
      { type: "start", id: "moss-transplant", readDeparture: true, value: false },
      1000,
    );
    const frame = chapterRoadFrame(
      { squad: state.squads[0], now: 1000, ready: true, storybookHeroes: true },
      false,
      1400,
      view,
    );
    const before = JSON.stringify(state);
    const obstacle = seedlingCartObstacle(frame.battle, frame.look, view);
    assert.ok(obstacle);
    assert.deepEqual(obstacle.ignore, ["aria", "finn"]);
    const targets = partyTargets(frame, frame.battle.distance, view.width, view.height, false);
    for (const target of targets)
      assert.equal(!!target.avoidEscort, ["mira", "lico"].includes(target.id));
    const gap = partyFootClearance(view.width, view.height);
    const start = { x: obstacle.x + obstacle.clearance.x + 8, lane: obstacle.lane };
    const target = {
      id: "mira",
      x: obstacle.x - obstacle.clearance.x - 8,
      lane: obstacle.lane,
      facing: -1,
      fixed: false,
    };
    let position = start;
    for (let i = 0; i < 400; i++) {
      position = avoidPartyStep(position, target, target, [obstacle], gap, 0.05);
      assert.ok(!partyOverlap(position, obstacle, gap), "escort cannot pass through the cart");
      if (Math.abs(position.x - target.x) < 1 && Math.abs(position.lane - target.lane) < 0.01)
        break;
    }
    assert.ok(Math.abs(position.x - target.x) < 1, "escort reaches the other side");
    assert.ok(Math.abs(position.lane - target.lane) < 0.01);
    assert.equal(JSON.stringify(state), before);
    const other = { ...frame.look, quest: "another-quest" };
    assert.equal(seedlingCartObstacle(frame.battle, other, view), undefined);
    const fighting = { ...frame.battle, enemies: [{ hp: 1 }] };
    assert.equal(seedlingCartObstacle(fighting, frame.look, view), undefined);
    assert.ok(
      partyTargets(
        { ...frame, battle: fighting },
        fighting.distance,
        view.width,
        view.height,
        false,
      ).every((target) => !target.avoidEscort),
    );
  }
});

test("Lico keeps the chosen cart side through resizing and chooses again after a battle", () => {
  const state = act(
    testState(1000, storyStages.length, 18, 10000),
    { type: "start", id: "moss-transplant", readDeparture: true, value: false },
    1000,
  );
  const input = { squad: state.squads[0], now: 1000, ready: true, storybookHeroes: true };
  const side = new SeedlingEscortSide();
  const sample = (view) => {
    const frame = chapterRoadFrame(input, false, 1400, view);
    return {
      frame,
      targets: partyTargets(frame, frame.battle.distance, view.width, view.height, false),
      cart: seedlingCartObstacle(frame.battle, frame.look, view),
    };
  };
  const pc = { width: 936, height: 624 },
    mobile = { width: 374, height: 249 };
  const large = sample(pc),
    small = sample(mobile);
  const chosen = side
    .adjust(
      large.targets,
      large.frame.battle,
      large.frame.look,
      pc,
      { x: large.cart.x + 20, lane: 0.8 },
      false,
    )
    .find((target) => target.id === "lico");
  assert.ok(chosen.x > large.cart.x);
  const resized = side
    .adjust(small.targets, small.frame.battle, small.frame.look, mobile, undefined, false)
    .find((target) => target.id === "lico");
  assert.ok(resized.x > small.cart.x, "viewport reset must not switch sides");
  side.adjust(
    small.targets,
    { ...small.frame.battle, enemies: [{ hp: 1 }] },
    small.frame.look,
    mobile,
    undefined,
    false,
  );
  const after = side
    .adjust(
      small.targets,
      small.frame.battle,
      small.frame.look,
      mobile,
      { x: small.cart.x - 20, lane: 0.8 },
      false,
    )
    .find((target) => target.id === "lico");
  assert.ok(after.x < small.cart.x, "the next battle may select the closer side");
});
