import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";

const art = evaluateSourceModule(
  compileSourceModule("../app/phaser/road-art.ts", import.meta.url),
  {},
);
const { applyHeroPose, applyWorkPose } = evaluateSourceModule(
  compileSourceModule("../app/phaser/road-poses.ts", import.meta.url),
  { "./road-art": art },
);
function image(initial = []) {
  const frames = new Map(initial.map((name) => [name, { name, width: 384, height: 384 }]));
  const texture = {
    has: (name) => frames.has(name),
    add: (name, source, x, y, width, height) => frames.set(name, { name, width, height }),
  };
  return {
    scene: { textures: { get: () => texture } },
    setTexture(key, name) {
      this.key = key;
      this.frame = name === undefined ? { name: "__BASE", height: 512 } : frames.get(name);
      assert.ok(this.frame, `missing ${name}`);
      return this;
    },
    setOrigin(x, y) {
      this.origin = [x, y];
      return this;
    },
    setScale(scale) {
      this.scale = scale;
      return this;
    },
  };
}

test("Lico's late-loaded motion sheet animates walking and returns to her standing pose", () => {
  const sprite = image();
  for (const step of [0, 1, 2, 3]) {
    applyHeroPose(sprite, "lico", String(step), 90);
    assert.equal(sprite.key, art.roadWalkSheet("lico"));
    assert.equal(sprite.frame.name, String(step % 2));
    assert.deepEqual(sprite.origin, [0.5, 1]);
  }
  for (const pose of [4, 8, 11]) {
    applyHeroPose(sprite, "lico", String(pose), 90);
    assert.equal(sprite.key, art.roadSheet("lico"));
    assert.equal(sprite.frame.name, "__BASE");
  }
});

test("Aria keeps her scale and foot anchor across main and work sheets, including paused work", () => {
  const sprite = image(Array.from({ length: 16 }, (_, i) => String(i)));
  applyHeroPose(sprite, "aria", "8", 90);
  const scale = sprite.scale,
    origin = sprite.origin;
  for (let pose = 0; pose < 16; pose++) {
    applyHeroPose(sprite, "aria", String(pose), 90);
    assert.equal(sprite.key, art.roadSheet("aria"));
    assert.equal(sprite.frame.name, String(pose));
    assert.equal(sprite.scale, scale);
    assert.deepEqual(sprite.origin, origin);
  }
  const state = { gathering: { kind: "cargo", task: "carry" }, time: 220, enemies: [] };
  for (const [task, pulling, reduced, enemies, key, frame] of [
    ["carry", false, false, [], art.roadSheet("aria"), "15"],
    ["carry", true, false, [], art.ROAD_ARIA_WORK, "1"],
    ["carry", true, true, [], art.ROAD_ARIA_WORK, "0"],
    ["carry", true, false, [{ hp: 1 }], art.ROAD_ARIA_WORK, "0"],
    ["pack", false, false, [], art.ROAD_ARIA_WORK, "3"],
    ["unload", false, true, [], art.ROAD_ARIA_WORK, "2"],
  ]) {
    assert.equal(
      applyWorkPose(
        sprite,
        {
          ...state,
          time: task === "pack" ? 750 : 220,
          enemies,
          gathering: { ...state.gathering, task },
        },
        { id: "aria" },
        reduced,
        90,
        pulling,
      ),
      true,
    );
    assert.equal(sprite.key, key);
    assert.equal(sprite.frame.name, frame);
    assert.equal(sprite.scale, scale);
    assert.deepEqual(sprite.origin, origin);
  }
});

test("Aria's twenty normalized poses have real alpha, intact transparent margins and distinct steps", async () => {
  for (const [asset, columns, rows] of [
    [art.roadSheet("aria"), 4, 4],
    [art.ROAD_ARIA_WORK, 2, 2],
  ]) {
    const source = sharp(`public${asset}`);
    const meta = await source.metadata();
    assert.equal(meta.hasAlpha, true);
    assert.equal(meta.width, columns * art.ARIA_CELL);
    assert.equal(meta.height, rows * art.ARIA_CELL);
    const frames = [];
    for (let pose = 0; pose < columns * rows; pose++) {
      const pixels = await source
        .clone()
        .extract({
          left: (pose % columns) * art.ARIA_CELL,
          top: Math.floor(pose / columns) * art.ARIA_CELL,
          width: art.ARIA_CELL,
          height: art.ARIA_CELL,
        })
        .ensureAlpha()
        .raw()
        .toBuffer();
      for (let p = 0; p < art.ARIA_CELL; p++) {
        for (const offset of [
          p,
          p * art.ARIA_CELL,
          p * art.ARIA_CELL + art.ARIA_CELL - 1,
          (art.ARIA_CELL - 1) * art.ARIA_CELL + p,
        ])
          assert.equal(pixels[offset * 4 + 3], 0);
      }
      frames.push(pixels);
    }
    assert.notDeepEqual(frames[0], frames[1]);
    assert.notDeepEqual(frames.at(-2), frames.at(-1));
  }
});

test("Lico pushes in alternating steps, keeps head scale, and freezes work animation when paused", () => {
  const sprite = image(),
    hero = { id: "lico" };
  const state = { gathering: { kind: "cargo", task: "carry" }, time: 0, enemies: [] };
  applyHeroPose(sprite, "lico", "0", 90);
  const scale = sprite.scale;
  for (const [time, reduced, enemies, frame] of [
    [0, false, [], "2"],
    [220, false, [], "3"],
    [440, false, [], "2"],
    [220, true, [], "2"],
    [220, false, [{ hp: 1 }], "2"],
  ]) {
    assert.equal(
      applyWorkPose(sprite, { ...state, time, enemies }, hero, reduced, 90, false),
      true,
    );
    assert.equal(sprite.frame.name, frame);
    assert.equal(sprite.scale, scale);
  }
  assert.equal(applyWorkPose(sprite, { ...state, gathering: null }, hero, false, 90, false), false);
});

test("each Lico motion rectangle has transparent margins and distinct limb pixels", async () => {
  const source = sharp("assets/source/road/lico-motion-v1.png");
  const metadata = await source.metadata();
  assert.equal(metadata.hasAlpha, true);
  const pixels = [];
  for (const [left, top, width, height] of art.licoMotionFrames) {
    assert.ok(
      left >= 0 && top >= 0 && left + width <= metadata.width && top + height <= metadata.height,
    );
    pixels.push(
      await source.clone().extract({ left, top, width, height }).resize(80, 120).raw().toBuffer(),
    );
  }
  assert.notDeepEqual(pixels[0], pixels[1]);
  assert.notDeepEqual(pixels[2], pixels[3]);
});
