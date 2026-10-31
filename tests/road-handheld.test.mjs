import test from "node:test";
import assert from "node:assert/strict";
import { act, testState, settle } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { handheldPoint, handheldFrame } from "../lib/road-handheld.ts";
import { passingTrafficStep } from "../lib/road-passing-traffic.ts";
import sharp from "sharp";
import { readFile } from "node:fs/promises";

test("handheld atlases retain source-group body scale, lower kneeling height and clear gutters", async () => {
  for (const id of ["leon", "mira"]) {
    const path = `public/storybook-study/${id}-handheld-v1.webp`;
    const metrics = JSON.parse(await readFile(path.replace(".webp", "-metrics.json"), "utf8"));
    assert.equal(metrics.length, 8);
    for (const source of new Set(metrics.map((m) => m.source)))
      assert.equal(new Set(metrics.filter((m) => m.source === source).map((m) => m.scale)).size, 1);
    assert.ok(metrics[1].height < metrics[0].height * 0.85);
    assert.ok(metrics.every((m) => m.top + m.height === 176));
    const { data, info } = await sharp(path)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(info.width, 768);
    assert.equal(info.height, 384);
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++)
        if (x % 192 < 2 || x % 192 >= 190 || y % 192 < 2 || y % 192 >= 190)
          assert.equal(data[(y * info.width + x) * 4 + 3], 0, `${id} clipped at ${x},${y}`);
  }
});

test("the whole15-point homeward run retrieves luggage after every battle", () => {
  let state = act(
    testState(1000, 17, 18, 10000),
    { type: "start", id: "medicine-road-home", readDeparture: true, value: false },
    1000,
  );
  const motion = new RoadMotion(),
    cycles = { leon: 0, mira: 0 },
    previous = { leon: "held", mira: "held" };
  let last;
  for (let f = 0; f < 10000 && state.squads[0].run; f++) {
    const input = storybookAdventureInput({
      squad: state.squads[0],
      startQuest: "medicine-road-home",
      now: state.updatedAt,
      ready: true,
      paused: false,
      storybookHeroes: true,
    });
    last = motion.update(
      chapterRoadFrame(input, false, 1400, { width: 374, height: 249 }),
      "whole-homeward",
      374,
      false,
      249,
    );
    for (const item of last.battle.handheld) {
      if (previous[item.hero] === "lift" && item.phase === "held") cycles[item.hero]++;
      previous[item.hero] = item.phase;
    }
    state = settle(state, state.updatedAt + 50);
  }
  assert.equal(state.done["medicine-road-home"], 1);
  assert.ok(
    Object.values(cycles).every((n) => n >= 3),
    JSON.stringify(cycles),
  );
  assert.ok(last.battle.handheld.every((i) => i.phase === "held"));
});
test("passing traffic stops while raising and lowering a hat and exits beyond both edges", () => {
  const a = passingTrafficStep(100, 1000, 8000),
    b = passingTrafficStep(100, 1000, 8500),
    c = passingTrafficStep(100, 1000, 9000);
  assert.equal(a.frame, 5);
  assert.equal(b.frame, 6);
  assert.equal(a.x, b.x);
  assert.equal(b.x, c.x);
  assert.ok(passingTrafficStep(100, 1000, 0).x > 900);
  assert.ok(passingTrafficStep(100, 1000, 21000).x < -700);
  assert.equal(passingTrafficStep(100, 1000, 21000).visible, false);
});

for (const [width, height] of [
  [374, 249],
  [936, 624],
])
  test(`homeward luggage drops, stays grounded and is retrieved at ${width}px`, () => {
    let state = act(
      testState(1000, 17, 8, 10000),
      { type: "start", id: "medicine-road-home", readDeparture: true, value: false },
      1000,
    );
    const motion = new RoadMotion(),
      seen = new Map([
        ["leon", new Set()],
        ["mira", new Set()],
      ]),
      ground = new Map(),
      retrieved = new Set();
    let end;
    for (let i = 0; i < 24000; i++) {
      const input = storybookAdventureInput({
        squad: state.squads[0],
        startQuest: "medicine-road-home",
        now: state.updatedAt,
        ready: true,
        paused: false,
        storybookHeroes: true,
      });
      const source = JSON.stringify(state),
        raw = chapterRoadFrame(input, false, 1400, { width, height }),
        drawn = motion.update(raw, "homeward-test", width, false, height);
      assert.equal(JSON.stringify(state), source);
      for (const item of drawn.battle.handheld ?? []) {
        seen.get(item.hero).add(item.phase);
        if (item.phase === "ground") {
          if (ground.has(item.hero)) assert.deepEqual(item.point, ground.get(item.hero));
          else ground.set(item.hero, item.point);
        }
        if (item.phase === "held" && ground.has(item.hero)) {
          retrieved.add(item.hero);
          ground.delete(item.hero);
        }
        if (item.phase === "lower" && drawn.battle.time - item.at >= 180) {
          const hero = drawn.battle.heroes.find((h) => h.id === item.hero),
            point = handheldPoint(
              item,
              hero,
              handheldFrame(item, hero, drawn.battle.time),
              { width, height },
              drawn.battle.stage,
            );
          assert.ok(
            Math.abs(point.x - item.point.x) < 1.5 && Math.abs(point.lane - item.point.lane) < 0.04,
            JSON.stringify({
              hero: item.hero,
              point,
              ground: item.point,
              at: drawn.battle.time - item.at,
              body: hero,
            }),
          );
        }
      }
      if (retrieved.size === 2) {
        end = drawn;
        break;
      }
      state = settle(state, state.updatedAt + 50);
    }
    assert.ok(
      end,
      JSON.stringify({
        seen: [...seen].map(([id, set]) => [id, [...set]]),
        node: state.squads[0].run?.node,
      }),
    );
    for (const phases of seen.values())
      for (const phase of ["held", "lower", "ground", "lift"]) assert.ok(phases.has(phase));
  });
