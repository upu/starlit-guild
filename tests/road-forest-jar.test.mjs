import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadHeroSize, roadScale } from "../lib/road-layout.ts";
import { handheldPoint, handheldFrame } from "../lib/road-handheld.ts";
import { forestWorkReady } from "../lib/road-forest-jar.ts";
import { restorationVisualInput } from "../lib/restoration-visual-input.ts";
import { RoadForestCompletion } from "../lib/road-forest-completion.ts";
import {
  forestReturnAssets,
  forestReturnPoints,
  forestReturnPreload,
  FOREST_RETURN_SCALE,
} from "../lib/road-forest-return.ts";
import { foundationLayout } from "../lib/road-housecalls-layout.ts";
import { forestStudyCue } from "../lib/storybook/forest-cue.ts";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { reviewPointReady } from "../app/sprite-lab/storybook/adventure-review-points.ts";
import {
  updateStudySnapshot,
  visibleStudyState,
} from "../app/sprite-lab/storybook/restoration-preview-state.ts";

test("a new work point does not strand the jar while Aria returns for it", () => {
  const state = act(
    testState(1000, 5, 3, 10000),
    { type: "start", id: "forest-wetland", readDeparture: true, value: false },
    1000,
  );
  const input = storybookAdventureInput({
    squad: state.squads[0],
    startQuest: "forest-wetland",
    now: state.updatedAt,
    ready: true,
    paused: false,
  });
  const { battle, look } = chapterRoadFrame(input, false, 1400, { width: 374, height: 249 });
  const item = {
    hero: "aria",
    kind: "forest-moss-jar",
    phase: "ground",
    at: 1000,
    returning: true,
    facing: -1,
    point: { x: 10, lane: 0.6 },
  };
  const work = {
    ...battle,
    gathering: { kind: "herb", task: "gather", x: 400, remaining: 1, total: 1 },
  };
  assert.equal(
    forestWorkReady(
      work,
      { ...look, workers: ["aria"] },
      { width: 374, height: 249 },
      [item],
      battle.heroes.find((h) => h.id === "aria"),
    ),
    false,
  );
});

test("forest jar poses keep a shared body scale and transparent cell edges", async () => {
  const path = "public/storybook-study/aria-forest-handheld-v1.webp";
  const metrics = JSON.parse(await readFile(path.replace(".webp", "-metrics.json"), "utf8"));
  assert.equal(metrics.length, 8);
  assert.ok(metrics.every((m) => m.top + m.height === 176));
  assert.ok(metrics[1].height < metrics[0].height * 0.75);
  assert.ok(metrics.slice(4).every((m) => Math.abs(m.height - metrics[0].height) <= 5));
  for (const source of new Set(metrics.map((m) => m.source)))
    assert.equal(new Set(metrics.filter((m) => m.source === source).map((m) => m.scale)).size, 1);
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.deepEqual([info.width, info.height], [768, 384]);
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (x % 192 < 2 || x % 192 >= 190 || y % 192 < 2 || y % 192 >= 190)
        assert.equal(data[(y * info.width + x) * 4 + 3], 0, `clipped at ${x},${y}`);
});

for (const [width, height] of [
  [374, 249],
  [936, 624],
]) {
  test(`forest jar is set near the work and picked up at ${width}px`, () => {
    let state = act(
      testState(1000, 5, 3, 10000),
      { type: "start", id: "forest-wetland", readDeparture: true, value: false },
      1000,
    );
    const motion = new RoadMotion(),
      seen = new Set();
    let ground,
      retrieved = false,
      everMoved = false;
    for (let n = 0; n < 6000 && state.squads[0].run; n++) {
      const input = storybookAdventureInput({
        squad: state.squads[0],
        startQuest: "forest-wetland",
        now: state.updatedAt,
        ready: true,
        paused: false,
      });
      const before = JSON.stringify(state);
      const result = motion.update(
        chapterRoadFrame(input, false, 1400, { width, height }),
        "forest-jar",
        width,
        false,
        height,
      );
      assert.equal(JSON.stringify(state), before);
      const item = result.battle.handheld?.[0],
        hero = result.battle.heroes.find((h) => h.id === "aria");
      assert.equal(item?.kind, "forest-moss-jar");
      seen.add(item.phase);
      if (item.phase === "held" && hero.walking) everMoved = true;
      if (item.phase === "ground") {
        if (ground) assert.deepEqual(item.point, ground);
        else {
          ground = { ...item.point };
          const patch = result.battle.gathering;
          if (patch)
            assert.ok(
              Math.abs(item.point.x - (patch.x + 65)) * roadScale(width, result.battle.stage) <
                roadHeroSize(width, height) * 1.8,
              JSON.stringify({ item, patch, hero }),
            );
        }
      }
      if (item.phase === "lift") {
        const p = handheldPoint(
          item,
          hero,
          handheldFrame(item, hero, result.battle.time),
          { width, height },
          result.battle.stage,
        );
        if (result.battle.time - item.at < 220)
          assert.ok(
            Math.abs(p.x - ground.x) * roadScale(width, result.battle.stage) < 3,
            JSON.stringify({ p, ground, item, hero }),
          );
      }
      if (item.phase === "held" && ground) {
        retrieved = true;
        break;
      }
      state = settle(state, state.updatedAt + 50);
    }
    assert.ok(retrieved, JSON.stringify([...seen]));
    assert.ok(everMoved);
    for (const phase of ["held", "lower", "ground", "lift"]) assert.ok(seen.has(phase), phase);
  });
}

test("forest jar remains available across the 15 work points", () => {
  let state = act(
    testState(1000, 5, 3, 10000),
    { type: "start", id: "forest-wetland", readDeparture: true, value: false },
    1000,
  );
  const motion = new RoadMotion(),
    groundPoints = new Set();
  let retrieved = 0,
    lastPhase = "held",
    last;
  for (let n = 0; n < 20000 && state.squads[0].run; n++) {
    const input = storybookAdventureInput({
      squad: state.squads[0],
      startQuest: "forest-wetland",
      now: state.updatedAt,
      ready: true,
      paused: false,
    });
    last = motion.update(
      chapterRoadFrame(input, false, 1400, { width: 374, height: 249 }),
      "forest-full",
      374,
      false,
      249,
    );
    const item = last.battle.handheld?.[0];
    assert.ok(item);
    if (item.phase === "ground") groundPoints.add(Math.round(item.point.x));
    if (lastPhase === "lift" && item.phase === "held") retrieved++;
    lastPhase = item.phase;
    state = settle(state, state.updatedAt + 50);
  }
  assert.equal(state.done["forest-wetland"], 1);
  assert.ok(groundPoints.size >= 5, JSON.stringify({ groundPoints: [...groundPoints], retrieved }));
  assert.ok(retrieved >= 5, String(retrieved));
  // The final work point can finish while the jar is still on the ground;
  // the following dialogue begins with the specimens already placed.
  assert.ok(["ground", "held", "lift"].includes(last?.battle.handheld[0].phase));
});

test("final forest review starts at the last real work point before completion", () => {
  let state = act(
    testState(1000, 5, 3, 10000),
    { type: "start", id: "forest-wetland", readDeparture: true, value: false },
    1000,
  );
  let found = false;
  for (let step = 0; step < 3000 && state.squads[0].run; step++) {
    if (reviewPointReady(state, "forest-final", () => false)) {
      const run = state.squads[0].run;
      assert.equal(run.node, run.nodes - 1);
      assert.equal(run.phase, "work");
      found = true;
      break;
    }
    state = settle(state, state.updatedAt + 100);
  }
  assert.ok(found);
  while (state.squads[0].run) state = settle(state, state.updatedAt + 100);
  assert.equal(state.done["forest-wetland"], 1);
  assert.equal(
    reviewPointReady(state, "forest-final", () => false),
    false,
  );
});

test("forest review retains the final run only for the painted display", () => {
  const running = act(
    testState(1000, 5, 3, 10000),
    { type: "start", id: "forest-wetland", readDeparture: true, value: false },
    1000,
  );
  const complete = structuredClone(running);
  complete.squads[0].run = null;
  complete.done["forest-wetland"] = 1;
  const before = JSON.stringify(complete);
  const snapshot = updateStudySnapshot({ state: running, lastRun: null }, complete);
  assert.equal(
    visibleStudyState("forest-wetland", snapshot, false, true).squads[0].run,
    running.squads[0].run,
  );
  assert.equal(visibleStudyState("forest-wetland", snapshot, false, false), complete);
  assert.equal(JSON.stringify(complete), before);
});

for (const [width, height] of [
  [374, 249],
  [936, 624],
  [388, 740],
]) {
  test(`rapid forest completion keeps the final gathering at ${width}x${height}`, () => {
    const motion = new RoadMotion(),
      view = { width, height };
    let state = act(
      testState(1000, 5, 40, 10000),
      { type: "start", id: "forest-wetland", readDeparture: true, value: false },
      1000,
    );
    let snapshot,
      sawGround = false,
      sawWork = false,
      sawBlack = false,
      complete = false,
      wait = false;
    for (let time = 1000; time < 100000; time += 50) {
      if (state.squads[0].run) snapshot = state.squads[0];
      state = settle(state, time);
      if (state.squads[0].run && time % 200 === 0)
        state = act(state, { type: "assist", mode: "strike" }, time);
      const saved = JSON.stringify(state);
      const base = {
        squad: state.squads[0],
        startQuest: "forest-wetland",
        now: time,
        ready: true,
        paused: false,
      };
      const handoff = {
        quest: "forest-wetland",
        active: true,
        squad: snapshot,
        skipped: false,
        dialogue: "pending",
      };
      const input = storybookAdventureInput(restorationVisualInput(base, handoff));
      const { battle, look } = motion.update(
        chapterRoadFrame(input, false, 1400, view),
        "forest-test",
        width,
        false,
        height,
      );
      assert.equal(JSON.stringify(state), saved);
      if (!state.squads[0].run) {
        assert.equal(input.forestFinalizing, true);
        wait ||= !battle.forestVisualComplete;
        sawGround ||= battle.handheld?.some(
          (item) => item.kind === "forest-moss-jar" && item.phase === "ground",
        );
        sawWork ||=
          !!sawGround &&
          look.workers.includes("aria") &&
          !battle.heroes.find((h) => h.id === "aria")?.walking;
        sawBlack ||= look.forestReturn?.fade === 1;
        if (battle.forestVisualComplete) {
          complete = true;
          assert.equal(look.background, forestReturnAssets.background);
          assert.equal(look.forestReturn.scene, true);
          assert.equal(look.forestReturn.fade, 0);
          const layout = foundationLayout(view);
          for (const id of ["aria", "leon"]) {
            const hero = battle.heroes.find((h) => h.id === id);
            const expected = layout.world(...forestReturnPoints[id]);
            assert.ok(Math.abs(hero.x - expected.x) < 0.01);
            assert.ok(Math.abs(hero.lane - expected.lane) < 0.01);
          }
          assert.deepEqual(
            battle.waterwayActions.props.map((p) => p.id),
            ["forest-jar", "forest-sample", "forest-bowl", "forest-colony"],
          );
          assert.equal(restorationVisualInput(base, { ...handoff, skipped: true }), base);
          break;
        }
      }
    }
    assert.ok(
      wait && sawGround && sawWork && sawBlack && complete,
      JSON.stringify({
        wait,
        sawGround,
        sawWork,
        sawBlack,
        complete,
      }),
    );
  });
}

test("forest finalization is bounded and can accommodate an injured Aria", () => {
  const completion = new RoadForestCompletion();
  const look = { forestFinalizing: true };
  const view = { width: 936, height: 624 };
  const battle = { time: 0, heroes: [{ id: "aria", hp: 1 }], handheld: [] };
  const step = (time, key, reduced = false) => {
    const frame = completion.prepare({ battle: { ...battle, time }, look }, key, view);
    completion.update(frame.battle, frame.look, reduced);
    return frame;
  };
  assert.ok(!step(0, "one").battle.forestVisualComplete);
  assert.ok(!step(10000, "one").battle.forestVisualComplete);
  assert.equal(step(10400, "one").look.forestReturn.fade, 1);
  assert.ok(step(10800, "one").battle.forestVisualComplete);
  battle.heroes[0].hp = 0;
  assert.ok(!step(0, "two").battle.forestVisualComplete);
  assert.equal(step(400, "two").look.forestReturn.fade, 1);
  assert.ok(step(800, "two").battle.forestVisualComplete);
  battle.heroes[0] = { id: "aria", hp: 1, walking: false };
  battle.gathering = { kind: "herb" };
  battle.handheld = [{ kind: "forest-moss-jar", phase: "ground", returning: false }];
  assert.ok(!step(0, "three", true).battle.forestVisualComplete);
  assert.ok(step(50, "three", true).battle.forestVisualComplete);
  battle.heroes[0].hp = 0;
  assert.ok(!step(0, "delayed").battle.forestVisualComplete);
  assert.equal(step(1000, "delayed").look.forestReturn.fade, 1);
  assert.ok(step(1400, "delayed").battle.forestVisualComplete);
});

test("the final forest tableau uses the return conversation's background and ground positions", () => {
  assert.ok(Math.abs((192 * 0.9 * FOREST_RETURN_SCALE) / 1536 - 0.24 * 0.72) < 0.0001);
  assert.deepEqual(
    forestReturnPreload({ quest: "forest-wetland", storybookHeroes: true }),
    Object.values(forestReturnAssets),
  );
  assert.deepEqual(forestReturnPreload({ quest: "forest-wetland", storybookHeroes: false }), []);
  const cue = forestStudyCue(
    {
      actors: [{ id: "aria" }, { id: "leon" }],
      items: [
        { id: "sample", art: "moss" },
        { id: "colony", art: "colony" },
        { id: "forest", art: "dish" },
      ],
    },
    0,
  );
  const coordinate = (x, bottom) => [
    1536 * (0.14 + (0.72 * x) / 100),
    1024 * (0.09 + 0.72 * (1 - bottom / 100)),
  ];
  for (const actor of cue.actors) {
    const expected = coordinate(actor.x, actor.bottom);
    expected[1] -= 1536 * 0.24 * 0.72 * 0.0625;
    assert.ok(Math.abs(expected[0] - forestReturnPoints[actor.id][0]) < 1);
    assert.ok(Math.abs(expected[1] - forestReturnPoints[actor.id][1]) < 1);
  }
  const names = { "tower-jar": "jar", sample: "sample", colony: "colony", forest: "forest" };
  for (const item of cue.items) {
    const expected = coordinate(item.x, item.bottom);
    const point = forestReturnPoints[names[item.id]];
    assert.ok(Math.abs(expected[0] - point[0]) < 1);
    assert.ok(Math.abs(expected[1] - point[1]) < 1);
  }
});
