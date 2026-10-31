import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import {
  foundingGrip,
  foundingPullAsset,
  foundingPullRestAsset,
} from "../lib/road-founding-grip.ts";
import { foundingCartBody } from "../lib/road-founding-wheel.ts";

test("each pulling pose keeps its head, feet and hand registered to the same scale", async () => {
  const metrics = JSON.parse(
    await readFile("public/storybook-study/finn-pull-contact-v1-metrics.json", "utf8"),
  );
  assert.equal(metrics.length, 4);
  assert.equal(new Set(metrics.map((m) => m.scale)).size, 1);
  assert.ok(metrics.every((m) => m.baseline === 176 && Math.abs(m.headX - 103) < 0.5));
  const { data, info } = await sharp(`public${foundingPullAsset}`)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.deepEqual([info.width, info.height], [768, 192]);
  for (let frame = 0; frame < 4; frame++) {
    const hand = [];
    for (let y = 95; y < 110; y++)
      for (let x = 36; x < 57; x++) {
        const index = (y * info.width + frame * 192 + x) * 4;
        const [r, g, b, a] = data.subarray(index, index + 4);
        if (a > 180 && r > 130 && r > g * 1.2 && g > b * 1.16 && g > 55 && b < 130)
          hand.push([x, y]);
      }
    assert.ok(hand.length > 50, `visible trailing hand in frame ${frame}`);
    const average = (axis) => hand.reduce((sum, point) => sum + point[axis], 0) / hand.length;
    assert.ok(Math.abs(average(0) - foundingGrip.handX) < 1);
    assert.ok(Math.abs(average(1) - foundingGrip.handY) < 1);
  }
});

test("the stopped pose plants both boots and keeps the same trailing hand", async () => {
  const metric = JSON.parse(
    await readFile("public/storybook-study/finn-pull-rest-v1-metrics.json", "utf8"),
  );
  assert.equal(metric.height, 148);
  assert.equal(metric.baseline, 176);
  assert.ok(Math.abs(metric.headX - 103) < 0.5);
  const { data, info } = await sharp(`public${foundingPullRestAsset}`)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const alpha = (x, y) => data[(y * info.width + x) * 4 + 3];
  assert.ok(alpha(82, 174) > 128 && alpha(121, 174) > 128, "both boots meet the ground");
  const hand = [];
  for (let y = 95; y < 110; y++)
    for (let x = 36; x < 57; x++) {
      const [r, g, b, a] = data.subarray((y * info.width + x) * 4, (y * info.width + x) * 4 + 4);
      if (a > 180 && r > 130 && r > g * 1.2 && g > b * 1.16 && g > 55 && b < 130) hand.push([x, y]);
    }
  assert.ok(hand.length > 50);
  for (const [axis, expected] of [
    [0, foundingGrip.handX],
    [1, foundingGrip.handY],
  ])
    assert.ok(
      Math.abs(hand.reduce((sum, point) => sum + point[axis], 0) / hand.length - expected) < 1,
    );
});

test("the shared grip lies on the visible crossbar in both cart bodies", async () => {
  for (const path of ["/storybook-study/garden-handcart-v2.webp", foundingCartBody]) {
    const { data, info } = await sharp(`public${path}`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const x = Math.round((foundingGrip.cartX + 0.5) * info.width);
    const y = Math.round((foundingGrip.cartY * (504 / 312) + 292 / 312) * info.height);
    assert.deepEqual([x, y], [450, 258]);
    assert.ok(data[(y * info.width + x) * 4 + 3] > 128, `${path} crossbar is visible`);
  }
});
