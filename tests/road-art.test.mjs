import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { optimizeRoadArt } from "../scripts/optimize-road-art.mjs";

test("road WebP atlases retain dimensions, transparency and every visible source pixel", async () => {
  const manifest = await optimizeRoadArt({ check: true, log: () => {} });
  for (const [name, entry] of Object.entries(manifest.files)) {
    const source = await sharp(`assets/source/road/${name}`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const output = await sharp(`public/animations/road/${entry.output}`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(output.info.width, source.info.width, name);
    assert.equal(output.info.height, source.info.height, name);
    for (let i = 0; i < source.data.length; i += 4) {
      assert.equal(output.data[i + 3], source.data[i + 3], name);
      if (source.data[i + 3])
        assert.ok(output.data.subarray(i, i + 3).equals(source.data.subarray(i, i + 3)), name);
    }
  }
  assert.ok(readdirSync("public/animations/road").every((name) => name.endsWith(".webp")));
});

test("road art checks reject changed sources and damaged outputs without modifying them", async () => {
  const base = mkdtempSync(path.join(tmpdir(), "starlit-road-art-")),
    sourceDir = path.join(base, "assets/source/road"),
    options = { base, log: () => {} };
  try {
    mkdirSync(sourceDir, { recursive: true });
    const source = path.join(sourceDir, "sample.png");
    await sharp({ create: { width: 8, height: 8, channels: 4, background: "#80aa6680" } })
      .png()
      .toFile(source);
    await optimizeRoadArt(options);
    const output = path.join(base, "public/animations/road/sample.webp"),
      before = readFileSync(output);
    await optimizeRoadArt({ ...options, check: true });
    assert.deepEqual(readFileSync(output), before);
    writeFileSync(output, "damaged");
    await assert.rejects(optimizeRoadArt({ ...options, check: true }), /未更新/);
    assert.equal(readFileSync(output, "utf8"), "damaged");
    await optimizeRoadArt(options);
    await sharp({ create: { width: 8, height: 8, channels: 4, background: "#aa806680" } })
      .png()
      .toFile(source);
    await assert.rejects(optimizeRoadArt({ ...options, check: true }), /未更新/);
    await optimizeRoadArt(options);
    await optimizeRoadArt({ ...options, check: true });
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
