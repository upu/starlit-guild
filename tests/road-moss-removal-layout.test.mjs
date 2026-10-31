import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { mossRemovalLayout } from "../lib/road-moss-removal-layout.ts";

test("moss scraping reaches the hatch without putting either actor inside its opening", () => {
  for (const width of [320, 374, 759, 936]) {
    const layout = mossRemovalLayout(width, (width * 2) / 3);
    const tip = layout.tip(1),
      rim = layout.project(1043, 637);
    assert.ok(Math.hypot(tip.x - rim.x, tip.y - rim.y) < 0.001);
    assert.ok(layout.aria.x < layout.project(1010, 637).x);
    assert.ok(layout.leon.y > layout.project(1100, 685).y);
    assert.ok(layout.leon.x - layout.aria.x > layout.figureScale * 85);
    // Equal source stones/body ratio at every width, including the narrow crop.
    assert.ok(Math.abs(layout.backdrop.width / 1536 / layout.figureScale - 1.085) < 0.001);
    assert.ok(layout.aria.y < (width * 2) / 3 && layout.leon.y < (width * 2) / 3);
    assert.ok(layout.aria.y - 134 * layout.figureScale > 0);
    assert.ok(layout.leon.y - 134 * layout.figureScale > 0);
    assert.ok(layout.basket.x > layout.aria.x);
    assert.ok(layout.tip(3).y < layout.basket.y - 28 * layout.figureScale);
  }
});

test("scraping atlas keeps a common scale and feet while crouching lower than standing", async () => {
  const file = "public/storybook-study/aria-moss-scrape-v1.webp";
  const metrics = JSON.parse(await readFile(file.replace(".webp", "-metrics.json"), "utf8"));
  assert.equal(metrics.length, 4);
  assert.equal(new Set(metrics.map((m) => m.scale)).size, 1);
  assert.ok(metrics.every((m) => m.baseline === 176));
  assert.ok(metrics.slice(1).every((m) => m.height < metrics[0].height * 0.85));
  assert.ok(
    Math.max(...metrics.slice(1).map((m) => m.height)) -
      Math.min(...metrics.slice(1).map((m) => m.height)) <=
      1,
  );
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
          "full hair, boots and spatula remain inside cells",
        );
});
