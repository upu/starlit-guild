import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue } from "../lib/story-stage.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";
import { stageItemDepth } from "../lib/story-stage-props.ts";

test("keeper writes on a supported ledger before speaking and the desk stays until departure", () => {
  const cue = storyStageCue("starlit-guild-founding-departure", 0);
  const keeper = cue.extras.find((e) => e.id === "keeper");
  assert.equal(cue.background, "tower-records");
  assert.equal(storyStageCue("moss-transplant-return", 9).background, "tower-foot");
  assert.equal(cue.finishBeforeAdvance, true);
  assert.equal(keeper.chair, true);
  assert.equal(stageExtraFrame(keeper, false, 0), 17);
  assert.equal(stageExtraFrame(keeper, false, 420), 18);
  assert.ok(cue.sequence[0].after >= 2000);
  assert.equal(cue.sequence[0].extras.find((e) => e.id === "keeper").deskWork, undefined);
  for (let line = 0; line < 37; line++) {
    const c = storyStageCue("starlit-guild-founding-departure", line);
    for (const state of [c, ...(c.sequence ?? [])]) {
      const books = state.items.filter((p) => p.art === "ledger");
      assert.equal(books.length, 1);
      assert.equal(books[0].support, "keeper-desk");
      assert.equal(books[0].width, 5.2);
      assert.ok(state.items.some((p) => p.id === "keeper-desk"));
    }
  }
  const book = cue.items.find((p) => p.id === "keeper-records");
  const desk = cue.items.find((p) => p.id === "keeper-desk");
  assert.ok(stageItemDepth(book, cue, new Map()) > stageItemDepth(desk, cue, new Map()));
  const road = storyStageCue("starlit-guild-founding-departure", 37);
  assert.ok(!road.items.some((p) => ["keeper-records", "keeper-desk"].includes(p.id)));
});
