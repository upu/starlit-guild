import { test } from "node:test";
import assert from "node:assert/strict";
import { RoadWorkCaption } from "../app/phaser/road-work-caption.ts";
import { RoadLabelLayout, roadRectsOverlap } from "../lib/road-label-layout.ts";

test("enemy names avoid the measured work caption, including wrapped text after resize", () => {
  const original = globalThis.document;
  const element = { style: {}, offsetWidth: 180, offsetHeight: 20 };
  const host = {
    clientWidth: 390,
    clientHeight: 600,
    appendChild: (e) => {
      e.parentElement = host;
    },
  };
  globalThis.document = { createElement: () => element };
  try {
    const caption = new RoadWorkCaption({
      game: { canvas: { parentElement: host } },
      events: { once() {} },
    });
    const state = { gathering: {} };
    const look = { work: { label: "取引先に頼まれた薬草" }, workers: ["aria"] };
    caption.paint(state, look, 180, 400);
    assert.deepEqual(caption.bounds, { x: 90, y: 412, width: 180, height: 20 });
    const label = {
      key: "slime",
      owner: 1,
      text: "スライム",
      anchor: { x: 245, y: 420 },
      width: 48,
      height: 18,
    };
    const layout = new RoadLabelLayout();
    const at = layout.place([label], [caption.bounds], 390, 600).get("slime");
    assert.ok(at && !roadRectsOverlap(at, caption.bounds));

    host.clientWidth = 320;
    element.offsetWidth = 220;
    element.offsetHeight = 40;
    caption.paint(state, look, 160, 400);
    assert.deepEqual(caption.bounds, { x: 50, y: 412, width: 220, height: 40 });
    const resized = layout.place([label], [caption.bounds], 320, 600).get("slime");
    assert.ok(resized && !roadRectsOverlap(resized, caption.bounds));

    const crouchingHero = { x: 140, y: 410, width: 40, height: 45 };
    const health = { x: 138, y: 459, width: 44, height: 7 };
    caption.paint(state, look, 160, 400, [crouchingHero, health]);
    assert.ok(!roadRectsOverlap(caption.bounds, crouchingHero));
    assert.ok(!roadRectsOverlap(caption.bounds, health));
    assert.equal(element.style.top, `${caption.bounds.y}px`);
    const enemy = layout
      .place([label], [caption.bounds, crouchingHero, health], 320, 600)
      .get("slime");
    assert.ok(enemy && !roadRectsOverlap(enemy, caption.bounds));

    caption.paint(state, { ...look, workers: [] }, 160, 400);
    assert.equal(caption.bounds, undefined);
    assert.equal(element.hidden, true);
    caption.paint({ gathering: undefined }, look, 160, 400);
    assert.equal(caption.bounds, undefined);
  } finally {
    if (original === undefined) delete globalThis.document;
    else globalThis.document = original;
  }
});

test("the work caption clears visible waterway workers as they move", () => {
  const original = globalThis.document;
  const element = { style: {}, offsetWidth: 180, offsetHeight: 20 };
  const host = {
    clientWidth: 390,
    clientHeight: 260,
    appendChild: (e) => {
      e.parentElement = host;
    },
  };
  globalThis.document = { createElement: () => element };
  try {
    let worker = { x: 160, y: 140, width: 45, height: 55 };
    const keeper = { x: 310, y: 135, width: 40, height: 60 };
    const caption = new RoadWorkCaption({
      game: { canvas: { parentElement: host } },
      events: { once() {} },
    });
    const state = { gathering: {} },
      look = { work: { label: "苔の籠を荷車へ運ぶ" }, workers: ["leon"] };
    for (const x of [160, 190, 220]) {
      worker = { ...worker, x };
      caption.paint(state, look, 220, 155, [worker, keeper]);
      assert.ok(caption.bounds, "caption stays visible");
      assert.ok(!roadRectsOverlap(caption.bounds, worker));
      assert.ok(!roadRectsOverlap(caption.bounds, keeper));
    }
  } finally {
    if (original === undefined) delete globalThis.document;
    else globalThis.document = original;
  }
});
