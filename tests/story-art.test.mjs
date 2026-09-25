import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { storyArt, storyArtAt } from "../lib/story-art.ts";
import { optimizeStoryStills } from "../scripts/optimize-story-stills.mjs";
import { stories, availableStories } from "../lib/stories.ts";
import { initialState, act } from "../lib/game.ts";
import { nextStage } from "../lib/prologue.ts";

test("every story illustration exists with its declared dimensions and a valid reveal point", async () => {
  await optimizeStoryStills({ check: true, log: () => {} });
  for (const [id, art] of Object.entries(storyArt)) {
    const scene = stories.find((st) => st.id === id);
    assert.ok(scene, id);
    assert.ok(art.revealAtLine >= 0 && art.revealAtLine < scene.lines.length, id);
    for (let line = 0; line < scene.lines.length; line++) {
      assert.equal(
        storyArtAt(id, line),
        line >= art.revealAtLine ? art : undefined,
        `${id}: line ${line}`,
      );
    }
    assert.equal(storyArtAt(id, Infinity), art, `${id}: available for the read-story gallery`);
    assert.ok(art.alt.trim().length > 0, id);
    assert.match(art.src, /^\/stories\/[a-z-]+\.webp$/);
    const bytes = await readFile(new URL("../public" + art.src, import.meta.url));
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF", id);
    const image = await sharp(bytes).metadata();
    assert.equal(image.format, "webp", id);
    assert.equal(image.width, art.width, id);
    assert.equal(image.height, art.height, id);
  }
});

test("still pipeline rejects stale output and preserves the original PNG", async () => {
  mkdirSync("work", { recursive: true });
  const base = mkdtempSync(path.join(process.cwd(), "work/starlit-stills-"));
  try {
    mkdirSync(path.join(base, "assets/source/stories"), { recursive: true });
    mkdirSync(path.join(base, "config"));
    const source = path.join(base, "assets/source/stories/sample.png");
    writeFileSync(
      path.join(base, "config/story-stills.json"),
      readFileSync(new URL("../config/story-stills.json", import.meta.url)),
    );
    await sharp({ create: { width: 640, height: 480, channels: 3, background: "#624a78" } })
      .png()
      .toFile(source);
    const original = readFileSync(source);
    const run = (check) => optimizeStoryStills({ base, check, log: () => {} });
    await assert.rejects(run(true), /未更新/);
    await run(false);
    await run(true);
    assert.ok(existsSync(path.join(base, "public/stories/sample.webp")));
    const thumb = await sharp(
      readFileSync(path.join(base, "public/stories/thumbnails/sample.webp")),
    ).metadata();
    assert.deepEqual([thumb.width, thumb.height], [320, 320]);
    writeFileSync(path.join(base, "public/stories/sample.webp"), "broken");
    await assert.rejects(run(true), /未更新/);
    await run(false);
    await run(true);
    assert.deepEqual(readFileSync(source), original);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("the first departure has its illustration, and unknown scenes have none", () => {
  const fresh = initialState(1000),
    opening = nextStage(fresh).quest;
  const state = act(fresh, { type: "start", id: opening }, 1000);
  assert.ok(availableStories(state).some((st) => st.id === opening + "-departure"));
  // The opening scene's illustration belongs to its ending, after the handover.
  assert.equal(storyArtAt(opening + "-departure", Infinity), undefined);
  assert.ok(storyArtAt(opening + "-return", Infinity));
  assert.equal(storyArtAt("unknown-story", 0), undefined);
});
