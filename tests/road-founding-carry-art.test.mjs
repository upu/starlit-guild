import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

test("the recipient's carrying cycle alternates its planted foot without clipped edges", async () => {
  const { data, info } = await sharp("public/storybook-study/merchant-carry-walk-v1.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 512);
  assert.equal(info.height, 128);
  const feet = [];
  for (let frame = 0; frame < 4; frame++) {
    const bottom = [-1, -1];
    for (let y = 0; y < 128; y++)
      for (let x = 0; x < 128; x++) {
        const alpha = data[(y * info.width + frame * 128 + x) * 4 + 3];
        if (x < 2 || x > 125 || y < 2 || y > 125)
          assert.equal(alpha, 0, `frame ${frame} touches a cell edge`);
        if (alpha > 128 && y >= 80) bottom[Number(x >= 64)] = Math.max(bottom[Number(x >= 64)], y);
      }
    feet.push(bottom);
  }
  assert.ok(feet[1][0] < feet[1][1] - 3, "the rear boot lifts while the front boot is planted");
  assert.ok(feet[3][1] < feet[3][0] - 3, "the front boot lifts while the rear boot is planted");
  const walk = JSON.parse(
    await readFile("public/storybook-study/merchant-carry-walk-v1-metrics.json"),
  );
  const turn = JSON.parse(
    await readFile("public/storybook-study/merchant-turn-carry-v2-metrics.json"),
  );
  assert.ok(walk.frames.every((frame) => Math.abs(frame.height - turn[3].height) <= 8));
  assert.ok(walk.frames.every((frame) => Math.abs(frame.headWidth - walk.referenceHeadWidth) <= 1));
});
