import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { waterwayWorkerFrame } from "../lib/road-waterway.ts";

test("worker keeps the saw during a combat pause and signals before drainage", () => {
  assert.equal(waterwayWorkerFrame(2, 450, false, false), 0);
  assert.equal(waterwayWorkerFrame(4, 0, false, false), 1);
  assert.equal(waterwayWorkerFrame(4, 450, false, false), 2);
  assert.equal(waterwayWorkerFrame(5, 450, false, true), 1);
  assert.equal(waterwayWorkerFrame(7, 450, true, false), 1);
  assert.equal(waterwayWorkerFrame(8, 450, false, false), 3);
  assert.equal(waterwayWorkerFrame(9, 450, false, false), 0);
});

test("worker crouches retain standing scale, planted feet and full saw silhouettes", async () => {
  const file = "public/storybook-study/waterway-worker-v1.webp";
  const metrics = JSON.parse(await readFile(file.replace(".webp", "-metrics.json"), "utf8"));
  assert.equal(new Set(metrics.map((m) => m.scale)).size, 1);
  assert.ok(metrics[1].height < metrics[0].height * 0.85);
  assert.ok(metrics[2].height < metrics[0].height * 0.85);
  assert.ok(metrics.every((m) => m.baseline === 176));
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 1024);
  assert.equal(info.height, 192);
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (x % 256 < 2 || x % 256 > 253 || y < 2 || y > 189)
        assert.ok(
          data[(y * info.width + x) * 4 + 3] <= 16,
          "saw, hair and feet stay inside their own cell",
        );
});
