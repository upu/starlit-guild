import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { optimizeScenery } from "../scripts/optimize-scenery.mjs";
import { allQuests } from "../lib/game.ts";
import { questScenery } from "../lib/scenery.ts";

test("generated variants are fresh and every quest resolves to an existing file", async () => {
  await optimizeScenery({ check: true, log: () => {} });
  for (const quest of allQuests) {
    const paths = ["thumbnail", "detail", "background"].map((variant) =>
      questScenery(quest, variant),
    );
    assert.equal(new Set(paths).size, 3);
    for (const file of paths)
      assert.ok(existsSync(new URL("../public" + file, import.meta.url)), file);
  }
  const manifest = JSON.parse(
    readFileSync(new URL("../assets/scenery.manifest.json", import.meta.url)),
  );
  for (const [name, file] of Object.entries(manifest.files)) {
    const thumbnail = await sharp(
      fileURLToPath(
        new URL("../public/scenery/" + name.replace(".png", "-thumbnail.webp"), import.meta.url),
      ),
    ).metadata();
    assert.equal(thumbnail.width, 320);
    assert.equal(thumbnail.height, 320);
    assert.ok(file.outputs.thumbnail.bytes < file.sourceBytes / 10);
  }
});

test("pipeline detects source, config and output changes and regenerates without touching sources", async () => {
  const base = mkdtempSync(path.join(tmpdir(), "starlit-scenery-"));
  try {
    mkdirSync(path.join(base, "assets/source/scenery"), { recursive: true });
    mkdirSync(path.join(base, "config"));
    const config = path.join(base, "config/scenery-images.json"),
      source = path.join(base, "assets/source/scenery/sample.png");
    writeFileSync(config, readFileSync(new URL("../config/scenery-images.json", import.meta.url)));
    await sharp({ create: { width: 1000, height: 700, channels: 3, background: "#496c31" } })
      .png()
      .toFile(source);
    const original = readFileSync(source),
      run = (check) => optimizeScenery({ base, check, log: () => {} });
    await assert.rejects(run(true), /未更新/);
    await run(false);
    await run(true);
    assert.deepEqual(readFileSync(source), original);
    writeFileSync(path.join(base, "public/scenery/sample-thumbnail.webp"), "broken");
    await assert.rejects(run(true), /未更新/);
    await run(false);
    const profiles = JSON.parse(readFileSync(config));
    profiles.thumbnail.quality = 60;
    writeFileSync(config, JSON.stringify(profiles));
    await assert.rejects(run(true), /未更新/);
    await run(false);
    await run(true);
    await sharp({ create: { width: 1000, height: 700, channels: 3, background: "#124431" } })
      .png()
      .toFile(source);
    await assert.rejects(run(true), /未更新/);
    await run(false);
    await run(true);
    rmSync(path.join(base, "public/scenery/sample-detail.webp"));
    await assert.rejects(run(true), /未更新/);
    await run(false);
    await run(true);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
