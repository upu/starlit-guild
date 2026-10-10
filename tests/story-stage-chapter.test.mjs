import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { prologueStories } from "../lib/prologue-stories.ts";
import { storyArtAt } from "../lib/story-art.ts";
import { portraitAtlases } from "../lib/portrait-expressions.ts";
import {
  storyStageCue as cue,
  storyStageExitCue as exit,
  sampleStageActor,
} from "../lib/story-stage.ts";
import { towerStages } from "../lib/story-stage-tower.ts";
import { forestStages } from "../lib/story-stage-forest.ts";
import { waterwayStages } from "../lib/story-stage-waterway.ts";
import { stageItemOffset } from "../lib/story-stage-props.ts";

test("carried props switch to the facing hand when a traveler turns to leave", () => {
  const story = "moss-night-road-return",
    sample = cue(story, 25).items.find((p) => p.id === "sample");
  assert.equal(stageItemOffset(sample, cue(story, 18).actors[0]), 6);
  assert.equal(stageItemOffset(sample, exit(story).actors[0]), -6);
  const basket = cue("tower-restoration-return", 16).items.find((p) => p.id === "basket");
  assert.equal(stageItemOffset(basket, exit("tower-restoration-return").actors[1]), 6);
});

test("chapter one uses explicit available expressions and valid authored beats", () => {
  assert.equal(prologueStories.length, 18);
  const definitions = { ...towerStages, ...forestStages, ...waterwayStages };
  assert.equal(Object.keys(definitions).length, 12);
  for (const story of prologueStories) {
    for (const line of story.lines)
      if (line.speaker)
        assert.ok(
          portraitAtlases[line.speaker].expressions.includes(line.expression),
          `${story.id}: ${line.text}`,
        );
    if (!definitions[story.id]) continue;
    const beats = definitions[story.id].beats;
    assert.equal(new Set(beats.map((b) => b.at)).size, beats.length);
    for (const beat of beats) assert.ok(beat.at >= 0 && beat.at < story.lines.length);
    assert.equal(cue(story.id, -1), null);
    assert.equal(cue(story.id, story.lines.length), null);
    assert.equal(exit(story.id), exit(story.id), "rerenders cannot restart departure");
    for (const [i] of story.lines.entries()) {
      const scene = cue(story.id, i);
      if (storyArtAt(story.id, i)) {
        assert.equal(scene, null);
        continue;
      }
      assert.equal(new Set(scene.items.map((p) => p.id)).size, scene.items.length);
      assert.equal(new Set(scene.extras.map((p) => p.id)).size, scene.extras.length);
    }
  }
});

test("existing chapter stills replace staging at their original reveal lines", () => {
  for (const [id, line] of [
    ["tower-road-return", 20],
    ["forest-wetland-return", 5],
    ["tower-moss-removal-return", 6],
  ]) {
    assert.ok(cue(id, line - 1));
    assert.equal(cue(id, line), null);
    assert.ok(storyArtAt(id, line));
    assert.equal(exit(id), null);
  }
});

test("night scenes carry the moss, add a shawl, then hand it back before parting", () => {
  const road = "moss-night-road-departure",
    meeting = "moss-night-road-return";
  assert.equal(cue(road, 0).night, true);
  assert.equal(cue(road, 14).actors[0].shawl, undefined);
  const actor = cue(road, 15).actors[0];
  assert.equal(actor.shawl, true);
  assert.equal(sampleStageActor(actor, { x: actor.x }, 1000).atlas, "shawl");
  assert.equal(sampleStageActor(actor, { x: actor.x - 10 }, 100).frame, 2);
  assert.equal(cue(meeting, 0).items.find((p) => p.id === "sample").actor, "leon");
  assert.equal(cue(meeting, 18).items.find((p) => p.id === "sample").actor, "aria");
  assert.equal(cue(meeting, 3).items.find((p) => p.id === "sample").glow, "dim");
  assert.ok(exit(meeting).actors[0].x < 0);
  assert.ok(exit(meeting).actors[1].x > 100);
});

test("experiments separate near, distant and forest moss; restoration changes the channel", () => {
  const near = cue("old-waterway-departure", 7).items;
  assert.deepEqual(
    near.filter((p) => p.glow === "bright").map((p) => p.id),
    ["near"],
  );
  assert.equal(cue("old-waterway-return", 0).background, "drain-blocked");
  assert.equal(cue("tower-restoration-return", 0).background, "drain-cleared");
  assert.deepEqual(
    cue("tower-restoration-departure", 1).extras.map((p) => p.id),
    ["keeper", "worker", "merchant"],
  );
  assert.equal(
    cue("tower-restoration-departure", 1).extras.find((p) => p.id === "merchant").speaking,
    true,
  );
  assert.equal(
    cue("tower-restoration-departure", 3).extras.find((p) => p.id === "worker").speaking,
    true,
  );
  assert.ok(cue("tower-moss-removal-return", 2).actors.every((a) => a.inspect));
});

test("new standing atlases share hero stature, head proportions and foot registration", async () => {
  for (const id of ["aria-shawl", "keeper-poses", "worker-poses"]) {
    for (let i = 0; i < 4; i++) {
      const f = await readFrame(`public/story-stage/${id}.webp`, {
        left: i * 128,
        top: 0,
        width: 128,
        height: 128,
      });
      const head = await headBounds(await sharp(f.cell).extract(f.box).png().toBuffer(), 0.25);
      assert.ok(Math.abs(f.box.height - 96) <= 2, `${id}/${i}: stature`);
      assert.ok(Math.abs(f.box.top + f.box.height - 120) <= 1, `${id}/${i}: feet`);
      assert.ok(head.width >= 42 && head.width <= 54, `${id}/${i}: head width ${head.width}`);
    }
  }
});
