import { test } from "node:test";
import assert from "node:assert/strict";
import * as props from "../lib/story-stage-props.ts";
import * as figure from "../lib/story-stage-figure.ts";
import * as cargo from "../lib/story-stage-cargo.ts";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";

test("a held cup follows its hand immediately when a sip changes its angle, while pickup still travels", () => {
  const { itemPainter } = evaluateSourceModule(
    compileSourceModule("../app/story-stage-item-motion.ts", import.meta.url),
    {
      "@/lib/story-stage-props": props,
      "@/lib/story-stage-figure": figure,
      "@/lib/story-stage-cargo": cargo,
    },
  );
  const element = { style: { setProperty() {}, removeProperty() {} }, dataset: {}, hidden: false };
  const stage = { querySelector: () => element, querySelectorAll: () => [element] };
  const state = new Map();
  const actor = { id: "mira", x: 36, bottom: 18, left: false };
  const cup = { id: "cup", art: "ale-cup-full", x: 42, bottom: 29, width: 2.6 };
  const held = { ...cup, actor: "mira", wrist: true };
  const cue = (item) => ({ actors: [actor], cell: 21, items: [item] });
  const hands = (y) => new Map([["mira", { ...actor, wrist: { x: 70, y } }]]);
  itemPainter(stage, cue(cup), state)(hands(85), 650, false);
  const pickup = itemPainter(stage, cue(held), state);
  pickup(hands(85), 150, false);
  assert.notDeepEqual(state.get("cup").position, props.stageItemTarget(held, cue(held), hands(85)));
  pickup(hands(85), 650, false);
  const sip = { ...held, tilt: -20 };
  itemPainter(stage, cue(sip), state)(hands(73), 150, false);
  assert.deepEqual(state.get("cup").position, props.stageItemTarget(sip, cue(sip), hands(73)));
  assert.ok(state.get("cup").tilt < 0 && state.get("cup").tilt > -20);
  itemPainter(stage, cue(held), state)(hands(85), 150, false);
  assert.deepEqual(state.get("cup").position, props.stageItemTarget(held, cue(held), hands(85)));
});

test("an early tap drops cargo beneath its current carrier rather than its authored destination", () => {
  const { itemPainter } = evaluateSourceModule(
    compileSourceModule("../app/story-stage-item-motion.ts", import.meta.url),
    {
      "@/lib/story-stage-props": props,
      "@/lib/story-stage-figure": figure,
      "@/lib/story-stage-cargo": cargo,
    },
  );
  const element = { style: { setProperty() {}, removeProperty() {} }, dataset: {}, hidden: false };
  const stage = { querySelector: () => element, querySelectorAll: () => [element] };
  const state = new Map();
  const moss = { id: "moss", art: "moss", carrier: "cart", x: -8, bottom: 10, width: 2 };
  const cue = (item) => ({ actors: [], items: [item] });
  const positions = new Map([["item:cart", { x: 40, bottom: 40 }]]);
  itemPainter(stage, cue(moss), state)(positions, 650, false);
  const fallen = { ...moss, carrier: undefined, x: 65, bottom: 38, dropInPlace: true };
  const drop = itemPainter(stage, cue(fallen), state);
  for (const time of [0, 180, 400, 650]) {
    drop(positions, time, false);
    assert.equal(state.get("moss").position.x, 32);
  }
  assert.equal(state.get("moss").position.bottom, 38);
  itemPainter(stage, cue(fallen), state)(positions, 1000, false);
  assert.equal(state.get("moss").position.x, 32);
  assert.equal(state.get("moss").position.bottom, 38);
});

test("a picked-up sheet keeps resizing even if its hand starts at the same location", () => {
  const { itemPainter } = evaluateSourceModule(
    compileSourceModule("../app/story-stage-item-motion.ts", import.meta.url),
    {
      "@/lib/story-stage-props": props,
      "@/lib/story-stage-figure": figure,
      "@/lib/story-stage-cargo": cargo,
    },
  );
  const element = { style: { setProperty() {}, removeProperty() {} }, dataset: {}, hidden: false };
  const stage = { querySelector: () => element, querySelectorAll: () => [element] };
  const state = new Map();
  const actor = { id: "leon", x: 40, bottom: 14, left: false };
  const sheet = { id: "ledger", art: "paper", x: 40, bottom: 20, width: 6 };
  const cue = (item) => ({ actors: [actor], items: [item] });
  const positions = new Map([["leon", actor]]);
  itemPainter(stage, cue(sheet), state)(positions, 650, false);
  const held = { ...sheet, actor: "leon", x: 0, width: 3.5, resizeMs: 650 };
  const pickup = itemPainter(stage, cue(held), state);
  pickup(positions, 0, false);
  assert.equal(element.style.width, "6%");
  assert.equal(state.get("ledger").settled, false);
  pickup(positions, 325, false);
  assert.equal(element.style.width, "4.75%");
  pickup(positions, 650, false);
  assert.equal(element.style.width, "3.5%");
  assert.equal(state.get("ledger").settled, true);
});
