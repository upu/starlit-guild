import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue as cue, sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget, stageItemDepth } from "../lib/story-stage-props.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
import * as props from "../lib/story-stage-props.ts";
import * as figure from "../lib/story-stage-figure.ts";
import * as cargo from "../lib/story-stage-cargo.ts";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";

test("the diner has three small cups and unloaded luggage before its still begins", () => {
  const value = cue("berne-road-departure", 0);
  const cups = value.items.filter((p) => p.art === "teacup");
  assert.equal(cups.length, 3);
  assert.ok(cups.every((p) => p.width <= 3 && p.support === "table"));
  const positions = new Map(value.actors.map((a) => [a.id, sampleStageActor(a, a, 5000)]));
  const table = value.items.find((p) => p.id === "table");
  for (const cup of cups)
    assert.ok(stageItemDepth(cup, value, positions) > stageItemDepth(table, value, positions));
  for (const art of ["medicine-closed", "delivery-bag", "basket"]) {
    const bag = value.items.find((p) => p.art === art);
    assert.ok(bag && !bag.actor && !bag.support && bag.width <= 8);
    const restBag = cue("berne-road-return", 13).items.find((p) => p.art === art);
    assert.equal(restBag.width, bag.width, "travel gear keeps its size at the roadside rest");
  }
  assert.equal(cue("berne-road-departure", 5), null);
});

test("Finn sits before retrieving the receipt and turns it only after Leon arrives", () => {
  const start = cue("berne-road-return", 0);
  assert.equal(start.background, "berne-overlook");
  assert.equal(stageCameraCue(start).cameraScale, 0.72);
  assert.equal(start.actors.find((a) => a.id === "finn").seated, false);
  assert.ok(start.sequence[0].actors.find((a) => a.id === "finn").perch);
  assert.ok(!start.sequence[0].items.some((p) => p.id === "shipping-receipt"));
  assert.ok(start.sequence[1].items.some((p) => p.id === "shipping-receipt"));
  const turn = cue("berne-road-return", 10);
  const leon = turn.actors.find((a) => a.id === "leon");
  assert.ok(
    turn.sequence[0].after >
      journeyDuration(
        leon,
        cue("berne-road-return", 9).actors.find((a) => a.id === "leon"),
      ) +
        400,
  );
  const moments = [turn, ...turn.sequence.map((s) => ({ ...turn, ...s }))];
  const papers = moments.map((s) => s.items.find((p) => p.id === "shipping-receipt"));
  assert.deepEqual(
    papers.map((p) => p.art),
    ["receipt-front", "receipt-front", "receipt-back"],
  );
  assert.deepEqual(
    papers.map((p) => p.turn),
    [0, 90, 180],
  );
  assert.equal(new Set(papers.map((p) => p.width)).size, 1);
  const targets = moments.map((s, i) =>
    stageItemTarget(
      papers[i],
      s,
      new Map(s.actors.map((a) => [a.id, sampleStageActor(a, a, 5000)])),
    ),
  );
  assert.deepEqual(targets[0], targets[1]);
  assert.deepEqual(targets[1], targets[2]);
  assert.equal(
    cue("berne-road-return", 11).items.find((p) => p.id === "shipping-receipt").art,
    "receipt-back",
  );
});

test("flat prop turning preserves location and size, including interrupted and reduced motion", () => {
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
  const value = (turn) => ({
    actors: [],
    items: [{ id: "paper", art: "receipt-front", x: 50, bottom: 20, width: 6, turn }],
  });
  const paint = (turn) => itemPainter(stage, value(turn), state);
  paint(0)(new Map(), 650, false);
  const rotating = paint(90);
  rotating(new Map(), 325, false);
  assert.match(element.style.transform, /rotateY\(45deg\)/);
  assert.equal(element.style.width, "6%");
  assert.equal(element.style.left, "50%");
  assert.equal(element.style.bottom, "20%");
  paint(180)(new Map(), 0, false);
  assert.match(
    element.style.transform,
    /rotateY\(45deg\)/,
    "interruption continues from displayed angle",
  );
  paint(180)(new Map(), 0, true);
  assert.match(element.style.transform, /rotateY\(180deg\)/);
});
