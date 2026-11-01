import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { waterwayBackgrounds, waterwayLayout } from "../lib/road-waterway-layout.ts";
import { journeyCartGrip, journeyCartWidth } from "../lib/road-journey-cart.ts";
import { RoadWheelRotation } from "../lib/road-wheel-rotation.ts";
import { tradeWheelLayout, tradeCartBodies } from "../lib/road-trade-cart-wheels.ts";
import { roadX, roadY, roadScale } from "../lib/road-layout.ts";
import { roadHeroSize } from "../lib/road-layout.ts";

for (const width of [374, 936])
  test(`restoration workyard keeps one cart and dry feet through all jobs at ${width}`, () => {
    const view = { width, height: (width * 2) / 3 },
      motion = new RoadMotion();
    let state = testState(
      0,
      storyStages.findIndex((q) => q.quest === "tower-restoration"),
      18,
      10000,
    );
    state = act(
      state,
      { type: "start", id: "tower-restoration", readDeparture: true, value: false },
      0,
    );
    const nodes = new Set(),
      phases = new Set();
    let cartSource = 500,
      delivered = 500,
      moving = 0,
      knee = 0;
    for (let time = 0; time < 180000 && state.squads[0].run; time += 50) {
      state = settle(state, time);
      if (!state.squads[0].run) break;
      const snapshot = JSON.stringify(state);
      const input = {
        squad: state.squads[0],
        startQuest: "tower-restoration",
        now: time,
        ready: true,
        paused: false,
        storybookHeroes: true,
        backgroundOverride: waterwayBackgrounds.blocked,
      };
      const frame = chapterRoadFrame(input, false, 1400, view);
      const { battle, look } = motion.update(frame, "restoration", width, false, view.height);
      assert.equal(JSON.stringify(state), snapshot);
      nodes.add(look.waterway.node);
      // Ambushes consume the following battle site while the work node remains active.
      if (state.squads[0].run.road?.ambushNode !== undefined)
        nodes.add(state.squads[0].run.road.ambushNode);
      phases.add(look.waterway.phase);
      assert.equal(battle.distance, 0);
      const layout = waterwayLayout(width, view.height),
        scale = layout.backdrop.width / 1536;
      const sourceX = (roadX(battle.journeyCart.x, 0, width) - layout.backdrop.x) / scale;
      assert.ok(
        sourceX >= cartSource - 1e-7,
        "cart never disappears or travels backwards between jobs",
      );
      if (look.waterway.node !== 2)
        assert.ok(Math.abs(sourceX - cartSource) < 1e-7, "parked cart stays fixed");
      cartSource = sourceX;
      delivered = Math.max(delivered, sourceX);
      for (const hero of battle.heroes) {
        const x = (roadX(hero.x, 0, width) - layout.backdrop.x) / scale;
        const y = (roadY(hero.lane, view.height, width) - layout.backdrop.y) / scale;
        assert.ok(x < 1240, "feet never enter the right channel");
        assert.ok(y > 400 && y < 1000, "feet remain in the dry work area");
        if (!hero.walking && battle.journeyCart.phase === "parked")
          assert.ok(
            !(x > sourceX - 84 && x < sourceX + 37 && y > 620 && y < 675),
            "settled boots must not appear on top of the parked cart bed",
          );
        for (const enemy of battle.enemies.filter((e) => e.hp > 0)) {
          const gap = Math.hypot(
            (hero.x - enemy.x) * roadScale(width),
            roadY(hero.lane, view.height, width) - roadY(enemy.lane, view.height, width),
          );
          assert.ok(
            gap > roadHeroSize(width, view.height) * 0.7,
            "slimes never spawn over inspecting actors",
          );
        }
        if (battle.journeyCart.phase === "moving") {
          const grip = journeyCartGrip(hero, battle.journeyCart, view, battle.stage);
          assert.ok(
            Math.abs(hero.x - grip.x) * roadScale(width) < 15,
            "moving hands remain at cart grips",
          );
          assert.ok(Math.abs(hero.lane - grip.lane) < 0.025);
          moving++;
        }
      }
      if (look.work?.frame === "waterway-branches" && look.workers.length === 2) knee++;
    }
    assert.equal(state.squads[0].run, null);
    assert.equal(nodes.size, 15);
    assert.deepEqual([...phases], ["blocked", "cleared"]);
    assert.ok(delivered > 899, `tool cart reaches worker side: ${delivered}`);
    assert.ok(moving > 20 && knee > 10);
  });

for (const width of [374, 936])
  test(`waterway tool wheels follow actual delivery and stop with the cart at ${width}`, () => {
    const view = { width, height: (width * 2) / 3 };
    const motion = new RoadMotion();
    const wheels = new RoadWheelRotation(tradeWheelLayout.front.diameter);
    let state = testState(
      0,
      storyStages.findIndex((q) => q.quest === "tower-restoration"),
      18,
      10000,
    );
    state = act(
      state,
      { type: "start", id: "tower-restoration", readDeparture: true, value: false },
      0,
    );
    let previous,
      rotated = false,
      stopped = false;
    for (let time = 0; time < 30000 && state.squads[0].run; time += 50) {
      state = settle(state, time);
      if (!state.squads[0].run) break;
      const frame = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: "tower-restoration",
          now: time,
          ready: true,
          paused: false,
          storybookHeroes: true,
          backgroundOverride: waterwayBackgrounds.blocked,
        },
        false,
        1400,
        view,
      );
      const { battle } = motion.update(frame, "wheel-delivery", width, false, view.height);
      const cart = battle.journeyCart;
      assert.ok(tradeCartBodies[cart.asset]);
      const angle = wheels.update(
        cart.x,
        battle.time,
        width,
        battle.stage,
        journeyCartWidth(view, cart),
        cart.phase === "moving",
        false,
      );
      if (
        previous &&
        cart.phase === "moving" &&
        previous.phase === "moving" &&
        cart.x > previous.x
      ) {
        assert.ok(angle > previous.angle);
        rotated = true;
      }
      if (
        previous &&
        cart.phase === "parked" &&
        previous.phase === "parked" &&
        cart.x === previous.x
      ) {
        assert.equal(angle, previous.angle);
        stopped = true;
      }
      previous = { x: cart.x, phase: cart.phase, angle };
    }
    assert.ok(rotated && stopped);
  });
