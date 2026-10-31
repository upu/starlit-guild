import { test } from "node:test";
import assert from "node:assert/strict";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadWorkObstacle } from "../lib/road-work-layout.ts";
import { partyFootClearance } from "../lib/road-party-spacing.ts";
import { roadScale, roadX } from "../lib/road-layout.ts";
import { allQuests, encounter, act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { questNodes } from "../lib/puppet-battles.ts";
import { roadWorkLook } from "../lib/chapter-road-work-look.ts";
import { worksiteByLabel } from "../lib/road-worksite-catalog.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { LUNCH_INTERLUDE } from "../lib/chapter-three.ts";
import { WALNUT_INTERLUDE } from "../lib/chapter-four.ts";

test("walkers go around the base of carts and work objects and reach either side", () => {
  for (const [width, height] of [
    [388, 740],
    [1178, 848],
  ]) {
    const worldX = (x) => ((x / 560) * width - roadX(0, 0, width)) / roadScale(width);
    for (const cargo of [true, false])
      for (const direction of [-1, 1]) {
        const battle = {
          stage: "forest",
          time: 1000,
          distance: 0,
          phase: "rest",
          effects: [],
          enemies: [],
          gathering: {
            kind: cargo ? "cargo" : "herb",
            task: cargo ? "carry" : "inspect",
            x: worldX(280) - 65,
            remaining: 100,
            total: 100,
          },
          heroes: [],
        };
        const foot = partyFootClearance(width, height);
        const obstacle = roadWorkObstacle(battle, width, height, foot, cargo ? "cart" : "waterway");
        const origin = 280 - direction * (obstacle.clearance.x + 50);
        const destination = 280 + direction * (obstacle.clearance.x + 50);
        battle.heroes = [
          {
            id: "leon",
            x: worldX(origin),
            lane: obstacle.lane,
            hp: 100,
            maxHp: 100,
            facing: direction,
            walking: true,
          },
        ];
        const motion = new RoadMotion();
        const look = { workers: [], puller: null, work: { frame: cargo ? "cart" : "waterway" } };
        motion.update({ battle, look }, "path", width, false, height);
        let previous = { x: origin, lane: obstacle.lane };
        let maxDetour = 0;
        for (let now = 1016; now < 7000; now += 16) {
          const raw = {
            ...battle,
            time: now,
            heroes: [{ ...battle.heroes[0], x: worldX(destination) }],
          };
          const result = motion.update({ battle: raw, look }, "path", width, false, height).battle;
          const h = result.heroes[0];
          const next = { x: (roadX(h.x, result.distance, width) / width) * 560, lane: h.lane };
          assert.ok(
            Math.abs(next.x - obstacle.x) >= obstacle.clearance.x - 0.001 ||
              Math.abs(next.lane - obstacle.lane) >= obstacle.clearance.lane - 0.00001,
            `inside ${cargo ? "cart" : "waterway"} at ${width}/${now}`,
          );
          assert.ok(
            Math.abs(next.x - previous.x) <= 4.48001 &&
              Math.abs(next.lane - previous.lane) <= 0.014401,
            "continuous walking",
          );
          maxDetour = Math.max(maxDetour, Math.abs(next.lane - obstacle.lane));
          previous = next;
        }
        assert.ok(maxDetour >= obstacle.clearance.lane, "takes the path around the object");
        assert.ok(
          Math.abs(previous.x - destination) < 1 && Math.abs(previous.lane - obstacle.lane) < 0.01,
          "reaches the other side",
        );
      }
  }
});

test("all work illustration kinds remain reachable after avoiding their bases", () => {
  const samples = new Map();
  for (const [index, stage] of storyStages.entries()) {
    const q = allQuests.find((q) => q.id === stage.quest);
    for (let node = 0; node < questNodes(q.id); node++) {
      if (encounter(q, node) === "battle") continue;
      const kind = worksiteByLabel[roadWorkLook(q, { node, nodes: questNodes(q.id) }).label];
      if (!samples.has(kind)) samples.set(kind, { index, node });
    }
  }
  for (const [kind, { index, node }] of samples) {
    let state = testState(1000, index, 40, 10000);
    if (index === 18)
      state = act(state, { type: "readStory", id: LUNCH_INTERLUDE }, state.updatedAt);
    if (index === 27)
      state = act(state, { type: "readStory", id: WALNUT_INTERLUDE }, state.updatedAt);
    state = act(
      state,
      { type: "start", id: storyStages[index].quest, readDeparture: true, value: false },
      state.updatedAt,
    );
    let found = false;
    for (let i = 0; i < 20000 && state.squads[0].run; i++) {
      const f = chapterRoadFrame({
        squad: state.squads[0],
        now: state.updatedAt,
        ready: true,
        paused: false,
      });
      if (state.squads[0].run.node === node && f.look.workers.length) {
        found = true;
        break;
      }
      state = settle(state, state.updatedAt + 100);
    }
    assert.ok(found, kind);
    for (const [width, height] of [
      [388, 740],
      [1178, 848],
    ]) {
      const frame = chapterRoadFrame(
        { squad: state.squads[0], now: state.updatedAt, ready: true, paused: false },
        false,
        width / roadScale(width, "puppets"),
        { width, height },
      );
      // Test each authored work position against the object. Freezing the whole
      // party mid-arrival would create permanent blockers that move in real play.
      for (const id of frame.look.workers) {
        const worker = frame.battle.heroes.find((h) => h.id === id);
        const motion = new RoadMotion();
        let result;
        for (let elapsed = 0; elapsed <= 4000; elapsed += 16) {
          result = motion.update(
            {
              ...frame,
              look: { ...frame.look, workers: [id] },
              battle: { ...frame.battle, heroes: [worker], time: frame.battle.time + elapsed },
            },
            kind,
            width,
            false,
            height,
          );
        }
        assert.deepEqual(
          result.look.workers,
          [id],
          kind + "/" + width + "/" + id + ": work position outside object base",
        );
      }
    }
  }
});
