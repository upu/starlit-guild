import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { chapterTwoStories } from "../lib/chapter-two-stories.ts";
import { storyStageCue, storyStageExitCue, sampleStageActor } from "../lib/story-stage.ts";
import { stageItemVisible, stageItemTarget } from "../lib/story-stage-props.ts";
import { orderStageItems } from "../lib/story-stage-cargo.ts";

const scenes = chapterTwoStories.filter((s) => s.id.startsWith("sweet-blockade"));
const occluded = { aria: [2, 3, 4, 5, 6], leon: [2, 3, 6, 7], mira: [2, 6, 7] };

test("Aria carries the parcel through the gap between the puppet and its controller", () => {
  const cue = storyStageCue("sweet-blockade-return", 0);
  const pickup = cue.sequence.find((s) => s.after === 2200);
  const walking = cue.sequence.find((s) => s.after === 3000);
  const actor = walking.actors.find((a) => a.id === "aria");
  const origin = pickup.actors.find((a) => a.id === "aria");
  const obstacles = [
    walking.items.find((i) => i.id === "puppet"),
    walking.extras.find((e) => e.id === "masked-pumpety"),
  ];
  for (let t = 0; t <= 2000; t += 50) {
    const sample = sampleStageActor(actor, origin, t);
    for (const obstacle of obstacles)
      assert.ok(
        Math.hypot(sample.x - obstacle.x, ((sample.bottom - obstacle.bottom) * 2) / 3) > 6,
        `feet clear at ${t}ms`,
      );
  }
});

test("dressings survive every prop replacement, the location cut and departure", () => {
  for (const story of scenes)
    for (let line = 0; line < story.lines.length; line++) {
      const cue = storyStageCue(story.id, line);
      for (const moment of [cue, ...(cue.sequence ?? [])]) {
        assert.equal(
          new Set(moment.items.map((i) => i.id)).size,
          moment.items.length,
          "unique item identity",
        );
        for (const id of ["aria", "leon"])
          assert.equal(moment.items.filter((i) => i.actor === id && i.wrist).length, 1);
        const mira = moment.actors.find((a) => a.id === "mira");
        assert.equal(
          moment.items.some((i) => i.actor === "mira" && i.wrist),
          !!mira.dressed,
        );
      }
    }
  const exit = storyStageExitCue("sweet-blockade-return");
  assert.equal(exit.items.filter((i) => i.wrist).length, 3);
});

test("each visible dressing touches opaque arm pixels in its actual pose or walking frame", async () => {
  const cache = new Map(),
    checked = new Set();
  for (const story of scenes)
    for (let line = 0; line < story.lines.length; line++) {
      const cue = storyStageCue(story.id, line);
      for (const moment of [cue, ...(cue.sequence ?? [])])
        for (const actor of moment.actors.filter((a) => a.dressed))
          for (const moving of [false, true])
            for (const t of [0, 130, 260, 390, 520, 650, 780, 910]) {
              const sample = sampleStageActor(
                actor,
                { ...actor, x: actor.x + (moving ? 40 : 0) },
                t,
              );
              const key = `${actor.id}/${sample.atlas}/${sample.frame}`;
              if (checked.has(key)) continue;
              checked.add(key);
              const item = moment.items.find((i) => i.actor === actor.id && i.wrist);
              const positions = new Map([[actor.id, sample]]);
              if (sample.atlas === "home" && occluded[actor.id].includes(sample.frame)) {
                assert.equal(stageItemVisible(item, positions), false, key);
                continue;
              }
              assert.ok(sample.wrist, key + " missing anchor");
              const cell = sample.atlas === "adventure" ? 192 : 128;
              const file =
                sample.atlas === "home"
                  ? `public/home-pixel/${actor.id}.webp`
                  : sample.atlas === "adventure"
                    ? `public/adventure-pixel/${actor.id}.webp`
                    : `public/story-stage/${actor.id}-poses.webp`;
              if (!cache.has(file))
                cache.set(
                  file,
                  await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
                );
              const { data, info } = cache.get(file);
              const x = (sample.frame % 4) * cell + sample.wrist.x + (cell === 192 ? 32 : 0);
              const y =
                Math.floor(sample.frame / 4) * cell + sample.wrist.y + (cell === 192 ? 56 : 0);
              assert.ok(
                data[(y * info.width + x) * 4 + 3] > 128,
                key + " anchor is outside the arm",
              );
              assert.equal(stageItemVisible(item, positions), true, key);
            }
    }
  assert.ok(checked.has("aria/adventure/11") && checked.has("aria/adventure/13"));
  assert.ok(checked.has("mira/conversation/10") && checked.has("leon/conversation/21"));
});

function locations(stage) {
  const positions = new Map(stage.actors.map((a) => [a.id, sampleStageActor(a, a, 0, true)]));
  for (const item of orderStageItems(stage.items))
    positions.set(`item:${item.id}`, stageItemTarget(item, stage, positions));
  return positions;
}
test("the original packing cloth accompanies the recovered honey until both enter the bag", () => {
  const before = storyStageCue("begging-golem-return", 17);
  const from = locations({ ...before, ...before.sequence.at(-1) });
  const to = locations(storyStageCue("sweet-blockade-departure", 0));
  for (const id of ["loot-cloth", "honey"])
    assert.deepEqual(from.get(`item:${id}`), to.get(`item:${id}`));
  for (const story of scenes)
    for (let line = 0; line < story.lines.length; line++) {
      const cue = storyStageCue(story.id, line);
      for (const m of [cue, ...(cue.sequence ?? [])]) {
        const cloth = m.items.find((i) => i.id === "loot-cloth"),
          honey = m.items.find((i) => i.id === "honey");
        assert.ok(cloth && honey);
        assert.equal(cloth.width, 10);
        assert.equal(honey.width, 6);
        assert.equal(!!cloth.stored, !!honey.stored);
        const at = locations({ ...cue, ...m }),
          c = at.get("item:loot-cloth"),
          h = at.get("item:honey");
        assert.equal(c.x, h.x);
        assert.ok(Math.abs(h.bottom - c.bottom - 1) < 1e-8);
      }
    }
  const exit = storyStageExitCue("sweet-blockade-return");
  assert.ok(exit.items.find((i) => i.id === "loot-cloth").stored);
});
