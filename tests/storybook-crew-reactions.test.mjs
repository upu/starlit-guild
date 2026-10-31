import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

test("reaction poses share the standing body scale, while deep inspection remains low and uncut", async () => {
  for (const [name, height] of [
    ["mira-reaction-v1", 126],
    ["lico-reaction-ponytail-v1", 128],
    ["finn-reaction-balanced-v2", 148],
  ]) {
    const frames = JSON.parse(
      await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"),
    );
    assert.equal(frames.length, 4);
    assert.equal(new Set(frames.map((f) => f.scale)).size, 1);
    assert.equal(frames[0].height, height);
    assert.ok(frames.slice(0, 3).every((f) => Math.abs(f.height - height) <= 3));
    assert.ok(frames[3].height < height * 0.82);
    const { data, info } = await sharp(`public/storybook-study/${name}.webp`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++)
        if (x % 192 === 0 || x % 192 === 191 || y === 0 || y === 191)
          assert.ok(data[(y * info.width + x) * 4 + 3] <= 16, name);
  }
});
