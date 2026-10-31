import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import {
  RoadStorybookEnemies,
  paintedPuppetAssets,
  arrangePaintedPuppets,
} from "../lib/road-storybook-enemy.ts";
import { fitPaintedEnemy } from "../app/phaser/road-storybook-enemy.ts";
import { enemyDisplayHeight } from "../lib/road-enemy-layout.ts";
import { roadHeroSize } from "../lib/road-layout.ts";

for (const kind of ["puppet", "golem", "pumpety"])
  test(`${kind} walks by travel, keeps a planted idle, and reacts without changing its scale`, async () => {
    const motion = new RoadStorybookEnemies(),
      view = { width: 936, height: 624, stage: "puppets" },
      enemy = { kind, id: 1, x: 200, lane: 0.74, hp: 100, maxHp: 100, boss: kind === "golem" };
    const battle = { time: 1000 };
    const standing = motion.pose(enemy, battle, view, false, "a");
    assert.equal(standing.frame, "0");
    for (const time of [1200, 1800, 4000])
      assert.equal(motion.pose(enemy, { time }, view, false, "a").frame, "0");
    const frames = new Set();
    for (let i = 0; i < 200; i++) {
      enemy.x += 1;
      const pose = motion.pose(enemy, { time: 4100 + i * 16 }, view, false, "a");
      frames.add(pose.frame);
      assert.equal(pose.height, standing.height);
      assert.equal(pose.foot, standing.foot);
    }
    assert.deepEqual(
      [...frames].sort(),
      kind === "pumpety" ? ["4", "5", "6", "7"] : ["1", "2", "3", "4"],
    );
    enemy.hp = 90;
    assert.equal(
      motion.pose(enemy, { time: 8000 }, view, false, "a").frame,
      kind === "pumpety" ? "3" : "7",
    );
    assert.equal(motion.pose(enemy, { time: 8400 }, view, false, "a").frame, "0");
    enemy.action = kind === "pumpety" ? "command" : "rally";
    assert.equal(
      motion.pose(enemy, { time: 8500 }, view, false, "a").frame,
      kind === "pumpety" ? "2" : "4",
    );
    assert.equal(motion.pose(enemy, { time: 8600 }, view, true, "a").frame, "0");
    enemy.pose = "drag";
    assert.equal(
      motion.pose(enemy, { time: 8700 }, view, true, "a").frame,
      kind === "pumpety" ? "9" : "5",
    );
    const meta = await sharp("public" + standing.asset).metadata();
    assert.equal(meta.width, standing.cell * 4);
    assert.equal(meta.height, standing.cell * standing.rows);
    const metrics = JSON.parse(
      await readFile(
        kind === "pumpety"
          ? "public/storybook-study/masked-pumpety-v1-metrics.json"
          : `public/storybook-study/${kind}-metrics.json`,
        "utf8",
      ),
    );
    assert.equal(new Set(metrics.map((m) => m.scale)).size, 1);
  });

test("painted frames share the same physical height and exact foot without squash, bob or rotation", () => {
  for (const kind of Object.keys(paintedPuppetAssets)) {
    const pose = new RoadStorybookEnemies().pose(
      { kind, id: 1, x: 0, lane: 0.7, hp: 10 },
      { time: 1000 },
      { width: 374, height: 249, stage: "puppets" },
      false,
      "fit",
    );
    const frames = new Set(),
      calls = {};
    const texture = {
      has: () => frames.has("0"),
      add: (id, ...rect) => {
        frames.add(id);
        assert.equal(rect.at(-1), pose.cell);
      },
      setFilter: () => {},
    };
    const image = {
      scene: { textures: { get: () => texture } },
      setTexture: (...v) => {
        calls.texture = v;
        return image;
      },
      setOrigin: (...v) => {
        calls.origin = v;
        return image;
      },
      setScale: (v) => {
        calls.scale = v;
        return image;
      },
      setAngle: (v) => {
        calls.angle = v;
        return image;
      },
    };
    fitPaintedEnemy(image, pose, 55);
    assert.equal(frames.size, pose.rows * 4);
    assert.deepEqual(calls.origin, [0.5, pose.foot / pose.cell]);
    assert.ok(Math.abs(calls.scale * pose.height - 55) < 1e-10);
    assert.equal(calls.angle, 0);
    fitPaintedEnemy(image, { ...pose, frame: "5" }, 55);
    assert.ok(Math.abs(calls.scale * pose.height - 55) < 1e-10);
  }
});

test("small puppets and masked child remain shorter than the heroes, while carrier golem is larger", () => {
  for (const [w, h] of [
    [374, 249],
    [936, 624],
  ]) {
    const human = roadHeroSize(w, h) * 0.9;
    assert.ok(enemyDisplayHeight({ kind: "puppet" }, w, h) < human * 0.6);
    assert.ok(enemyDisplayHeight({ kind: "pumpety" }, w, h) < human * 0.85);
    assert.ok(enemyDisplayHeight({ kind: "golem" }, w, h) > human * 1.5);
  }
});

test("small actors remain in front of the carrier instead of under its feet", () => {
  const b = {
    enemies: [
      { kind: "golem", lane: 0.74, x: 200 },
      { kind: "puppet", lane: 0.57, x: 250 },
      { kind: "pumpety", lane: 0.9, x: 400 },
    ],
  };
  const unchanged = JSON.stringify(b);
  arrangePaintedPuppets(b, false);
  assert.equal(JSON.stringify(b), unchanged);
  arrangePaintedPuppets(b, true);
  assert.ok(b.enemies[1].lane - b.enemies[0].lane > 0.5);
  assert.deepEqual(
    b.enemies.map((e) => e.x),
    [200, 250, 400],
  );
  const once = JSON.stringify(b);
  arrangePaintedPuppets(b, true);
  assert.equal(JSON.stringify(b), once);
  b.scene = "escape";
  arrangePaintedPuppets(b, true);
  assert.ok(b.enemies[0].lane < 0.35, "carrier retreats behind the heroes' foot lanes");
  b.sceneProgress = 0;
  arrangePaintedPuppets(b, true);
  assert.equal(b.enemies[0].lane, 0.55);
  b.sceneProgress = 0.1;
  arrangePaintedPuppets(b, true);
  assert.ok(b.enemies[0].lane > 0.28 && b.enemies[0].lane < 0.55);
  b.sceneProgress = 0.2;
  arrangePaintedPuppets(b, true);
  assert.ok(Math.abs(b.enemies[0].lane - 0.28) < 1e-10);
});
