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
import * as storybookWork from "../lib/road-storybook-work.ts";
import * as scrollingBackground from "../lib/road-scrolling-background.ts";
import * as picnic from "../lib/road-picnic.ts";
import * as townParcel from "../lib/road-town-parcel.ts";
import * as recipient from "../lib/road-founding-recipient.ts";
import * as wheels from "../lib/road-trade-cart-wheels.ts";
import * as foundingWheel from "../lib/road-founding-wheel.ts";
import * as foundingGrip from "../lib/road-founding-grip.ts";
import * as foundingFormation from "../lib/road-founding-formation.ts";
import { journeyCartWorkState } from "../lib/road-journey-cart.ts";
const paintedPoses = evaluateSourceModule(
  compileSourceModule("../app/phaser/road-storybook-poses.ts", import.meta.url),
  {
    "@/lib/road-storybook-work": storybookWork,
    "@/lib/road-scrolling-background": scrollingBackground,
    "@/lib/road-picnic": picnic,
    "@/lib/road-town-parcel": townParcel,
    "@/lib/road-founding-recipient": recipient,
    "@/lib/road-trade-cart-wheels": wheels,
    "@/lib/road-founding-wheel": foundingWheel,
    "@/lib/road-founding-grip": foundingGrip,
  },
);
const { applyHeroPose, applyWorkPose } = evaluateSourceModule(
  compileSourceModule("../app/phaser/road-poses.ts", import.meta.url),
  {
    "@/lib/adventure-hero-art": pixelArt,
    "./road-storybook-poses": paintedPoses,
    "@/lib/road-founding-formation": foundingFormation,
    "@/lib/road-founding-grip": foundingGrip,
  },
);
function sprite(filter = 0) {
  const frames = new Map();
  const texture = {
    has: (name) => frames.has(name),
    add: (name, source, x, y, w, h) => frames.set(name, { name, x, y, w, h }),
    setFilter: (mode) => assert.equal(mode, filter),
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
test("handheld walking frames use the second atlas row with the same foot origin", () => {
  for (const id of ["leon", "mira"]) {
    const image = sprite(1);
    assert.ok(paintedPoses.applyStorybookHandheldPose(image, { id }, { phase: "held" }, 7, 90));
    assert.equal(image.frame.x, 576);
    assert.equal(image.frame.y, 192);
    assert.deepEqual(image.origin, [0.5, 176 / 192]);
    assert.equal(image.scale, (90 * 0.9) / 144);
  }
});
test("the shawl survives walking back to the grounded jar and the bow's draw/release poses", () => {
  const image = sprite(1);
  assert.ok(
    paintedPoses.applyStorybookHandheldPose(
      image,
      { id: "aria", walking: true },
      { kind: "moss-jar", phase: "ground", returning: true },
      7,
      90,
    ),
  );
  assert.ok(image.key.endsWith("aria-night-handheld-v1.webp"));
  assert.equal(image.frame.y, 192);
  for (const pose of ["4", "5", "6", "7", "11"]) {
    assert.ok(paintedPoses.applyNightBattlePose(image, pose, 90));
    assert.ok(image.key.endsWith("aria-night-battle-v1.webp"));
    assert.equal(image.origin[1], 176 / 192);
  }
});

test("a parked journey cart uses a planted contact phase while moving carriers keep their gait", () => {
  for (const id of ["aria", "leon"]) {
    const image = sprite(1),
      state = {
        journeyCart: { phase: "moving" },
        gathering: { kind: "cargo", task: "carry" },
        enemies: [],
        time: 1000,
      };
    applyWorkPose(image, state, { id, walking: false }, false, 90, id === "leon", true, 3);
    assert.equal(image.frame.name, "0");
    applyWorkPose(image, state, { id, walking: true }, false, 90, id === "leon", true, 3);
    assert.equal(image.frame.name, "3");
  }
});

test("only the founding cart uses Finn's registered grip poses", () => {
  for (const [asset, expected] of [
    [foundingFormation.foundingCartAsset, foundingGrip.foundingPullAsset],
    ["/storybook-study/seedling-cart-body-v2.webp", "/storybook-study/finn-pull-balanced-v3.webp"],
  ]) {
    for (let frame = 0; frame < 4; frame++) {
      const image = sprite(1);
      const state = {
        journeyCart: { asset, phase: "moving" },
        gathering: { kind: "cargo", task: "carry" },
        enemies: [],
        time: 1000,
      };
      assert.ok(
        applyWorkPose(image, state, { id: "finn", walking: true }, false, 90, true, true, frame),
      );
      assert.equal(image.key, expected);
      assert.equal(image.frame.name, String(frame));
    }
  }
  const image = sprite(1);
  const state = {
    journeyCart: { asset: foundingFormation.foundingCartAsset, phase: "moving" },
    gathering: { kind: "cargo", task: "carry" },
    enemies: [],
    time: 1000,
  };
  assert.ok(applyWorkPose(image, state, { id: "finn", walking: false }, false, 90, true, true, 3));
  assert.equal(image.key, foundingGrip.foundingPullRestAsset);
  assert.equal(image.frame.name, "0");
});

test("Brekka's cart stays in both carrying poses when the simulation advances to records", () => {
  const state = journeyCartWorkState({
    journeyCart: { asset: "/storybook-study/brekka-medical-cart-v1.webp", x: 100, phase: "moving" },
    gathering: { kind: "herb", task: "inspect" },
    enemies: [],
    time: 1000,
  });
  for (const [id, expected] of [
    ["aria", "aria-push-v3"],
    ["leon", "leon-pull-v1"],
  ]) {
    const image = sprite(1);
    assert.equal(
      applyWorkPose(image, state, { id, walking: true }, false, 90, id === "leon", true, 2),
      true,
    );
    assert.equal(image.key, `/storybook-study/${expected}.webp`);
    assert.equal(image.frame.name, "2");
  }
});

test("painted locomotion uses the supplied travel phase while hand work retains its own timing", () => {
  for (const id of ["aria", "leon"]) {
    const image = sprite(1);
    for (const phase of [0, 1, 2, 3]) {
      applyHeroPose(image, id, "walk-7", 90, true, phase);
      assert.equal(image.frame.name, String(phase));
      assert.equal(image.origin[1], 176 / 192);
      const state = { gathering: { kind: "cargo", task: "carry" }, time: 123456, enemies: [] };
      applyWorkPose(image, state, { id }, false, 90, id === "leon", true, phase);
      assert.equal(image.frame.name, String(phase));
      applyWorkPose(
        image,
        { ...state, gathering: { task: "pack" }, time: 750 },
        { id },
        false,
        90,
        false,
        true,
        phase,
      );
      assert.equal(image.frame.name, "2");
    }
  }
});

test("painted battle and walking share their world scale and feet, with extra sword space", () => {
  for (const id of ["aria", "leon", "mira", "finn", "lico"]) {
    const image = sprite(1);
    applyHeroPose(image, id, "walk-0", 90, true, 2);
    const scale = image.scale;
    assert.equal(image.frame.name, "2");
    for (const pose of ["4", "5", "6", "7", "11"]) {
      // Each source atlas has its own Phaser texture/frame collection.
      const battle = sprite(1);
      applyHeroPose(battle, id, pose, 90, true);
      assert.equal(
        battle.key,
        `/storybook-study/${id === "finn" ? "finn-battle-balanced-v2" : `${id}-battle-v1`}.webp`,
      );
      assert.equal(battle.frame.w, 256);
      assert.equal(battle.origin[0] * battle.frame.w, 96);
      assert.equal(battle.origin[1], 176 / 192);
      assert.equal(battle.scale, scale);
    }
  }
});
test("painted earthwork keeps feet and scale, uses three grounded tool phases, and respects reduced motion", () => {
  for (const id of adventureHeroIds) {
    const standing = sprite(1);
    applyHeroPose(standing, id, "8", 90, true);
    for (const time of [0, 650, 1300]) {
      const image = sprite(1);
      const state = { gathering: { task: "gather" }, enemies: [], time };
      assert.equal(
        applyWorkPose(image, state, { id }, false, 90, false, true, 0, "earthwork"),
        true,
      );
      assert.equal(
        image.key,
        `/storybook-study/${id === "finn" ? "finn-earthwork-balanced-v2" : `${id}-earthwork-v1`}.webp`,
      );
      assert.equal(image.frame.name, String(1 + time / 650));
      assert.equal(image.scale, standing.scale);
      assert.deepEqual(image.origin, standing.origin);
      applyWorkPose(image, state, { id }, true, 90, false, true, 0, "earthwork");
      assert.equal(image.frame.name, "1");
      assert.equal(
        applyWorkPose(image, state, { id }, false, 90, false, true),
        false,
        "unrelated gathering does not turn into trowel work",
      );
    }
  }
});

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
  test(id + " copies all eight home walking frames intact, isolates every action", async () => {
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
      if (i < 8) {
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
  });
}
