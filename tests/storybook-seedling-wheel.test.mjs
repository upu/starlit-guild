import { test } from "node:test";
import assert from "node:assert/strict";
import { SeedlingWheelRotation } from "../lib/road-seedling-wheel.ts";
import { roadScale } from "../lib/road-layout.ts";

test("seedling cart wheels follow travelled distance, not elapsed time", () => {
  for (const width of [374, 936]) {
    const wheel = new SeedlingWheelRotation();
    const size = 100;
    const update = (x, time, moving = true, reduced = false) =>
      wheel.update(x, time, width, "forest", size, moving, reduced);
    assert.equal(update(100, 0), 0);
    const expected = (20 * roadScale(width, "forest")) / (size * 0.11);
    assert.ok(Math.abs(update(120, 1000) - expected) < 1e-10);
    assert.equal(update(120, 2000), expected, "stationary wheel does not spin");
    assert.equal(update(125, 2000), expected, "a paused clock does not spin the wheel");
    assert.equal(update(120, 3000, false), expected);
    assert.equal(update(140, 4000, false), expected, "combat or stopped work does not spin");
    assert.equal(update(140, 5000), expected, "resuming first establishes position");
    assert.ok(update(130, 6000) < expected, "moving backwards reverses rotation");
  }
});

test("wheel movement ignores teleports, resize, hidden frames and reduced motion", () => {
  const wheel = new SeedlingWheelRotation();
  const update = (x, time, width = 374, reduced = false) =>
    wheel.update(x, time, width, "forest", 100, true, reduced);
  update(0, 0);
  const angle = update(10, 100);
  assert.equal(update(10000, 200), angle, "a scene jump must not spin the wheel");
  assert.equal(update(10010, 300, 936), angle, "viewport changes reset the anchor");
  wheel.hide();
  assert.equal(update(12000, 400, 936), angle, "reappearance resets the anchor");
  assert.equal(update(12010, 500, 936, true), 0, "reduced motion uses a still wheel");
  assert.equal(update(12020, 600, 936), angle, "returning from reduced motion does not jump");
});
