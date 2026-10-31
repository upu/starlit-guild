import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { FoundingCarryTurn, foundingTurnArt } from "../lib/road-founding-carry-turn.ts";
import { roadDepth, roadHeroSize, roadScale } from "../lib/road-layout.ts";
import { waterwayPalm } from "../lib/road-waterway-contacts.ts";

test("turn frames keep both hands and the established Finn baseline", async () => {
  const hands = {
    finn: [
      [1, 115, 102],
      [2, 89, 100],
      [2, 103, 100],
    ],
    leon: [
      [1, 118, 107],
      [2, 89, 100],
      [2, 103, 100],
    ],
    aria: [
      [1, 113, 112],
      [2, 92, 113],
      [2, 100, 113],
    ],
    mira: [
      [1, 115, 123],
      [2, 93, 126],
      [2, 99, 126],
    ],
  };
  for (const [id, { asset, cell }] of Object.entries(foundingTurnArt)) {
    const { data, info } = await sharp(`public${asset}`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.deepEqual([info.width, info.height], [cell * 4, 192]);
    const pixel = (frame, x, y) =>
      data.subarray(
        (y * info.width + frame * cell + x) * 4,
        (y * info.width + frame * cell + x) * 4 + 4,
      );
    const positions = hands[id];
    for (const [frame, x, y] of positions) {
      const [r, g, b, a] = pixel(frame, x, y);
      assert.ok(a > 200 && r > g && g > b, `${asset}: frame ${frame} retains a visible hand`);
    }
    for (let frame = 0; frame < 4; frame++) {
      for (let x = 0; x < cell; x++) assert.equal(pixel(frame, x, 191)[3], 0);
      for (let y = 0; y < 192; y++) assert.equal(pixel(frame, 0, y)[3], 0);
      if (asset.includes("finn")) {
        let left = 192,
          right = -1;
        for (let y = 28; y < 65; y++)
          for (let x = 0; x < 192; x++)
            if (pixel(frame, x, y)[3] > 128) {
              left = Math.min(left, x);
              right = Math.max(right, x);
            }
        assert.ok(
          right - left + 1 <= 56,
          `Finn's head stays close to his standing poses in frame ${frame}`,
        );
      }
      if (id === "mira") {
        let left = 192,
          right = -1;
        for (let y = 50; y < 82; y++)
          for (let x = 0; x < 192; x++)
            if (pixel(frame, x, y)[3] > 128) {
              left = Math.min(left, x);
              right = Math.max(right, x);
            }
        assert.ok(
          right - left + 1 <= 70,
          `Mira's head stays close to her walking poses in frame ${frame}`,
        );
      }
    }
  }
  const metrics = JSON.parse(
    await (
      await import("node:fs/promises")
    ).readFile("public/storybook-study/finn-founding-turn-v1-metrics.json", "utf8"),
  );
  assert.ok(metrics.every((m) => m.baseline === 176 && Math.abs(m.height - 148) <= 1));
  const miraMetrics = JSON.parse(
    await (
      await import("node:fs/promises")
    ).readFile("public/storybook-study/mira-founding-turn-v1-metrics.json", "utf8"),
  );
  assert.ok(miraMetrics.every((m) => m.baseline === 176 && Math.abs(m.height - 125) <= 1));
});

for (const id of ["finn", "leon", "aria", "mira"])
  for (const start of [-1, 1])
    test(`${id} turns in place from ${start} with the object on each pose`, () => {
      const turn = new FoundingCarryTurn();
      const view = { width: 390, height: 260 };
      const hero = { id, x: 100, lane: 0.6, facing: -start, walking: true };
      let previous,
        previousFacing = start;
      const seen = new Set();
      for (const time of [0, 100, 200, 300]) {
        hero.facing = -start;
        const result = turn.pose(hero, time, previousFacing, true, 0);
        assert.ok(result);
        assert.equal(hero.walking, false);
        assert.deepEqual(
          turn.target({ x: 200, lane: 1 }),
          time < 300 ? { x: 100, lane: 0.6 } : { x: 200, lane: 1 },
        );
        const point = waterwayPalm(hero, result.palm, hero.facing, view);
        if (previous) {
          const movement = Math.hypot(
            (point.x - previous.x) * roadScale(view.width),
            (point.lane - previous.lane) * roadDepth(view.width, view.height),
          );
          assert.ok(movement < roadHeroSize(view.width, view.height) * 0.3);
        }
        previous = point;
        previousFacing = hero.facing;
        seen.add(result.pose.frame);
      }
      assert.ok(seen.has(1) && seen.has(2));
      assert.equal(hero.facing, -start);
    });
