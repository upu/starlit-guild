import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { foundingRoadBackground } from "../lib/road-journey-cart.ts";
import { roadDepth, roadHeroSize, roadScale, roadX } from "../lib/road-layout.ts";

function start() {
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
  return state;
}

for (const width of [390, 936])
  for (const interruption of ["rest", "battle", "down"])
    for (const pickupFrame of [1, 2, 3])
      test(`basket survives a second ${interruption} during pickup frame ${pickupFrame} at ${width}px`, () => {
        let state = start(),
          mode = "carry",
          frames = 0,
          previous,
          delivered = false,
          diagnostic;
        const view = { width, height: (width * 2) / 3 },
          motion = new RoadMotion();
        for (let i = 0; i < 1300 && !delivered; i++) {
          const before = JSON.stringify(state);
          const frame = chapterRoadFrame(
            {
              squad: state.squads[0],
              startQuest: "starlit-guild-founding",
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
          if (mode === "first" || mode === "second") {
            if (mode === "first" || interruption === "rest") frame.battle.phase = "rest";
            else if (interruption === "battle")
              frame.battle.enemies = [
                { id: 99, kind: "slime", x: 500, lane: 0.6, hp: 10, maxHp: 10, boss: false },
              ];
            else frame.battle.heroes.find((h) => h.id === "finn").hp = 0;
          }
          if (interruption === "down" && mode === "resume")
            frame.battle.heroes.find((h) => h.id === "finn").hp = 0;
          const { battle, look } = motion.update(
            frame,
            "repeat-recovery",
            width,
            false,
            view.height,
          );
          assert.equal(JSON.stringify(state), before, "animation does not mutate the saved game");
          const cue = look.foundingDraft?.cue;
          const prop = battle.waterwayActions?.props.find((p) => p.id === "founding-basket");
          if (mode === "resume" && cue === "walk" && prop)
            assert.equal(prop.groundShadow, undefined, "carried basket has no ground shadow");
          if (cue === "recover") {
            const hero = battle.heroes.find((h) => h.id === look.foundingDraft.actor);
            diagnostic = {
              hero,
              cart: battle.journeyCart,
              distance: battle.distance,
              prop: prop?.point,
            };
            if (mode === "resume" && prop) {
              const screenX = roadX(prop.point.x, battle.distance, width, battle.stage);
              assert.ok(
                screenX >= 0 && screenX <= width,
                `recovering basket is visible: ${screenX}`,
              );
            }
          }
          if (mode === "carry" && cue === "walk" && prop) {
            mode = "first";
            frames = 0;
          } else if (mode === "first" && ++frames === 5) mode = "lift";
          else if (
            mode === "lift" &&
            battle.waterwayActions?.poses.finn?.asset?.includes("finn-recover-offer") &&
            battle.waterwayActions.poses.finn.frame === pickupFrame
          ) {
            mode = "second";
            frames = 0;
          } else if (mode === "second") {
            assert.ok(prop && previous, "interrupted basket stays visible");
            if (frames === 0)
              assert.deepEqual(prop.point, previous, "drop starts at the last visible hand");
            if (++frames === 5) mode = "resume";
          } else if (mode === "resume" && cue === "return") delivered = true;
          if (mode === "resume" && prop && previous) {
            const delta = Math.hypot(
              (prop.point.x - previous.x) * roadScale(width, battle.stage),
              (prop.point.lane - previous.lane) * roadDepth(width, view.height),
            );
            assert.ok(
              delta <= roadHeroSize(width, view.height) * 0.7,
              `basket moves ${delta}px in 100ms`,
            );
          }
          if (prop) previous = { ...prop.point };
          state = settle(state, state.updatedAt + 100);
        }
        assert.ok(delivered, `basket reaches its recipient: ${mode} ${JSON.stringify(diagnostic)}`);
      });

for (const width of [390, 936])
  test(`a battle remains visible when gameplay has moved ahead of a queued handoff at ${width}px`, () => {
    let state = start(),
      mode = "carry",
      ticks = 0,
      checked = false,
      recovered = false,
      previousCamera;
    const view = { width, height: (width * 2) / 3 },
      motion = new RoadMotion();
    for (let i = 0; i < 900 && !recovered; i++) {
      const frame = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: "starlit-guild-founding",
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
      if (mode === "battle") {
        frame.battle.distance += 500;
        frame.battle.heroes = frame.battle.heroes.map((hero) => ({ ...hero, x: hero.x + 500 }));
        frame.battle.enemies = [
          {
            id: 99,
            kind: "slime",
            x: frame.battle.distance + 110,
            lane: 0.6,
            hp: 10,
            maxHp: 10,
            boss: false,
          },
        ];
      }
      const { battle, look } = motion.update(frame, "battle-camera", width, false, view.height);
      if (previousCamera !== undefined)
        assert.ok(
          Math.abs(battle.distance - previousCamera) <= 36.01,
          "camera pans rather than jumping",
        );
      previousCamera = battle.distance;
      if (mode === "carry" && look.foundingDraft?.cue === "walk") mode = "battle";
      else if (mode === "battle" && ++ticks === 45) {
        const enemyX = roadX(battle.enemies[0].x, battle.distance, width, battle.stage);
        assert.ok(enemyX >= 0 && enemyX <= width, `enemy is visible during combat: ${enemyX}`);
        checked = true;
        mode = "resume";
      } else if (mode === "resume" && look.foundingDraft?.cue === "return") recovered = true;
      state = settle(state, state.updatedAt + 100);
    }
    assert.ok(checked);
    assert.ok(recovered, "the queued handoff resumes after the distant fight");
  });
