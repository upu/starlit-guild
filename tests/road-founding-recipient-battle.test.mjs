import test from "node:test";
import assert from "node:assert/strict";
import { FoundingRecipient, foundingRecipientWalk } from "../lib/road-founding-recipient.ts";
import { roadDepth, roadHeroSize, roadScale } from "../lib/road-layout.ts";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { foundingRoadBackground } from "../lib/road-journey-cart.ts";

for (const width of [390, 936])
  test(`recipient retreats from combat and returns before receiving at ${width}px`, () => {
    const view = { width, height: (width * 2) / 3 };
    const size = roadHeroSize(width, view.height),
      depth = roadDepth(width, view.height);
    const target = { x: 100, lane: 0.65 },
      recipient = new FoundingRecipient();
    const battle = {
      time: 0,
      distance: 0,
      stage: "forest",
      heroes: [{ id: "finn", hp: 10, x: 100, lane: 0.65 }],
      enemies: [{ id: 1, hp: 10, x: 110, lane: 0.7 }],
    };
    let result;
    battle.enemies = [];
    for (battle.time = 0; battle.time < 8000; battle.time += 100)
      result = recipient.update("walk", target, battle, view);
    assert.ok(result.ready);
    battle.enemies = [{ id: 1, hp: 10, x: 110, lane: 0.7 }];
    let previous = result.point,
      animated = false;
    for (let i = 0; i < 25; i++) {
      battle.time += 100;
      result = recipient.update("walk", target, battle, view);
      const step = Math.hypot(
        (result.point.x - previous.x) * roadScale(width),
        (result.point.lane - previous.lane) * depth,
      );
      assert.ok(step <= 8.01, `recipient moves at walking speed: ${step}`);
      assert.equal(result.ready, false);
      animated ||= result.walking && result.pose.asset === foundingRecipientWalk;
      previous = result.point;
    }
    assert.ok(animated, "the retreat has walking poses");
    for (const fighter of [...battle.heroes, ...battle.enemies])
      assert.ok((fighter.lane - result.point.lane) * depth >= size, "safe gap from each combatant");
    battle.enemies = [];
    for (let i = 0; i < 30 && !result.ready; i++) {
      battle.time += 100;
      result = recipient.update("walk", target, battle, view);
    }
    assert.ok(result.ready, "recipient returns after battle");
    assert.ok(Math.abs(result.point.lane - target.lane) * depth < 1);
  });

for (const width of [390, 936])
  test(`recipient stays visible if battle begins before pickup at ${width}px`, () => {
    const quest = "starlit-guild-founding";
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
    while (state.squads[0].run && state.squads[0].run.node < 1)
      state = settle(state, state.updatedAt + 100);
    const view = { width, height: (width * 2) / 3 },
      motion = new RoadMotion();
    let mode = "wait",
      count = 0,
      previous,
      checked = false;
    for (let i = 0; i < 800 && !checked; i++) {
      const frame = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: quest,
          now: state.updatedAt,
          ready: true,
          paused: false,
          storybookHeroes: true,
          backgroundOverride: foundingRoadBackground,
        },
        false,
        1400,
        view,
      );
      if (mode === "battle")
        frame.battle.enemies = [
          { id: 99, kind: "slime", x: 500, lane: 0.6, hp: 10, maxHp: 10, boss: false },
        ];
      const { battle, look } = motion.update(frame, "pre-pickup-combat", width, false, view.height);
      const recipient = battle.waterwayActions?.actors?.find(
        (a) => a.id === "founding-recipient-basket",
      );
      if (mode === "wait" && look.foundingDraft?.cue === "pickup" && recipient) {
        previous = recipient.point;
        mode = "battle";
      } else if (mode === "battle") {
        assert.ok(recipient, "recipient stays visible when fighting starts");
        const delta = Math.hypot(
          (recipient.point.x - previous.x) * roadScale(width),
          (recipient.point.lane - previous.lane) * roadDepth(width, view.height),
        );
        assert.ok(delta <= 8.01, "recipient walks rather than jumping");
        previous = recipient.point;
        if (++count === 15) checked = true;
      }
      state = settle(state, state.updatedAt + 100);
    }
    assert.ok(checked);
  });

for (const width of [390, 936])
  test(`fighters leave room for the retreating recipient at ${width}px`, () => {
    const quest = "starlit-guild-founding";
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
    while (state.squads[0].run && state.squads[0].run.node < 1)
      state = settle(state, state.updatedAt + 100);
    const view = { width, height: (width * 2) / 3 },
      motion = new RoadMotion();
    const size = roadHeroSize(width, view.height),
      scale = roadScale(width),
      depth = roadDepth(width, view.height);
    let mode = "carry",
      count = 0,
      enemyX,
      checked = false;
    for (let i = 0; i < 800 && !checked; i++) {
      const frame = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: quest,
          now: state.updatedAt,
          ready: true,
          paused: false,
          storybookHeroes: true,
          backgroundOverride: foundingRoadBackground,
        },
        false,
        1400,
        view,
      );
      if (mode === "battle")
        frame.battle.enemies = [
          { id: 99, kind: "slime", x: enemyX, lane: 0.6, hp: 10, maxHp: 10, boss: false },
        ];
      const { battle, look } = motion.update(frame, "recipient-battle", width, false, view.height);
      const recipient = battle.waterwayActions?.actors?.find(
        (a) => a.id === "founding-recipient-basket",
      );
      if (mode === "carry" && look.foundingDraft?.cue === "walk" && recipient) {
        enemyX = recipient.point.x + size / scale;
        mode = "battle";
      } else if (mode === "battle" && ++count >= 10 && recipient) {
        const basket = battle.waterwayActions.props.find((p) => p.id === "founding-basket");
        assert.ok(basket && basket.groundShadow, "landed basket has a ground shadow");
        const bottomLane = basket.point.lane + (basket.size * size * basket.groundShadow) / depth;
        assert.ok(
          Math.abs(basket.depth - bottomLane) < 1e-8,
          "ground sorting follows the basket's bottom",
        );
        for (const hero of battle.heroes.filter((h) => h.hp > 0)) {
          const dx = Math.abs(hero.x - recipient.point.x) * scale;
          const dy = Math.abs(hero.lane - recipient.point.lane) * depth;
          assert.ok(
            dx >= size * 0.6 || dy >= size * 0.82,
            `${hero.id} overlaps the recipient (${dx}, ${dy})`,
          );
          const basketDx = Math.abs(hero.x - basket.point.x) * scale;
          const basketDy = Math.abs(hero.lane - basket.point.lane) * depth;
          if (count >= 20)
            assert.ok(
              basketDx >= size * 0.58 || basketDy >= size * 0.8,
              `${hero.id} walks through the landed basket (${basketDx}, ${basketDy})`,
            );
        }
        if (count >= 20) checked = true;
      }
      state = settle(state, state.updatedAt + 100);
    }
    assert.ok(checked, "combat and retreat were shown");
  });
