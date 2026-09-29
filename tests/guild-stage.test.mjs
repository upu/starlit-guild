import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { guildRoute, guildStageLayout } from "../lib/guild-stage-model.ts";
import { guildArtFrames } from "../lib/guild-art-frames.ts";

test("guild routes stop at work points and reduced motion stays at the starting point", () => {
  const start = guildRoute(0, "home", 0, false);
  assert.equal(guildRoute(0, "home", 5000, false).walking, false);
  assert.equal(guildRoute(0, "home", 7000, false).walking, true);
  assert.equal(guildRoute(0, "home", 12000, false).walking, false);
  assert.equal(guildRoute(0, "home", 19000, false).walking, true);
  assert.deepEqual(guildRoute(0, "home", 24000, false), start);
  assert.deepEqual(guildRoute(0, "home", 19000, true), start);
  for (let t = 0; t < 24000; t += 100) {
    const p = guildRoute(0, "linde", t, false);
    for (const id of ["linde-1", "linde-2"]) {
      const bed = guildStageLayout.plots[id];
      const inside =
        Math.abs(p.x - bed.x) < bed.width / 2 &&
        p.y < bed.y &&
        p.y > bed.y - (bed.width * 261) / 448;
      assert.equal(inside, false, `${t}: caretaker must walk around ${id}`);
    }
  }
  const { worker, bench } = guildStageLayout;
  assert.ok(
    worker.x < bench.x - bench.width / 2,
    "worker stands beside the counter, not inside its footprint",
  );
});

test("guild character atlases have four distinct walk silhouettes and preserve transparent edges", async () => {
  for (const id of ["finn-guild-v2", "lico-guild-v2"]) {
    const path = `public/guild/${id}.webp`,
      meta = await sharp(path).metadata();
    assert.equal(meta.hasAlpha, true);
    assert.equal(guildArtFrames[id].length, 8);
    const hashes = [];
    for (const rect of guildArtFrames[id].slice(0, 4)) {
      const [left, top, width, height] = rect;
      assert.ok(left >= 0 && top >= 0 && left + width <= meta.width && top + height <= meta.height);
      const feet = await sharp(path)
        .extract({
          left,
          top: top + Math.floor(height * 0.7),
          width,
          height: height - Math.floor(height * 0.7),
        })
        .resize(128, 64)
        .raw()
        .toBuffer();
      hashes.push(createHash("sha256").update(feet).digest("hex"));
    }
    assert.equal(new Set(hashes).size, 4, `${id}: walk frames must not reuse the same feet`);
  }
});
