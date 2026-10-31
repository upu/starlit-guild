import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { stories } from "../lib/stories.ts";
import { storyCastImages } from "../lib/storybook/stage-images.ts";

const records = JSON.parse(
  await readFile("public/storybook-study/common-props-v1-metrics.json", "utf8"),
);
async function visibleBounds(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width,
    right = -1,
    top = info.height,
    bottom = -1;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 128) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  return {
    left,
    right,
    top,
    bottom,
    width: right - left + 1,
    height: bottom - top + 1,
    canvas: info,
  };
}

test("new common props stay inside the old visible footprint and retain the bottom contact", async () => {
  assert.equal(records.length, 15);
  for (const r of records) {
    const b = await visibleBounds(r.output),
      old = await visibleBounds(r.reference);
    const fit = Math.min(r.canvas.width / old.canvas.width, r.canvas.height / old.canvas.height);
    const oldLeft = (r.canvas.width - old.canvas.width * fit) / 2 + old.left * fit;
    const oldTop = (r.canvas.height - old.canvas.height * fit) / 2 + old.top * fit;
    const oldBottom = oldTop + old.height * fit;
    assert.ok(b.width > 4 && b.height > 4, `${r.art} is visible`);
    assert.ok(
      b.left >= oldLeft - 3 && b.right < oldLeft + old.width * fit + 3,
      `${r.art} keeps its width`,
    );
    assert.ok(Math.abs(b.bottom + 1 - oldBottom) < 3, `${r.art} keeps its ground/palm contact`);
    assert.ok(b.top >= oldTop - 3, `${r.art} does not grow above its old outline`);
    assert.ok(b.left >= 0 && b.top >= 0 && b.right < r.canvas.width && b.bottom < r.canvas.height);
  }
});

test("flat and dragged cloth keep distinct silhouettes, and a half roll is its own prop", async () => {
  const byArt = Object.fromEntries(records.map((r) => [r.art, r]));
  const flat = await visibleBounds(byArt["packing-cloth"].output);
  const dragged = await visibleBounds(byArt["dragging-cloth"].output);
  assert.ok(flat.height / flat.width < 0.4);
  assert.ok(dragged.height / dragged.width > 0.45);
  assert.notEqual(byArt["bread"].source, byArt["bread-half"].source);
  assert.notEqual(byArt["dish"].source, byArt["moss"].source);
});

test("the shared luggage is prepared before its visible standing and carried states", () => {
  for (const id of [
    "village-trade-departure",
    "evening-trade-road-departure",
    "medicine-packing-return",
  ]) {
    assert.ok(
      storyCastImages(stories.find((s) => s.id === id)).includes(
        "/storybook-study/common-travel-bundle-v1.webp",
      ),
    );
  }
});
