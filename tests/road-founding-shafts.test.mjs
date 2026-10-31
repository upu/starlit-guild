import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { foundingRoadBackground, journeyCartWidth } from "../lib/road-journey-cart.ts";
import { roadDepth, roadHeroSize, roadScale, roadX, roadY } from "../lib/road-layout.ts";
import { waterwayPalm } from "../lib/road-waterway-contacts.ts";
import { foundingCargoPoint } from "../lib/road-founding-cargo.ts";

function start() {
  let state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === "starlit-guild-founding"),
    40,
    10000,
  );
  const interlude = pendingInterlude(state);
  if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
  return act(
    state,
    { type: "start", id: "starlit-guild-founding", readDeparture: true, value: false },
    state.updatedAt,
  );
}

function lineDistance(point, start, end) {
  const dx = end.x - start.x,
    dy = end.y - start.y;
  const t = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)),
  );
  return Math.hypot(point.x - start.x - t * dx, point.y - start.y - t * dy);
}

for (const width of [320, 390, 936])
  for (const review of [false, true])
    test(`Leon avoids the cart shafts at ${width}px, ${review ? "mid-run entry" : "normal start"}`, () => {
      let state = start();
      if (review) {
        for (let i = 0; i < 3000; i++) {
          const run = state.squads[0].run;
          if (run?.node > 0 && run.phase === "move" && !run.enemies?.some((enemy) => enemy.hp > 0))
            break;
          state = settle(state, state.updatedAt + 100);
        }
      }
      const view = { width, height: (width * 2) / 3 },
        motion = new RoadMotion();
      let samples = 0,
        finnSamples = 0;
      for (let i = 0; i < 1800 && state.squads[0].run; i++) {
        const before = JSON.stringify(state);
        const input = {
          squad: state.squads[0],
          startQuest: "starlit-guild-founding",
          now: state.updatedAt,
          ready: true,
          paused: false,
          storybookHeroes: true,
          backgroundOverride: foundingRoadBackground,
        };
        const { battle, look } = motion.update(
          chapterRoadFrame(input, false, 1400, view),
          "shafts",
          width,
          false,
          view.height,
        );
        assert.equal(JSON.stringify(state), before);
        const cart = battle.journeyCart,
          leon = battle.heroes.find((hero) => hero.id === "leon");
        if (cart && leon) {
          const size = journeyCartWidth(view, cart),
            x = roadX(cart.x, battle.distance, width, battle.stage),
            y = roadY(cart.lane, view.height, width);
          const project = ([px, py]) => ({
            x: x + size * (px / 512 - 0.5),
            y: y + (size * (py / 320 - 292 / 312) * 312) / 504,
          });
          const segments = [
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
          ];
          const foot = {
            x: roadX(leon.x, battle.distance, width, battle.stage),
            y: roadY(leon.lane, view.height, width),
          };
          const distance = Math.min(
            ...segments.map(([a, b]) => lineDistance(foot, project(a), project(b))),
          );
          assert.ok(
            distance >= roadHeroSize(width, view.height) * 0.16,
            `Leon's feet approach the shafts at step ${i}: ${distance}px`,
          );
          if (!review && (look.foundingDraft?.visualNode ?? 0) === 0 && cart.phase === "parked") {
            for (const id of ["aria", "finn"]) {
              if (look.foundingDraft?.actor === id) continue;
              const companion = battle.heroes.find((hero) => hero.id === id);
              assert.ok(companion);
              const point = {
                x: roadX(companion.x, battle.distance, width, battle.stage),
                y: roadY(companion.lane, view.height, width),
              };
              const clearance = Math.min(
                ...segments.map(([a, b]) => lineDistance(point, project(a), project(b))),
              );
              assert.ok(
                clearance >= roadHeroSize(width, view.height) * 0.16,
                `${id}'s feet approach the shafts at opening step ${i}: ${clearance}px`,
              );
            }
          }
          const finn = battle.heroes.find((hero) => hero.id === "finn");
          if (
            !review &&
            finn &&
            look.foundingDraft?.visualNode === 1 &&
            look.foundingDraft.actor === "finn"
          ) {
            const finnFoot = {
              x: roadX(finn.x, battle.distance, width, battle.stage),
              y: roadY(finn.lane, view.height, width),
            };
            const finnDistance = Math.min(
              ...segments.map(([a, b]) => lineDistance(finnFoot, project(a), project(b))),
            );
            assert.ok(
              finnDistance >= roadHeroSize(width, view.height) * 0.16,
              `Finn's feet approach the shafts during the first basket handoff at step ${i}: ${finnDistance}px`,
            );
            finnSamples++;
          }
          samples++;
        }
        state = settle(state, state.updatedAt + 50);
      }
      assert.ok(samples > 100, "exercise the actual journey and handoff frames");
      if (!review) assert.ok(finnSamples > 30, "exercise Finn's first basket handoff");
    });

for (const width of [390, 936])
  for (const node of [1, 4, 7, 10, 13])
    test(`Finn clears the shafts during basket ${node} at ${width}px after reopening`, () => {
      let state = start();
      for (let i = 0; i < 10000; i++) {
        const run = state.squads[0].run;
        if (
          run?.node === node &&
          run.phase === "work" &&
          !run.enemies?.some((enemy) => enemy.hp > 0)
        )
          break;
        state = settle(state, state.updatedAt + 100);
      }
      assert.equal(state.squads[0].run?.node, node);
      const view = { width, height: (width * 2) / 3 },
        motion = new RoadMotion(),
        stages = new Set();
      let checkedPickup = false;
      const before = JSON.stringify(state);
      for (let i = 0; i < 1600; i++) {
        const frame = chapterRoadFrame(
          {
            squad: state.squads[0],
            startQuest: "starlit-guild-founding",
            now: state.updatedAt + i * 50,
            ready: true,
            paused: false,
            storybookHeroes: true,
            backgroundOverride: foundingRoadBackground,
          },
          false,
          1400,
          view,
        );
        const { battle, look } = motion.update(frame, "basket", width, false, view.height);
        if (look.foundingDraft?.actor !== "finn") {
          if (stages.has("return")) break;
          continue;
        }
        stages.add(look.foundingDraft.cue);
        const cart = battle.journeyCart,
          finn = battle.heroes.find((hero) => hero.id === "finn");
        assert.ok(cart && finn);
        const size = journeyCartWidth(view, cart),
          x = roadX(cart.x, battle.distance, width, battle.stage),
          y = roadY(cart.lane, view.height, width);
        const project = ([px, py]) => ({
          x: x + size * (px / 512 - 0.5),
          y: y + (size * (py / 320 - 292 / 312) * 312) / 504,
        });
        const foot = {
          x: roadX(finn.x, battle.distance, width, battle.stage),
          y: roadY(finn.lane, view.height, width),
        };
        const segments = [
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
        ];
        const distance = Math.min(
          ...segments.map(([a, b]) => lineDistance(foot, project(a), project(b))),
        );
        assert.ok(distance >= roadHeroSize(width, view.height) * 0.16, `step ${i}: ${distance}px`);
        const basket = battle.waterwayActions?.props.find((prop) => prop.id === "founding-basket");
        if (!checkedPickup && basket && look.foundingDraft.cue === "pickup") {
          const source = foundingCargoPoint(
            { kind: "basket", node },
            cart,
            view,
            battle.stage,
            size,
          );
          const hand = waterwayPalm(finn, [118, 107], 1, view);
          const pixels = (a, b) =>
            Math.hypot(
              (a.x - b.x) * roadScale(width, battle.stage),
              (a.lane - b.lane) * roadDepth(width, view.height),
            );
          assert.ok(
            pixels(basket.point, source) < 1,
            "basket starts at its original cart position",
          );
          assert.ok(
            pixels(hand, source) < roadHeroSize(width, view.height) * 0.15,
            "the hand reaches the basket",
          );
          checkedPickup = true;
        }
      }
      assert.deepEqual([...stages], ["pickup", "walk", "give", "return"]);
      assert.ok(checkedPickup, "show the basket leaving its slot");
      assert.equal(JSON.stringify(state), before, "rendering must not mutate the save");
    });
