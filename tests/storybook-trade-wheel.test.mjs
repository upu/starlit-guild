import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { RoadWheelRotation } from "../lib/road-wheel-rotation.ts";
import { roadScale } from "../lib/road-layout.ts";
import {
  tradeCartBodies,
  tradeWheelLayout,
  tradeWheelLayoutFor,
} from "../lib/road-trade-cart-wheels.ts";

test("cart bodies retain their transparent canvas and existing grip locations", async () => {
  for (const [original, body] of Object.entries(tradeCartBodies)) {
    for (const path of [original, body]) {
      const { data, info } = await sharp(`public${path}`)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      assert.deepEqual([info.width, info.height], [420, 280]);
      const alpha = (x, y) => data[(y * info.width + x) * 4 + 3];
      assert.equal(alpha(0, 0), 0);
      assert.equal(alpha(419, 279), 0);
      const grips = path.includes("brekka-medical-cart")
        ? [
            [13, 121],
            [405, 205],
            [382, 237],
          ]
        : [
            [13, 121],
            [390, 200],
            [390, 240],
          ];
      for (const [x, y] of grips)
        assert.ok(alpha(x, y) > 128, `${path}: missing grip at ${x},${y}`);
    }
  }
});

test("trade wheel angles follow travel and remain still while stopped or motion is reduced", () => {
  for (const width of [374, 936]) {
    const wheel = new RoadWheelRotation(tradeWheelLayout.front.diameter);
    const update = (x, time, moving = true, reduced = false) =>
      wheel.update(x, time, width, "forest", 100, moving, reduced);
    assert.equal(update(100, 0), 0);
    const moved = update(120, 1000);
    const expected =
      (20 * roadScale(width, "forest")) / ((100 * tradeWheelLayout.front.diameter) / 2);
    assert.ok(Math.abs(moved - expected) < 1e-10);
    assert.equal(update(120, 2000), moved);
    assert.equal(update(140, 3000, false), moved);
    assert.equal(update(140, 4000), moved, "returning to the grip does not spin a stationary cart");
    assert.equal(update(145, 5000, true, true), 0);
    assert.equal(update(145, 6000), moved, "leaving reduced motion does not jump");
    assert.ok(tradeWheelLayout.front.diameter > tradeWheelLayout.rear.diameter);
  }
});

test("the visiting cart retains the original higher far wheel", () => {
  const layout = tradeWheelLayoutFor("/storybook-study/brekka-medical-cart-v1.webp");
  assert.equal(layout.front, tradeWheelLayout.front);
  assert.equal(layout.rear.y, (197 - 268) / 420);
  assert.equal(tradeWheelLayoutFor("/storybook-study/loaded-cart-v1.webp"), tradeWheelLayout);
});

test("the waterway tool cart retains the original shafts and the higher rear-wheel position", async () => {
  const original = "/storybook-study/waterway-tool-cart-v1.webp";
  const body = tradeCartBodies[original];
  assert.equal(body, "/storybook-study/waterway-tool-cart-body-v1.webp");
  assert.equal(tradeWheelLayoutFor(original).rear.y, (195 - 268) / 420);
  const pixels = await Promise.all(
    [original, body].map((path) =>
      sharp(`public${path}`)
        .ensureAlpha()
        .extract({ left: 310, top: 0, width: 110, height: 280 })
        .raw()
        .toBuffer(),
    ),
  );
  for (let i = 0; i < pixels[0].length; i += 4) {
    assert.equal(pixels[0][i + 3], pixels[1][i + 3]);
    if (pixels[0][i + 3])
      assert.deepEqual(pixels[0].subarray(i, i + 3), pixels[1].subarray(i, i + 3));
  }
});
