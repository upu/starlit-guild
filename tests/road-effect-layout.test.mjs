import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  paintedEffectLayout,
  paintedEmitters,
  STORYBOOK_EFFECTS,
} from "../lib/road-effect-layout.ts";
import { roadHeroSize, roadX, roadY } from "../lib/road-layout.ts";
import { enemyDisplayHeight } from "../lib/road-enemy-layout.ts";
import * as effectLayout from "../lib/road-effect-layout.ts";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";

test("projectiles leave the painted weapon at release and reach the actual target body", () => {
  for (const [width, height] of [
    [374, 249],
    [936, 624],
  ])
    for (const id of ["aria", "mira", "lico"]) {
      const source = { id, x: 100, lane: 0.5, facing: 1 };
      const enemy = { id: 1, x: 330, lane: 0.8, kind: "slime", boss: false };
      const effect = {
        kind: id === "aria" ? "arrow" : "magic",
        hero: id,
        at: 1000,
        x: enemy.x,
        lane: enemy.lane,
      };
      const state = { time: 1100, heroes: [source], enemies: [enemy] };
      const before = JSON.stringify(state);
      const screenX = (x) => roadX(x, 0, width);
      assert.equal(
        paintedEffectLayout(state, effect, width, height, screenX).alpha,
        0,
        "no projectile during preparation",
      );
      const start = paintedEffectLayout({ ...state, time: 1150 }, effect, width, height, screenX);
      const unit = (roadHeroSize(width, height) * 0.9) / 144;
      assert.equal(start.x, screenX(source.x) + paintedEmitters[id].x * unit);
      assert.equal(start.y, roadY(source.lane, height, width) + paintedEmitters[id].y * unit);
      const impact = paintedEffectLayout({ ...state, time: 1350 }, effect, width, height, screenX);
      assert.equal(impact.x, screenX(enemy.x));
      assert.equal(
        impact.y,
        roadY(enemy.lane, height, width) - enemyDisplayHeight(enemy, width, height) * 0.48,
      );
      assert.equal(impact.alpha, 1);
      assert.ok(
        impact.size < roadHeroSize(width, height) * 0.8,
        "effect cannot obscure a whole hero",
      );
      assert.equal(
        paintedEffectLayout({ ...state, time: 1550 }, effect, width, height, screenX).alpha,
        0,
      );
      assert.equal(JSON.stringify(state), before);
    }
});

test("left-facing emitters mirror with the hero and big opponents receive impacts above their feet", () => {
  const hero = { id: "aria", x: 300, lane: 0.5, facing: -1 };
  const enemy = { id: 1, x: 30, lane: 0.8, kind: "golem", boss: true };
  const effect = { kind: "arrow", hero: "aria", at: 0, x: 30, lane: 0.8 };
  const state = { time: 150, heroes: [hero], enemies: [enemy] };
  const start = paintedEffectLayout(state, effect, 936, 624, (x) => x);
  assert.ok(start.x < hero.x);
  assert.ok(Math.abs(start.rotation) > Math.PI / 2);
  const hit = paintedEffectLayout({ ...state, time: 350 }, effect, 936, 624, (x) => x);
  assert.ok(hit.y < roadY(0.8, 624, 936) - 50);
  assert.equal(
    paintedEffectLayout(state, { ...effect, kind: "slash" }, 936, 624, (x) => x).flipX,
    true,
  );
});

test("the renderer registers isolated painted cells and passes geometry, tint and alpha intact", () => {
  const { paintPaintedEffect } = evaluateSourceModule(
    compileSourceModule("../app/phaser/road-painted-effects.ts", import.meta.url),
    { "@/lib/road-effect-layout": effectLayout },
  );
  const frames = new Map();
  const texture = {
    has: (n) => frames.has(n),
    add: (n, source, x, y, w, h) => frames.set(n, { x, y, w, h }),
    setFilter: (n) => assert.equal(n, 1),
  };
  const image = {
    scene: {
      textures: {
        get: (key) => {
          assert.equal(key, STORYBOOK_EFFECTS);
          return texture;
        },
      },
    },
  };
  for (const method of [
    "setTexture",
    "setOrigin",
    "setPosition",
    "setDisplaySize",
    "setAlpha",
    "setRotation",
    "setTint",
    "setFlipX",
    "setDepth",
  ])
    image[method] = function (...v) {
      this[method + "Value"] = v;
      return this;
    };
  const state = { time: 350, heroes: [{ id: "lico", x: 100, lane: 0.5, facing: 1 }], enemies: [] };
  const effect = { at: 0, kind: "magic", hero: "lico", x: 300, lane: 0.8 };
  assert.equal(
    paintPaintedEffect(image, state, effect, 936, 624, (x) => x),
    true,
  );
  assert.equal(frames.size, 4);
  assert.deepEqual(frames.get("2"), { x: 512, y: 0, w: 256, h: 256 });
  assert.deepEqual(image.setTextureValue, [STORYBOOK_EFFECTS, "2"]);
  assert.deepEqual(image.setTintValue, [0xe6f38b]);
  assert.deepEqual(image.setAlphaValue, [1]);
  assert.equal(
    paintPaintedEffect(image, state, { ...effect, kind: "song" }, 936, 624, (x) => x),
    false,
  );
});

test("light colours distinguish Lico and healing, and dedicated duel effects keep their renderer", () => {
  const state = { time: 350, heroes: [], enemies: [] };
  const base = { at: 0, x: 100, lane: 0.7 };
  assert.equal(
    paintedEffectLayout(state, { ...base, kind: "magic", hero: "lico" }, 936, 624, (x) => x).tint,
    0xe6f38b,
  );
  assert.equal(
    paintedEffectLayout(state, { ...base, kind: "heal", hero: "mira" }, 936, 624, (x) => x).tint,
    0xc9ebbd,
  );
  for (const kind of ["song", "paralyze", "mushroomThrow", "command"])
    assert.equal(
      paintedEffectLayout(state, { ...base, kind }, 936, 624, (x) => x),
      undefined,
    );
});

test("painted effect cells retain transparency and do not bleed into adjacent frames", async () => {
  const { data, info } = await sharp(`public${STORYBOOK_EFFECTS}`)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 1024);
  assert.equal(info.height, 256);
  const occupied = [0, 0, 0, 0];
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 1024; x++) {
      if (data[(y * 1024 + x) * 4 + 3] < 32) continue;
      assert.ok(x % 256 > 15 && x % 256 < 240 && y > 15 && y < 240);
      occupied[Math.floor(x / 256)]++;
    }
  assert.ok(occupied.every((n) => n > 100));
  assert.ok(
    occupied[2] < 256 * 256 * 0.2,
    "magic is a sparse cluster, not a filled screen-covering orb",
  );
});
