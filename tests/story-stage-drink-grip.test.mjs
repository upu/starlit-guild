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
