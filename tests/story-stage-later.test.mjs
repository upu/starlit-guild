import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { chapterTwoStories } from "../lib/chapter-two-stories.ts";
import { chapterThreeStories } from "../lib/chapter-three-stories.ts";
import { chapterFourStories } from "../lib/chapter-four-stories.ts";
import {
  storyStageCue as cue,
  storyStageExitCue as exit,
  sampleStageActor,
  stageEntrance,
} from "../lib/story-stage.ts";
import { storyArtAt } from "../lib/story-art.ts";
import { portraitAtlases } from "../lib/portrait-expressions.ts";
const stories = [...chapterTwoStories, ...chapterThreeStories, ...chapterFourStories];

test("58 later stories preserve still reveals, complete casts, expressions and deliverable props", () => {
  assert.equal(stories.length, 58);
  for (const story of stories) {
    assert.equal(cue(story.id, -1), null);
    assert.equal(cue(story.id, story.lines.length), null);
    assert.equal(exit(story.id), exit(story.id));
    for (const [index, line] of story.lines.entries()) {
      if (line.speaker)
        assert.ok(
          portraitAtlases[line.speaker].expressions.includes(line.expression),
          `${story.id}/${index}: expression`,
        );
      const stage = cue(story.id, index);
      assert.equal(!!stage, !storyArtAt(story.id, index));
      if (!stage) continue;
      assert.ok(existsSync(`public/story-stage/${stage.background}.webp`));
      assert.equal(new Set(stage.actors.map((a) => a.id)).size, stage.actors.length);
      assert.equal(new Set(stage.items.map((a) => a.id)).size, stage.items.length);
      assert.equal(new Set(stage.extras.map((a) => a.id)).size, stage.extras.length);
      if (line.speaker)
        assert.ok(
          stage.actors.some((a) => a.id === line.speaker && a.visible !== false) ||
            stage.extras.some((a) => a.id === line.speaker),
          `${story.id}/${index}: speaker present`,
        );
      for (const actor of stage.actors)
        assert.ok(existsSync(`public/story-stage/${actor.id}-poses.webp`));
      for (const prop of stage.items) {
        assert.ok(existsSync(`public/story-stage/prop-${prop.art}.webp`), prop.art);
        if (prop.actor)
          assert.ok(
            stage.actors.some((a) => a.id === prop.actor && a.visible !== false),
            `${story.id}/${index}: carrier present`,
          );
      }
      for (const extra of stage.extras)
        assert.ok(existsSync(`public/story-stage/${extra.id}-poses.webp`));
    }
  }
});

test("later arrivals and separate errands do not show characters before their entrance", () => {
  const visible = (id, line) =>
    cue(id, line)
      .actors.filter((a) => a.visible !== false && a.x < 100)
      .map((a) => a.id);
  assert.deepEqual(visible("hilltop-picnic-return", 0), ["aria", "leon"]);
  assert.deepEqual(visible("berne-road-departure", 4), ["aria", "leon", "mira"]);
  assert.deepEqual(visible("glowing-moss-trail-return", 0), ["aria", "leon"]);
  assert.deepEqual(visible("brekka-moss-beds-return", 0), ["aria", "leon", "mira"]);
  const licoCue = cue("brekka-moss-beds-return", 2),
    lico = licoCue.actors.find((a) => a.id === "lico");
  assert.equal(stageEntrance("lico", licoCue).x, 110);
  assert.ok(sampleStageActor(lico, { x: 110 }, 300).x > lico.x);
  assert.deepEqual(visible("lico-records-departure", 0), ["aria", "leon", "mira", "finn"]);
  assert.deepEqual(visible("lico-records-departure", 32), ["aria", "leon", "mira", "finn", "lico"]);
  assert.deepEqual(visible("moss-transplant-return", 15), ["mira"]);
  assert.equal(
    cue("medicine-packing-return", 5).items.some((p) => p.actor === "aria"),
    false,
  );
});

test("story objects transfer to the right person and distinguish the original and replacement stone", () => {
  assert.equal(
    cue("hilltop-picnic-departure", 0).items.find((p) => p.id === "bread").actor,
    "leon",
  );
  assert.equal(
    cue("hilltop-picnic-departure", 5).items.find((p) => p.id === "bread").actor,
    "aria",
  );
  assert.equal(cue("sweet-blockade-return", 10).items.find((p) => p.id === "honey").actor, "mira");
  assert.ok(cue("riverside-manor-return", 0).items.some((p) => p.art === "tower-stone"));
  assert.ok(cue("matching-lantern-stone-return", 5).items.some((p) => p.art === "replacement"));
  assert.equal(
    cue("starlit-guild-founding-departure", 19).items.find((p) => p.id === "sample-jar").actor,
    "lico",
  );
  assert.equal(
    cue("starlit-guild-founding-departure", 27).items.find((p) => p.id === "sample-jar").actor,
    "aria",
  );
  assert.equal(cue("moss-transplant-return", 0).background, "new-moss-beds");
  assert.equal(cue("moss-transplant-return", 9).background, "tower-foot");
  assert.equal(cue("moss-transplant-return", 15).background, "patient-room");
});

test("new hero poses preserve walking head scale; crouching is shorter with feet registered", async () => {
  for (const id of ["mira", "finn", "lico"]) {
    const base = await readFrame(`public/home-pixel/${id}.webp`, {
      left: 0,
      top: 0,
      width: 128,
      height: 128,
    });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    for (let i = 0; i < 10; i++) {
      const f = await readFrame(`public/story-stage/${id}-poses.webp`, {
        left: (i % 4) * 128,
        top: Math.floor(i / 4) * 128,
        width: 128,
        height: 128,
      });
      const actual = await headBounds(await sharp(f.cell).extract(f.box).png().toBuffer(), 0.25);
      assert.ok(
        Math.abs(actual.width - head.width) <= 8,
        `${id}/${i}: ${actual.width} vs ${head.width}`,
      );
      assert.ok(Math.abs(f.box.top + f.box.height - 120) <= 1, `${id}/${i}: feet`);
      if (i === 6 || i === 7) assert.ok(f.box.height < 85, `${id}: crouch ${f.box.height}`);
      else assert.ok(Math.abs(f.box.height - 96) <= 10, `${id}/${i}: stature ${f.box.height}`);
    }
  }
});
