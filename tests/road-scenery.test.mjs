import { test } from "node:test";
import assert from "node:assert/strict";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";
import * as layout from "../lib/road-layout.ts";
import * as waterwayLayout from "../lib/road-waterway-layout.ts";
import * as background from "../lib/road-scrolling-background.ts";
import * as traffic from "../lib/road-passing-traffic.ts";
import * as fixed from "../lib/road-fixed-layout.ts";
import * as housecalls from "../lib/road-housecalls-layout.ts";
import * as berne from "../lib/road-berne-journey.ts";
import * as night from "../lib/road-night-portrait.ts";
import * as linde from "../lib/road-linde-delivery.ts";
import * as lantern from "../lib/road-lantern-layout.ts";
import * as brekka from "../lib/road-brekka-ledger.ts";
import * as brekkaLayout from "../lib/road-brekka-ledger-layout.ts";
import * as mossTrail from "../lib/road-moss-trail.ts";
import * as mossBeds from "../lib/road-moss-beds.ts";
import * as restoration from "../lib/road-berne-restoration.ts";
import * as restorationLayout from "../lib/road-restoration-layout.ts";

const townLandmarks = evaluateSourceModule(
  compileSourceModule("../app/phaser/road-town-landmarks.ts", import.meta.url),
  { "@/lib/road-layout": layout, "@/lib/road-scrolling-background": background },
);
const { RoadScenery } = evaluateSourceModule(
  compileSourceModule("../app/phaser/road-scenery.ts", import.meta.url),
  {
    "@/lib/road-layout": layout,
    "@/lib/road-scrolling-background": background,
    "@/lib/road-passing-traffic": traffic,
    "@/lib/road-waterway-layout": waterwayLayout,
    "@/lib/road-fixed-layout": fixed,
    "@/lib/road-housecalls-layout": housecalls,
    "@/lib/road-berne-journey": berne,
    "@/lib/road-night-portrait": night,
    "@/lib/road-linde-delivery": linde,
    "@/lib/road-lantern-layout": lantern,
    "@/lib/road-brekka-ledger": brekka,
    "@/lib/road-brekka-ledger-layout": brekkaLayout,
    "@/lib/road-moss-trail": mossTrail,
    "@/lib/road-moss-beds": mossBeds,
    "@/lib/road-berne-restoration": restoration,
    "@/lib/road-restoration-layout": restorationLayout,
    "./road-town-landmarks": townLandmarks,
  },
);
function drawable() {
  return {
    texture: { getSourceImage: () => ({ width: 1536, height: 1024 }) },
    setOrigin() {
      return this;
    },
    setAlpha(value) {
      this.alpha = value;
      return this;
    },
    setDepth() {
      return this;
    },
    setTint() {
      return this;
    },
    setFlipX(value) {
      this.flipX = value;
      return this;
    },
    setDisplaySize(width, height) {
      this.width = width;
      this.height = height;
      return this;
    },
    clear() {
      return this;
    },
    fillStyle() {
      return this;
    },
    fillRect() {
      return this;
    },
    setTexture(key) {
      this.key = key;
      return this;
    },
    setVisible(visible) {
      this.visible = visible;
      return this;
    },
    setPosition(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },
  };
}
test("trading arrivals keep the warehouse and return signpost at fixed world coordinates", () => {
  const images = [],
    scene = {
      scale: { width: 936, height: 624 },
      add: {
        image: (_x, _y, key) => {
          const i = drawable();
          i.key = key;
          images.push(i);
          return i;
        },
        graphics: drawable,
      },
    };
  const scenery = new RoadScenery(scene),
    state = { stage: "forest", distance: 2700, enemies: [] },
    look = {
      background: background.STORYBOOK_FOREST,
      quest: "village-trade",
      storybookHeroes: true,
      length: 3150,
    };
  scenery.paint(state, false, look);
  const arrival = images.find((i) => i.key === background.STORYBOOK_WAREHOUSE);
  assert.equal(arrival.x, layout.roadX(3260, 2700, 936, "forest"));
  scenery.paint({ ...state, distance: 3000 }, false, look);
  assert.equal(arrival.x, layout.roadX(3260, 3000, 936, "forest"));
  scenery.paint(state, false, { ...look, quest: "evening-trade-road" });
  assert.equal(arrival.key, "/storybook-study/signpost-v1.webp");
  scenery.paint(state, false, { ...look, quest: "moss-night-road" });
  assert.equal(arrival.visible, false);
});

test("town delivery landmarks stay in world space and switch behind a scene fade", () => {
  for (const [width, height] of [
    [374, 249],
    [936, 624],
  ]) {
    const images = [];
    const scene = {
      scale: { width, height },
      add: {
        image: (_x, _y, key) => {
          const image = drawable();
          image.key = key;
          images.push(image);
          return image;
        },
      },
    };
    const landmarks = new townLandmarks.RoadTownLandmarks(scene);
    const look = {
      quest: "town-deliveries",
      storybookHeroes: true,
      sceneKey: "first",
      work: { label: "商店へ荷物を運ぶ" },
    };
    const recipient = { id: "town-delivery-recipient", alpha: 1 };
    const frame = {
      stage: "forest",
      distance: 400,
      time: 1000,
      townParcelDestination: 600,
      townParcelHandoff: true,
      waterwayActions: { actors: [recipient] },
    };
    landmarks.paint(frame, look);
    const shop = images.find((image) => image.key === townLandmarks.TOWN_SHOP);
    const initial = shop.x;
    landmarks.paint({ ...frame, distance: 420, time: 1100, townNextWarehouseX: 810 }, look);
    assert.ok(Math.abs(shop.x - (initial - 20 * layout.roadScale(width))) < 1e-9);
    const transition = {
      ...frame,
      distance: 440,
      time: 1200,
      townParcelDestination: undefined,
      townParcelHandoff: false,
      waterwayActions: undefined,
    };
    landmarks.paint(transition, look);
    const warehouse = images.find((image) => image.key === background.STORYBOOK_WAREHOUSE);
    assert.equal(warehouse.alpha, 1);
    assert.equal(transition.townTransitionFade, 1);
    assert.equal(shop.visible, false);
    landmarks.paint(
      {
        ...frame,
        distance: 460,
        time: 1900,
        townParcelDestination: undefined,
        townParcelHandoff: false,
        waterwayActions: undefined,
      },
      look,
    );
    assert.equal(shop.visible, false);
    assert.equal(warehouse.alpha, 1);
    assert.equal(warehouse.x, layout.roadX(810, 460, width, "forest"));
    landmarks.paint({ ...frame, time: 2000 }, { ...look, sceneKey: "second" });
    assert.equal(warehouse.visible, false);
  }
});

test("warehouse remains fixed through transport and is re-anchored for a new run", () => {
  const images = [];
  const scenery = new RoadScenery({
    scale: { width: 600, height: 400 },
    add: {
      image: (_x, _y, key) => {
        const image = drawable();
        image.key = key;
        images.push(image);
        return image;
      },
      graphics: drawable,
    },
  });
  const look = { background: background.STORYBOOK_ROAD, sceneKey: "first", length: 1000 };
  const state = { stage: "puppets", distance: 0, gathering: { task: "pack", x: 100 } };
  scenery.paint(state, false, look);
  const warehouse = images.find((image) => image.key === background.STORYBOOK_WAREHOUSE);
  const firstX = warehouse.x;
  scenery.paint({ ...state, distance: 30, gathering: { task: "carry", x: 400 } }, false, look);
  assert.ok(Math.abs(warehouse.x - (firstX - 30 * layout.roadScale(600, "puppets"))) < 1e-9);
  scenery.paint({ ...state, gathering: undefined }, false, { ...look, sceneKey: "second" });
  assert.equal(warehouse.visible, false);
  scenery.paint({ ...state, gathering: { task: "pack", x: 500 } }, false, {
    ...look,
    sceneKey: "second",
  });
  assert.equal(warehouse.visible, true);
  assert.equal(warehouse.x, layout.roadX(565, 0, 600, "puppets"));
  scenery.paint(state, false, { ...look, background: background.STORYBOOK_MOUNTAIN });
  assert.equal(warehouse.visible, false);
});

test("the hill tower stays at the arrival world coordinate and shares the hero scale at both widths", () => {
  for (const [width, height] of [
    [374, 249],
    [936, 624],
  ]) {
    const images = [];
    const scenery = new RoadScenery({
      scale: { width, height },
      add: {
        image: (_x, _y, key) => {
          const image = drawable();
          image.key = key;
          images.push(image);
          return image;
        },
        graphics: drawable,
      },
    });
    const look = {
      background: background.STORYBOOK_HILL,
      quest: "tower-road",
      storybookHeroes: true,
      length: 2000,
    };
    const state = { stage: "forest", distance: 1500, enemies: [] };
    scenery.paint(state, false, look);
    const tower = images.find((i) => i.key === background.STORYBOOK_HILL_TOWER);
    assert.equal(tower.x, layout.roadX(2100, 1500, width, "forest"));
    assert.ok(Math.abs(tower.width / layout.roadHeroSize(width, height) - 3.2) < 1e-9);
    scenery.paint({ ...state, distance: 1600 }, false, look);
    assert.equal(tower.x, layout.roadX(2100, 1600, width, "forest"));
    scenery.paint(state, false, {
      ...look,
      quest: "forest-wetland",
      background: background.STORYBOOK_FOREST,
    });
    assert.equal(tower.visible, false);
  }
});

test("Brekka switches between the homes, outskirts, and records in both viewport shapes", () => {
  for (const [width, height] of [
    [936, 624],
    [390, 700],
  ]) {
    const images = [];
    const scenery = new RoadScenery({
      scale: { width, height },
      add: {
        image: (_x, _y, key) => {
          const image = drawable();
          image.key = key;
          images.push(image);
          return image;
        },
        graphics: drawable,
      },
    });
    const state = { stage: "forest", distance: 0, enemies: [] };
    const look = {
      background: brekka.BREKKA_VISIT_BANK,
      brekkaJourney: { field: false },
    };
    scenery.paint(state, false, look);
    assert.equal(
      images[1].key,
      height > width ? brekka.brekkaLedgerAssets.visitPortrait : brekka.BREKKA_VISIT_BANK,
    );
    scenery.paint(state, false, { ...look, brekkaJourney: { field: true } });
    assert.equal(
      images[1].key,
      height > width
        ? brekka.brekkaLedgerAssets.outskirtsPortrait
        : brekka.brekkaLedgerAssets.outskirts,
    );
    scenery.paint(state, false, {
      ...look,
      background: brekka.brekkaLedgerAssets.bank,
      brekkaLedger: { portrait: height > width },
    });
    assert.equal(
      images[1].key,
      height > width ? brekka.brekkaLedgerAssets.portrait : brekka.brekkaLedgerAssets.bank,
    );
    scenery.paint(state, false, { background: mossTrail.mossTrailAssets.bank, mossTrail: {} });
    assert.equal(
      images[1].key,
      height > width ? mossTrail.mossTrailAssets.portrait : mossTrail.mossTrailAssets.bank,
    );
    scenery.paint(state, false, {
      background: mossTrail.mossTrailAssets.fork,
      mossTrail: { fork: true },
    });
    assert.equal(
      images[1].key,
      height > width ? mossTrail.mossTrailAssets.forkPortrait : mossTrail.mossTrailAssets.fork,
    );
  }
});
