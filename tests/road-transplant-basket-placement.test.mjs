import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { approach } from "../lib/road-motion-math.ts";
import { roadScale, roadX } from "../lib/road-layout.ts";
import { avoidPartyStep, partyFootClearance, partyOverlap } from "../lib/road-party-spacing.ts";
import {
  transplantBasketObstacles,
  transplantBasketPlacement,
} from "../lib/road-transplant-basket-placement.ts";

for (const view of [
  { width: 374, height: 249 },
  { width: 936, height: 624 },
]) {
  test(`basket placement clears the cart, both handles and companions at ${view.width}px`, () => {
    for (let seed = 0; seed < 12; seed++) {
      const now = 1000 + seed * 7300;
      let state = act(
        testState(now, storyStages.length, 18, 10000),
        { type: "start", id: "moss-transplant", readDeparture: true, value: false },
        now,
      );
      const motion = new RoadMotion();
      let battle;
      for (let i = 0; i < 4000 && state.squads[0].run; i++) {
        const raw = chapterRoadFrame(
          { squad: state.squads[0], now: state.updatedAt, ready: true, storybookHeroes: true },
          false,
          1400,
          view,
        );
        battle = motion.update(raw, `placement-${seed}`, view.width, false, view.height).battle;
        if (battle.gathering?.task === "carry" && battle.enemies.some((enemy) => enemy.hp > 0))
          break;
        state = settle(state, state.updatedAt + 50);
      }
      const lico = battle.heroes.find((hero) => hero.id === "lico");
      assert.equal(battle.gathering?.task, "carry");
      assert.ok(battle.enemies.some((enemy) => enemy.hp > 0));
      const before = JSON.stringify(battle);
      const chosen = transplantBasketPlacement(battle, lico, view);
      assert.ok(chosen, `no space at seed ${seed}`);
      assert.equal(JSON.stringify(battle), before);
      const foot = {
        x: (roadX(chosen.x, battle.distance, view.width, battle.stage) / view.width) * 560,
        lane: chosen.lane,
      };
      const gap = partyFootClearance(view.width, view.height);
      assert.ok(foot.x >= gap.x && foot.x <= 560 - gap.x);
      assert.ok(foot.lane >= 0.1 && foot.lane <= 1.3);
      assert.ok(
        transplantBasketObstacles(battle, view).every(
          (blocker) => !partyOverlap(foot, blocker, gap),
        ),
        `blocked at seed ${seed}`,
      );
      const target = { ...foot, id: "lico", facing: 1, fixed: true };
      let current = {
        x: (roadX(lico.x, battle.distance, view.width, battle.stage) / view.width) * 560,
        lane: lico.lane,
      };
      const blockers = transplantBasketObstacles(battle, view);
      for (let frame = 0; frame < 60; frame++) {
        const wanted = {
          x: approach(current.x, foot.x, 0.05, 280),
          lane: approach(current.lane, foot.lane, 0.05, 0.9),
        };
        current = avoidPartyStep(current, wanted, target, blockers, gap, 0.05);
      }
      assert.ok(
        Math.abs(current.x - foot.x) < 2 && Math.abs(current.lane - foot.lane) < 0.02,
        `cannot reach placement at seed ${seed}: ${JSON.stringify({ current, foot })}`,
      );
    }
  });
}

test("no safe place is selected when the visible road is occupied", () => {
  const view = { width: 374, height: 249 };
  const battle = {
    stage: "forest",
    distance: 0,
    gathering: null,
    heroes: [{ id: "lico", x: 0, lane: 0.7, facing: 1, hp: 1, maxHp: 1, walking: false }],
    enemies: [],
  };
  for (let screen = 0; screen <= view.width; screen += 10)
    for (let lane = 0.1; lane <= 1.31; lane += 0.1)
      battle.enemies.push({
        x: (screen - roadX(0, battle.distance, view.width, battle.stage)) / roadScale(view.width),
        lane,
        hp: 1,
      });
  assert.equal(transplantBasketPlacement(battle, battle.heroes[0], view), undefined);
});
