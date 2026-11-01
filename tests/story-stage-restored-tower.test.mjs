import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue } from "../lib/story-stage.ts";
import { storyArtAt } from "../lib/story-art.ts";

test("restored stone is part of the tower foundation and the spectators retain their stature", () => {
  for (let line = 0; line < 4; line++) {
    const cue = storyStageCue("berne-restoration-return", line);
    assert.equal(cue.background, "berne-foundation-restored");
    assert.equal(cue.cell, storyStageCue("berne-restoration-departure", 0).cell);
    assert.ok(cue.items.every((item) => !["keystone", "tower-stone-bottom"].includes(item.art)));
    assert.ok(cue.actors.find((a) => a.id === "finn").dressed);
    assert.ok(cue.items.some((item) => item.actor === "finn" && item.wrist));
    const positions = [...cue.actors, ...cue.extras];
    for (let i = 0; i < positions.length; i++)
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i],
          b = positions[j];
        assert.ok(Math.hypot(a.x - b.x, ((a.bottom - b.bottom) * 2) / 3) > 14, `${a.id}/${b.id}`);
      }
  }
});

test("the existing chapter-ending illustration begins after the dining-room introduction", () => {
  assert.equal(storyStageCue("berne-restoration-return", 4).background, "dining-room");
  for (let line = 5; line <= 30; line++) assert.ok(storyArtAt("berne-restoration-return", line));
});
