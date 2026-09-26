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
function image() {
  const frames = new Map();
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
