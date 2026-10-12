import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { RPG_CAMERA_SCALE } from "../lib/rpg-camera.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
import { storyStageCue, storyStageExitCue, stageEntrance } from "../lib/story-stage.ts";
import { deliveryBoxTarget, stageItemTarget } from "../lib/story-stage-props.ts";
import { roadHeroSize, roadX, roadY } from "../lib/road-layout.ts";
import { chapterRoadHit } from "../lib/chapter-road-presentation.ts";
import { stories } from "../lib/stories.ts";

test("the pulled-back stage starts and finishes travel outside the visible frame", () => {
  const projected = (x) => 50 + (x - 50) * RPG_CAMERA_SCALE;
  const entry = stageCameraCue(storyStageCue("village-trade-departure", 1));
  assert.ok(projected(stageEntrance("aria", entry).x) + 12 * RPG_CAMERA_SCALE < 0);
  for (const story of stories) {
    const authored = storyStageExitCue(story.id);
    if (!authored) continue;
    const exit = stageCameraCue(authored);
    for (const [i, actor] of exit.actors.entries()) {
      const half = ((exit.cell ?? 24) / 2) * RPG_CAMERA_SCALE;
      if (authored.actors[i].x > 100)
        assert.ok(projected(actor.x) - half > 100, `${story.id}/${actor.id} exits right`);
      if (authored.actors[i].x < 0)
        assert.ok(projected(actor.x) + half < 0, `${story.id}/${actor.id} exits left`);
    }
  }
});

test("moving outside the wider frame preserves paired carry and held-item offsets", () => {
  const cue = stageCameraCue(storyStageExitCue("town-deliveries-departure"));
  const positions = new Map(cue.actors.map((a) => [a.id, a]));
  assert.equal(cue.actors[1].x - cue.actors[0].x, 20);
  const box = deliveryBoxTarget("shared", positions.get("aria").x, positions.get("leon").x);
  assert.equal(box.x, (cue.actors[0].x + cue.actors[1].x) / 2);
  const held = { id: "bag", art: "delivery-bag", actor: "aria", x: -4, bottom: 23 };
  const camera = stageCameraCue({ ...cue, items: [held] });
  assert.equal(camera.items[0].x, -4, "hand offsets are not offscreen destinations");
  assert.equal(Math.abs(stageItemTarget(held, camera, positions).x - positions.get("aria").x), 4);
});

test("smaller moving figures keep their heal target on both phone and desktop", () => {
  for (const [width, height] of [
    [320, 568],
    [390, 738],
    [1180, 850],
  ]) {
    for (const stage of ["forest", "puppets"]) {
      const hero = { id: "leon", x: 100, lane: 0.82 };
      const battle = { distance: 30, stage, heroes: [hero] };
      const feet = roadY(hero.lane, height),
        size = roadHeroSize(width, height);
      const x = roadX(hero.x, battle.distance, width, stage);
      assert.equal(
        chapterRoadHit(null, { x, y: feet - size * 0.45 }, width, height, battle),
        "heal:leon",
      );
      assert.equal(chapterRoadHit(null, { x: x + size, y: feet }, width, height, battle), "help");
    }
  }
});

test("every animated story background has an elevated camera source", async () => {
  const sheets = JSON.parse(await readFile("config/rpg-backgrounds.json", "utf8"));
  const names = sheets.flatMap((sheet) => sheet.cells.flatMap((cell) => cell.story ?? []));
  assert.equal(new Set(names).size, names.length, "background overrides are unique");
  for (const story of stories)
    for (const [i] of story.lines.entries()) {
      const cue = storyStageCue(story.id, i);
      if (cue) assert.ok(names.includes(cue.background ?? "meeting-path"), `${story.id}/${i}`);
    }
});
