import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { foundingRoadBackground, journeyCartWidth } from "../lib/road-journey-cart.ts";
import { roadDepth, roadHeroSize, roadScale, roadX, roadY } from "../lib/road-layout.ts";
import { lindeCouriers } from "../lib/road-linde-couriers.ts";
import { waterwayPalm } from "../lib/road-waterway-contacts.ts";
import { foundingTurnArt, foundingTurnAssets } from "../lib/road-founding-carry-turn.ts";

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

function distance(point, start, end) {
  const dx = end.x - start.x,
    dy = end.y - start.y;
  const t = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)),
  );
  return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy);
}

function clearance(hero, cart, battle, view) {
  const size = journeyCartWidth(view, cart);
  const x = roadX(cart.x, battle.distance, view.width, battle.stage);
  const y = roadY(cart.lane, view.height, view.width);
  const point = {
    x: roadX(hero.x, battle.distance, view.width, battle.stage),
    y: roadY(hero.lane, view.height, view.width),
  };
  const project = ([px, py]) => ({
    x: x + size * (px / 512 - 0.5),
    y: y + (size * (py / 320 - 292 / 312) * 312) / 504,
  });
  return Math.min(
    ...[
      [
        [250, 214],
        [414, 297],
      ],
      [
        [330, 162],
        [498, 226],
      ],
      [
        [414, 297],
        [498, 226],
      ],
    ].map(([a, b]) => distance(point, project(a), project(b))),
  );
}

for (const width of [390, 936])
  for (const interruption of ["rest", "battle", "down", "aria-replacement", "mira-replacement"])
    for (const trigger of [0, 10, 20])
      test(`basket recovery avoids shafts at ${width}px after ${interruption} during step ${trigger}`, () => {
        let state = start();
        const view = { width, height: (width * 2) / 3 },
          motion = new RoadMotion();
        let mode = "normal",
          walk = 0,
          interrupted = 0,
          delivered = false,
          last;
        const stages = new Set();
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
          if (mode === "interrupt" && interruption === "rest") frame.battle.phase = "rest";
          if (mode === "interrupt" && interruption === "battle")
            frame.battle.enemies = [
              { id: 99, kind: "slime", x: 500, lane: 0.6, hp: 10, maxHp: 10, boss: false },
            ];
          if (mode !== "normal") {
            const unavailable =
              {
                down: ["finn"],
                "aria-replacement": ["finn", "leon"],
                "mira-replacement": ["finn", "leon", "aria"],
              }[interruption] ?? [];
            for (const id of unavailable) frame.battle.heroes.find((h) => h.id === id).hp = 0;
          }
          const { battle, look } = motion.update(
            frame,
            "recovery-route",
            width,
            false,
            view.height,
          );
          assert.equal(JSON.stringify(state), before);
          const cue = look.foundingDraft?.cue;
          const prop = battle.waterwayActions?.props.find((p) => p.id === "founding-basket");
          if (mode === "normal" && cue === "walk" && prop && walk++ === trigger) mode = "interrupt";
          else if (mode === "interrupt" && ++interrupted === 5) mode = "resume";
          else if (mode === "resume") {
            stages.add(cue);
            const hero = battle.heroes.find((h) => h.id === look.foundingDraft?.actor);
            if (cue === "recover" && interruption.endsWith("-replacement"))
              assert.equal(hero?.id, interruption === "aria-replacement" ? "aria" : "mira");
            if (hero && battle.journeyCart)
              assert.ok(
                clearance(hero, battle.journeyCart, battle, view) >=
                  roadHeroSize(width, view.height) * 0.16,
                `foot at step ${i}: ${JSON.stringify({ cue, hero, cart: battle.journeyCart })}`,
              );
            assert.ok(prop, `basket remains visible at ${cue}, step ${i}`);
            if (cue === "walk" && hero) {
              const art = lindeCouriers[hero.id];
              const pose = battle.waterwayActions?.poses[hero.id];
              const turning = foundingTurnAssets.includes(pose?.asset);
              const palm = turning
                ? foundingTurnArt[hero.id].palms[Number(pose.frame === 2)]
                : hero.walking
                  ? art.walkPalm
                  : art.offerPalm;
              const hand = waterwayPalm(hero, palm, hero.facing, view);
              const offset = Math.hypot(
                (hand.x - prop.point.x) * roadScale(width, battle.stage),
                (hand.lane - prop.point.lane) * roadDepth(width, view.height),
              );
              if (turning)
                assert.ok(offset < 1, `basket must follow the turning hands at step ${i}`);
              else
                assert.ok(
                  offset <= roadHeroSize(width, view.height) * 0.5,
                  `basket is ${offset}px from the hand at step ${i}`,
                );
            }
            if (last) {
              const delta = Math.hypot(
                (prop.point.x - last.x) * roadScale(width, battle.stage),
                (prop.point.lane - last.lane) * roadDepth(width, view.height),
              );
              const foot =
                hero && last.foot
                  ? Math.hypot(
                      (hero.x - last.foot.x) * roadScale(width, battle.stage),
                      (hero.lane - last.foot.lane) * roadDepth(width, view.height),
                    )
                  : 0;
              assert.ok(
                delta <= foot + roadHeroSize(width, view.height) * 0.3,
                `basket jumps ${delta}px while its carrier moves ${foot}px at ${cue}, step ${i}`,
              );
            }
            last = {
              ...prop.point,
              cue,
              facing: hero?.facing,
              foot: hero && { x: hero.x, lane: hero.lane },
            };
            if (cue === "return") delivered = true;
          }
          state = settle(state, state.updatedAt + 100);
        }
        assert.ok(delivered, "recovered basket reaches its recipient");
        assert.ok(stages.has("recover") && stages.has("walk") && stages.has("give"));
      });
