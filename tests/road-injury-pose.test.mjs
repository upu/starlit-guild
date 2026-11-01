import test from "node:test";
import assert from "node:assert/strict";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";
import * as injuries from "../lib/road-injury-pose.ts";
import * as handheld from "../lib/road-handheld.ts";
import * as picnic from "../lib/road-picnic.ts";
import * as cart from "../lib/road-journey-cart.ts";
import * as roadView from "../lib/road-view.ts";
import * as foundingGrip from "../lib/road-founding-grip.ts";

const calls = [];
const { paintRoadHeroPose } = evaluateSourceModule(
  compileSourceModule("../app/phaser/road-hero-pose.ts", import.meta.url),
  {
    "@/lib/road-handheld": handheld,
    "@/lib/road-picnic": picnic,
    "@/lib/road-journey-cart": cart,
    "@/lib/road-injury-pose": injuries,
    "@/lib/road-view": roadView,
    "@/lib/road-founding-grip": foundingGrip,
    "./road-town-parcel": {
      paintTownParcelHero: (_image, _state, hero) => {
        if (hero.hp <= 0) throw Error("incapacitated actor carried town parcel");
        return false;
      },
    },
    "./road-poses": {
      applyHeroPose: (...args) => calls.push(["base", ...args]),
      applyWorkPose: () => {
        throw Error("incapacitated actor worked");
      },
    },
    "./road-storybook-poses": {
      applyStorybookFrame: (...args) => calls.push(["frame", ...args]),
      applyStorybookHandheldPose: (_image, hero) => {
        if (hero.hp <= 0) throw Error("incapacitated actor carried");
        return false;
      },
      applyNightBattlePose: () => {
        throw Error("incapacitated actor fought");
      },
      roadWalkPose: () => "walk-2",
    },
  },
);
test("incapacitated figures rest before work overrides, luggage or attack effects; healed figures resume", () => {
  const state = {
    time: 1000,
    phase: "journey",
    effects: [],
    handheld: [{ hero: "leon", phase: "held" }],
    waterwayActions: { poses: { leon: { asset: "/working.webp", frame: 1 } } },
  };
  const look = { storybookHeroes: true, workers: ["leon"] },
    image = {};
  for (const id of ["aria", "leon", "mira", "finn"]) {
    calls.length = 0;
    const result = paintRoadHeroPose(image, state, { id, hp: 0 }, false, 90, 0, look);
    assert.equal(result.luggage, undefined);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], "frame");
    assert.equal(calls[0][2], injuries.roadInjuryPose(id).asset);
    assert.equal(calls[0][4], 90, "resting never changes figure scale");
  }
  for (const id of ["lico"]) {
    calls.length = 0;
    const result = paintRoadHeroPose(image, state, { id, hp: 0 }, false, 90, 0, look);
    assert.equal(result.luggage, undefined);
    assert.equal(calls[0][0], "base");
    assert.equal(calls[0][3], "11");
  }
  calls.length = 0;
  paintRoadHeroPose(image, state, { id: "leon", hp: 1 }, false, 90, 0, look);
  assert.equal(calls[0][2], "/working.webp");
  assert.equal(injuries.roadHeroOpacity(0, true), 1);
  assert.equal(injuries.roadHeroOpacity(0, false), 0.35);
  assert.equal(injuries.roadHeroOpacity(1, false), 1);
  calls.length = 0;
  paintRoadHeroPose(
    image,
    { time: 1500, phase: "arrived", effects: [], handheld: [] },
    { id: "leon", hp: 1, walking: true },
    false,
    90,
    2,
    { storybookHeroes: true, workers: [], frontCarriers: [] },
  );
  assert.equal(calls[0][3], "walk-2", "walking back after arrival does not use a sliding idle");
});

test("luggage already on the ground stays visible when its owner rests", () => {
  const point = { x: 250, lane: 0.8 },
    item = { hero: "finn", kind: "medicine-parcel", phase: "lower", point, returning: false };
  const state = { time: 1000, phase: "journey", effects: [], handheld: [item] };
  const result = paintRoadHeroPose({}, state, { id: "finn", hp: 0 }, false, 90, 0, {
    storybookHeroes: true,
  });
  assert.equal(result.luggage.phase, "ground");
  assert.equal(result.luggage.point, point);
  assert.equal(item.phase, "lower", "drawing does not rewrite the saved presentation input");
});
