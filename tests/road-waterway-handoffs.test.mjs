import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { waterwayBackgrounds } from "../lib/road-waterway-layout.ts";
import {
  waterwayActionAssets as assets,
  waterwayPalm,
  waterwayPalms,
} from "../lib/road-waterway-contacts.ts";
import { roadHeroSize, roadScale, roadY } from "../lib/road-layout.ts";
import { WATERWAY_BRANCHES } from "../lib/road-waterway.ts";

function* playback(view) {
  let state = act(
    testState(0, 7, 18, 10000),
    { type: "start", id: "tower-restoration", readDeparture: true, value: false },
    0,
  );
  const motion = new RoadMotion();
  for (let time = 0; time < 180000 && state.squads[0].run; time += 50) {
    state = settle(state, time);
    if (!state.squads[0].run) break;
    const original = JSON.stringify(state);
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
    const drawn = motion.update(frame, "handoff-run", view.width, false, view.height);
    assert.equal(JSON.stringify(state), original, "props and handoffs never write to saves");
    yield drawn;
  }
  assert.equal(state.squads[0].run, null);
}
const distance = (a, b, view) =>
  Math.hypot(
    (a.x - b.x) * roadScale(view.width),
    roadY(a.lane, view.height, view.width) - roadY(b.lane, view.height, view.width),
  );

for (const width of [374, 936])
  test(`basket and stone handoffs complete with planted feet at ${width}`, () => {
    const view = { width, height: (width * 2) / 3 };
    const collections = new Set(),
      strides = new Set();
    let fullBasket = false,
      handoff = false,
      placed = false,
      finalStone;
    for (const { battle, look } of playback(view)) {
      const scene = battle.waterwayActions,
        leon = battle.heroes.find((h) => h.id === "leon");
      const stone = scene.props.find((p) => p.asset === assets.stone);
      if (scene.props.some((p) => p.asset === WATERWAY_BRANCHES))
        collections.add(look.waterway.node);
      if (scene.props.some((p) => p.asset === assets.filled)) fullBasket = true;
      const pose = scene.poses.leon;
      if (pose?.asset === assets.carryWalk) {
        assert.equal(leon.walking, true);
        strides.add(pose.frame);
        assert.ok(
          distance(
            stone.point,
            waterwayPalm(leon, waterwayPalms.carryWalk[pose.frame], 1, view),
            view,
          ) < 0.01,
        );
      }
      const worker = scene.worker;
      if (
        worker?.pose.asset === assets.worker &&
        worker.pose.frame === 0 &&
        pose?.asset === assets.carry
      ) {
        const receivingPalm = waterwayPalm(worker.point, waterwayPalms.workerReceive, 1, view);
        if (distance(stone.point, receivingPalm, view) < 3) handoff = true;
      }
      if (worker?.pose.asset === assets.worker && worker.pose.frame === 2) {
        assert.ok(
          distance(leon, worker.point, view) > roadHeroSize(width, view.height) * 0.75,
          "worker waits for Leon to step away before kneeling",
        );
        placed = true;
      }
      if (look.waterway.node >= 12) {
        finalStone ??= { ...stone.point };
        assert.ok(
          distance(finalStone, stone.point, view) < 0.01,
          "placed stone stays in the repaired seam",
        );
      }
    }
    assert.deepEqual([...collections], [7, 10]);
    assert.equal(strides.size, 4);
    assert.ok(fullBasket && handoff && placed && finalStone);
  });

test("new carrying and worker poses keep one body scale, lower knees and isolated cells", async () => {
  for (const name of ["leon-carry-walk-v1", "waterway-worker-handoff-v1"]) {
    const metrics = JSON.parse(
      await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"),
    );
    assert.equal(new Set(metrics.map((m) => m.scale)).size, 1);
    assert.ok(metrics.every((m) => m.baseline === 176));
    const { data, info } = await sharp(`public/storybook-study/${name}.webp`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++)
        if (x % 256 < 2 || x % 256 > 253 || y % 192 < 2 || y % 192 > 189)
          assert.ok(
            data[(y * info.width + x) * 4 + 3] <= 16,
            "heads, hands and soles have transparent gutters",
          );
    if (name.startsWith("waterway")) assert.ok(metrics[1].height < metrics[0].height * 0.85);
    else assert.ok(metrics.every((m) => Math.abs(m.height - 134) < 8));
  }
});

test("resuming after the handoff restores the filled basket and already placed stone", () => {
  let state = act(
    testState(0, 7, 18, 10000),
    { type: "start", id: "tower-restoration", readDeparture: true, value: false },
    0,
  );
  for (let time = 100; state.squads[0].run.node < 12; time += 100) state = settle(state, time);
  const view = { width: 374, height: (374 * 2) / 3 };
  const frame = chapterRoadFrame(
    {
      squad: state.squads[0],
      startQuest: "tower-restoration",
      now: state.updatedAt,
      ready: true,
      paused: false,
      storybookHeroes: true,
      backgroundOverride: waterwayBackgrounds.blocked,
    },
    false,
    1400,
    view,
  );
  const { battle } = new RoadMotion().update(frame, "resumed", view.width, false, view.height);
  const scene = battle.waterwayActions;
  assert.ok(scene.props.some((p) => p.asset === assets.filled));
  const stone = scene.props.find((p) => p.asset === assets.stone);
  const expected = waterwayPalm(scene.worker.point, waterwayPalms.workerPlace, 1, view);
  assert.ok(distance(stone.point, expected, view) < 0.01);
  assert.equal(scene.poses.leon, undefined);
});
