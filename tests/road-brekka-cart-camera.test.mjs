import { test } from "node:test";
import assert from "node:assert/strict";
import { BrekkaCartCamera } from "../lib/road-brekka-cart-camera.ts";
import { roadHeroSize, roadScale, roadX } from "../lib/road-layout.ts";

for (const [width, height] of [
  [936, 624],
  [390, 700],
])
  test(`the cart crosses the courtyard before the camera follows at ${width}x${height}`, () => {
    const view = { width, height },
      camera = new BrekkaCartCamera();
    const start = 1000,
      offset = (width * 0.2) / roadScale(width);
    const first = camera.update(start, view, "forest");
    const later = camera.update(start + offset, view, "forest");
    assert.equal(later, first, "the background is fixed during the first part of the walk");
    assert.ok(roadX(start + offset, later, width) > roadX(start, first, width));
    const far = start + width / roadScale(width);
    const following = camera.update(far, view, "forest");
    assert.ok(following > first);
    assert.ok(roadX(far, following, width) <= width * 0.64);
    camera.reset();
    assert.equal(camera.update(far, view, "forest"), far, "a new yard begins centred on the cart");
  });

for (const [width, height] of [
  [936, 624],
  [390, 700],
])
  test(`combat camera fits the party and enemies when the formation fits at ${width}x${height}`, () => {
    const view = { width, height },
      camera = new BrekkaCartCamera(),
      scale = roadScale(width);
    const positions = [1000 - (width * 0.15) / scale, 1000 + (width * 0.5) / scale];
    const x = camera.update(1000, view, "forest", positions);
    const margin = roadHeroSize(width, height) * 0.85;
    for (const p of positions) {
      const drawn = roadX(p, x, width);
      assert.ok(drawn >= margin - 0.01 && drawn <= width - margin + 0.01);
    }
  });
