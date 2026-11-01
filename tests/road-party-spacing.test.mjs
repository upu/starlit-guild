import { test } from "node:test";
import assert from "node:assert/strict";
import { RoadMotion } from "../lib/road-motion.ts";
import { partyClearance, partyFootClearance, partyOverlap } from "../lib/road-party-spacing.ts";
import { roadX, roadScale } from "../lib/road-layout.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { LUNCH_INTERLUDE } from "../lib/chapter-three.ts";

const ids = ["aria", "leon", "mira", "finn", "lico"];
const points = (battle, width) =>
  battle.heroes.map((hero) => ({
    id: hero.id,
    x: (roadX(hero.x, battle.distance, width, battle.stage) / width) * 560,
    lane: hero.lane,
  }));
function clear(points, gap, context) {
  for (const [i, point] of points.entries()) {
    assert.ok(point.x >= gap.x / 2 - 0.001 && point.x <= 560 - gap.x / 2 + 0.001, context);
    for (const other of points.slice(i + 1))
      assert.ok(!partyOverlap(point, other, gap), `${context}: ${point.id}/${other.id}`);
  }
}
function continuous(before, after) {
  for (const point of after) {
    const old = before.find((other) => other.id === point.id);
    assert.ok(Math.abs(point.x - old.x) <= 4.48001);
    assert.ok(Math.abs(point.lane - old.lane) <= 0.014401);
  }
}
function formation(time, width, coordinates, facing = 1) {
  return {
    battle: {
      time,
      distance: 0,
      stage: "forest",
      phase: "rest",
      enemies: [],
      effects: [],
      gathering: null,
      heroes: coordinates.map(([x, lane], i) => ({
        id: ids[i],
        x: ((x / 560) * width - roadX(0, 0, width, "forest")) / roadScale(width, "forest"),
        lane,
        facing,
        walking: false,
        hp: 10,
        maxHp: 10,
      })),
    },
    look: { workers: [], puller: null },
  };
}

test("five companions pass with separate feet and settle with separate bodies in either direction", () => {
  for (const [width, height] of [
    [388, 740],
    [1178, 848],
  ])
    for (const facing of [-1, 1]) {
      const motion = new RoadMotion(),
        gap = partyFootClearance(width, height);
      const row = ids.map((_, i) => [140 + i * 65, 0.7]);
      let previous = points(
        motion.update(formation(1000, width, row, facing), "test", width, false, height).battle,
        width,
      );
      for (let now = 1016; now < 9000; now += 16) {
        const frame = formation(now, width, [...row].reverse(), facing);
        const original = structuredClone(frame);
        const next = points(motion.update(frame, "test", width, false, height).battle, width);
        continuous(previous, next);
        clear(next, gap, `${width}/${facing}/${now}`);
        assert.deepEqual(frame, original);
        previous = next;
      }
      for (const [i, point] of previous.entries())
        assert.ok(
          Math.abs(point.x - row[4 - i][0]) < 1,
          `${width}/${facing}/${point.id} must reach destination: ${JSON.stringify(previous)}`,
        );
      clear(previous, partyClearance(width, height), "settled");
    }
});

test("resizing a five-person formation walks out of enlarged bounds instead of freezing", () => {
  const motion = new RoadMotion(),
    row = ids.map((_, i) => [190 + i * 35, 0.7]);
  let previous = points(
    motion.update(formation(1000, 1178, row), "test", 1178, false, 848).battle,
    1178,
  );
  for (let now = 1016; now < 6000; now += 16) {
    const result = motion.update(formation(now, 388, row), "test", 388, false, 740);
    const next = points(result.battle, 388);
    continuous(previous, next);
    previous = next;
  }
  clear(previous, partyClearance(388, 740), "resized");
});

test("a companion faces the actual sideways detour instead of walking backwards", () => {
  const motion = new RoadMotion();
  let previous = points(
    motion.update(
      formation(1000, 1178, [
        [240, 0.1],
        [240, 0.7],
      ]),
      "test",
      1178,
      false,
      848,
    ).battle,
    1178,
  );
  let sideSteps = 0;
  for (let time = 1016; time < 6000; time += 16) {
    const result = motion.update(
      formation(time, 1178, [
        [240, 1.3],
        [240, 0.7],
      ]),
      "test",
      1178,
      false,
      848,
    );
    const next = points(result.battle, 1178);
    const dx = next[0].x - previous[0].x;
    if (Math.abs(dx) > 0.2) {
      sideSteps++;
      assert.equal(result.battle.heroes[0].facing, Math.sign(dx));
    }
    previous = next;
  }
  assert.ok(sideSteps > 0);
  assert.ok(Math.abs(previous[0].x - 240) < 1 && Math.abs(previous[0].lane - 1.3) < 0.01);
});

test("reduced motion spaces a crowded party immediately and stays static", () => {
  const motion = new RoadMotion();
  let previous;
  for (let time = 1000; time < 2000; time += 16) {
    const next = points(
      motion.update(
        formation(
          time,
          388,
          ids.map(() => [280, 0.7]),
        ),
        "test",
        388,
        true,
        740,
      ).battle,
      388,
    );
    clear(next, partyClearance(388, 740), "reduced");
    if (previous) assert.deepEqual(next, previous);
    previous = next;
  }
});

test("chapter encounters, cinematic pauses and cart transitions keep party clearance", () => {
  for (const index of [0, 12, 13, 15, 18, 22, 33, 34, 35])
    for (const [width, height] of [
      [388, 740],
      [1178, 848],
    ]) {
      let state = testState(1000, index, 40, 10000);
      if (index === 18) state = act(state, { type: "readStory", id: LUNCH_INTERLUDE }, 1000);
      state = act(
        state,
        { type: "start", id: storyStages[index].quest, readDeparture: true, value: false },
        1000,
      );
      const motion = new RoadMotion(),
        gap = partyFootClearance(width, height);
      let previous, carrySince;
      for (let now = 1000; now < 61000 && state.squads[0].run; now += 16) {
        state = settle(state, now);
        const frame = chapterRoadFrame(
          { squad: state.squads[0], now, ready: true, paused: false },
          false,
          width / roadScale(width, "puppets"),
          { width, height },
        );
        const result = motion.update(frame, "test", width, false, height);
        const carrying =
          frame.look.workers.length === 2 &&
          frame.battle.gathering?.task === "carry" &&
          !frame.battle.enemies.some((e) => e.hp > 0);
        carrySince = carrying ? (carrySince ?? now) : undefined;
        if (carrying && now - carrySince > 3000)
          assert.deepEqual(
            result.look.workers,
            frame.look.workers,
            `${storyStages[index].number}/${width}/${now}: both carriers must return to the grips`,
          );
        const next = points(result.battle, width);
        clear(next, gap, `${storyStages[index].number}/${width}/${now}`);
        if (previous) continuous(previous, next);
        for (const id of result.look.workers) {
          const original = frame.battle.heroes.find((h) => h.id === id);
          const drawn = result.battle.heroes.find((h) => h.id === id);
          assert.ok(
            Math.abs(original.lane - drawn.lane) <= 0.02001,
            `${id} cannot work in another lane`,
          );
        }
        previous = next;
      }
    }
});
