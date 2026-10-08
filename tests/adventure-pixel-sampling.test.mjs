import { test } from "node:test";
import assert from "node:assert/strict";
import { enemySampleSize } from "../lib/adventure-pixel-sampling.ts";
import { isolateSprite } from "../lib/sprite-silhouette.ts";

test("large and small enemies use the hero pixel pitch without changing display proportions", () => {
  assert.deepEqual(enemySampleSize(24, 24, 48), { width: 48, height: 48 });
  assert.deepEqual(enemySampleSize(120, 96, 48), { width: 240, height: 192 });
  assert.deepEqual(enemySampleSize(60, 48, 24), { width: 240, height: 192 });
});

test("enemy atlas isolation keeps attached weapons and soft edges, removes preceding-row scraps", () => {
  const data = new Uint8ClampedArray(40 * 40 * 4);
  const pixel = (x, y, alpha = 255) => {
    data[(y * 40 + x) * 4] = 180;
    data[(y * 40 + x) * 4 + 3] = alpha;
  };
  for (let y = 12; y < 32; y++) for (let x = 10; x < 25; x++) pixel(x, y);
  for (let x = 25; x < 35; x++) pixel(x, 20);
  pixel(9, 18, 48);
  for (let x = 12; x < 17; x++) pixel(x, 2);
  const context = { getImageData: () => ({ data }), putImageData: () => {} };
  isolateSprite({ width: 40, height: 40, getContext: () => context });
  assert.equal(data[(2 * 40 + 14) * 4 + 3], 0, "unrelated fragment removed");
  assert.equal(data[(20 * 40 + 34) * 4 + 3], 255, "attached weapon retained");
  assert.equal(data[(18 * 40 + 9) * 4 + 3], 48, "soft silhouette edge retained");
});
