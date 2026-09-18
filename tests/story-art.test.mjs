import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { storyArt, storyArtAt } from "../lib/story-art.ts";
import { optimizeStoryStills } from "../scripts/optimize-story-stills.mjs";
import { stories, availableStories } from "../lib/stories.ts";
import { initialPrologueState, act } from "../lib/game.ts";
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

test("the moss illustration waits until the caretaker has allowed the sample and the container glows", () => {
  const scene = stories.find((st) => st.id === "tower-road-return"),
    art = storyArt[scene.id];
  const permission = scene.lines.findIndex((line) => line.text.includes("ひとつまみで足りる"));
  const glow = scene.lines.findIndex((line) => line.text.includes("入れ物の中で柔らかく光った"));
  assert.ok(permission >= 0 && permission < glow);
  assert.equal(art.revealAtLine, glow);
  assert.equal(storyArtAt(scene.id, glow - 1), undefined);
  assert.equal(storyArtAt(scene.id, glow), art);
});

test("forest comparison art waits for Aria to lift both samples toward her face", () => {
  const scene = stories.find((st) => st.id === "forest-wetland-return"),
    art = storyArt[scene.id];
  const comparison = scene.lines.findIndex((line) => line.text.includes("顔の近くまで持ち上げた"));
  assert.equal(art.revealAtLine, comparison);
  assert.equal(storyArtAt(scene.id, comparison - 1), undefined);
  assert.equal(storyArtAt(scene.id, comparison), art);
});

test("the first-act climax waits for the beacon to light after the moss removal", () => {
  const scene = stories.find((st) => st.id === "tower-moss-removal-return"),
    art = storyArt[scene.id];
  const glow = scene.lines.findIndex((line) => line.text.includes("淡い紫の光がともった"));
  assert.ok(glow > 0);
  assert.equal(art.revealAtLine, glow);
  assert.equal(storyArtAt(scene.id, glow - 1), undefined);
  assert.equal(storyArtAt(scene.id, glow), art);
  assert.equal(storyArtAt("tower-restoration-return", Infinity), undefined);
  assert.equal(scene.lines.at(-1).text, "第一章 完");
});

test("the first departure has its illustration, and unknown scenes have none", () => {
  const fresh = initialPrologueState(1000),
    opening = nextStage(fresh).quest;
  const state = act(fresh, { type: "start", id: opening }, 1000);
  assert.ok(availableStories(state).some((st) => st.id === opening + "-departure"));
  // The opening scene's illustration belongs to its ending, after the handover.
  assert.equal(storyArtAt(opening + "-departure", Infinity), undefined);
  assert.ok(storyArtAt(opening + "-return", Infinity));
  assert.equal(storyArtAt("unknown-story", 0), undefined);
});
