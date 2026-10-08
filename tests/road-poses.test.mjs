import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  adventureHeroArt as art,
  adventureHeroAsset,
  adventureHeroIds,
  adventureRoadPose,
} from "../lib/adventure-hero-art.ts";
import * as pixelArt from "../lib/adventure-hero-art.ts";
import { residentArt } from "../lib/home-actor.ts";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";
const { applyHeroPose, applyWorkPose } = evaluateSourceModule(
  compileSourceModule("../app/phaser/road-poses.ts", import.meta.url),
  { "@/lib/adventure-hero-art": pixelArt },
);
function sprite() {
  const frames = new Map();
  const texture = {
    has: (name) => frames.has(name),
    add: (name, source, x, y, w, h) => frames.set(name, { name, x, y, w, h }),
    setFilter: (mode) => assert.equal(mode, 0),
  };
  return {
    scene: { textures: { get: () => texture } },
    setTexture(key, name) {
      this.key = key;
      this.frame = frames.get(name);
      assert.ok(this.frame);
      return this;
    },
    setOrigin(x, y) {
      this.origin = [x, y];
      return this;
    },
    setScale(value) {
      this.scale = value;
      return this;
    },
  };
}
for (const id of adventureHeroIds) {
  test(
    id + " registers late-loaded frames and keeps scale/feet through all actions and reduced work",
    () => {
      const image = sprite();
      applyHeroPose(image, id, "8", 90);
      const scale = image.scale,
        origin = image.origin;
      for (let pose = 0; pose < 16; pose++) {
        applyHeroPose(image, id, String(pose), 90);
        assert.equal(image.key, adventureHeroAsset(id));
        assert.equal(image.frame.name, String(adventureRoadPose(String(pose))));
        assert.equal(image.scale, scale);
        assert.deepEqual(image.origin, origin);
      }
      for (let step = 0; step < 8; step++) {
        applyHeroPose(image, id, "walk-" + step, 90);
        assert.equal(image.frame.name, String(step));
      }
      for (const [task, pulling, reduced, enemies, expected] of [
        ["carry", false, false, [], 19],
        ["carry", true, false, [], 21],
        ["carry", false, true, [], 18],
        ["carry", true, false, [{ hp: 1 }], 20],
        ["pack", false, false, [], 23],
        ["unload", false, true, [], 22],
      ]) {
        const state = {
          gathering: { kind: "cargo", task },
          time: task === "pack" ? 750 : 220,
          enemies,
        };
        assert.equal(applyWorkPose(image, state, { id }, reduced, 90, pulling), true);
        assert.equal(image.frame.name, String(expected));
        assert.equal(image.scale, scale);
        assert.deepEqual(image.origin, origin);
      }
      for (const gathering of [
        null,
        { kind: "herb", task: "gather" },
        { kind: "cargo", task: "inspect" },
      ])
        assert.equal(applyWorkPose(image, { gathering }, { id }, false, 90, false), false);
    },
  );
  test(
    id + " copies all eight home walking frames and idle pixels intact, isolates every action",
    async () => {
      const source = sharp("public" + adventureHeroAsset(id)),
        home = sharp("public/home-pixel/" + id + ".webp");
      const metadata = await source.metadata();
      assert.equal(metadata.width, art.cell * 4);
      assert.equal(metadata.height, art.cell * 6);
      assert.equal(metadata.hasAlpha, true);
      const frames = [];
      for (let i = 0; i < art.frames; i++) {
        const frame = source.clone().extract({
          left: (i % 4) * art.cell,
          top: Math.floor(i / 4) * art.cell,
          width: art.cell,
          height: art.cell,
        });
        const pixels = await frame.clone().ensureAlpha().raw().toBuffer();
        frames.push(pixels);
        assert.ok(
          pixels.some((v, p) => p % 4 === 3 && v > 96),
          "empty pose " + i,
        );
        for (let p = 0; p < art.cell; p++)
          for (const offset of [
            p,
            p * art.cell,
            p * art.cell + art.cell - 1,
            (art.cell - 1) * art.cell + p,
          ])
            assert.equal(pixels[offset * 4 + 3], 0);
        if (i <= 8) {
          const native = await home
            .clone()
            .extract({
              left: (i % 4) * residentArt.cell,
              top: Math.floor(i / 4) * residentArt.cell,
              width: residentArt.cell,
              height: residentArt.cell,
            })
            .ensureAlpha()
            .raw()
            .toBuffer();
          const copy = await frame
            .extract({
              left: (art.cell - residentArt.cell) / 2,
              top: art.foot - residentArt.foot,
              width: residentArt.cell,
              height: residentArt.cell,
            })
            .ensureAlpha()
            .raw()
            .toBuffer();
          for (let p = 0; p < native.length; p += 4) {
            assert.equal(copy[p + 3], native[p + 3], `alpha ${id}/${i}/${p}`);
            if (native[p + 3])
              for (let c = 0; c < 3; c++)
                assert.equal(copy[p + c], native[p + c], `color ${id}/${i}/${p}/${c}`);
          }
        }
      }
      for (const first of [10, 14, 16, 18, 20, 22])
        assert.notDeepEqual(frames[first], frames[first + 1]);
    },
  );
}
