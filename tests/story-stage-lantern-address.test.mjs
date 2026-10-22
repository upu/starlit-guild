import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue as cue } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";

test("the carrier's notebook follows his hand and remains separate from the request copy", () => {
  for (const line of [18, 19, 20, 21]) {
    const stage = cue("lantern-detour-return", line);
    for (const step of [stage, ...(stage.sequence ?? [])]) {
      const book = step.items.find((p) => p.id === "carrier-notebook");
      assert.equal(book.extra, "worker");
      assert.equal(book.actor, undefined);
      assert.equal(book.art, "ledger");
      assert.equal(book.width, 6);
      const owner = stage.extras.find((p) => p.id === "worker");
      const before = stageItemTarget(book, stage, new Map([["extra:worker", owner]]));
      const after = stageItemTarget(
        book,
        stage,
        new Map([["extra:worker", { ...owner, x: owner.x + 7, bottom: owner.bottom + 3 }]]),
      );
      assert.equal(after.x - before.x, 7);
      assert.equal(after.bottom - before.bottom, 3);
    }
  }
});

test("Leon writes before giving the separate paper to Aria, who folds it after receiving it", () => {
  const stage = cue("lantern-detour-return", 21);
  const writing = stage.sequence.find((s) => s.actors.some((a) => a.id === "leon" && a.writing));
  assert.ok(writing);
  assert.ok(
    !writing.items.some((p) => p.id === "request-copy"),
    "writing sprite contains the paper already",
  );
  const ready = stage.sequence.find((s) =>
    s.items.some((p) => p.id === "request-copy" && p.actor === "leon"),
  );
  const taken = stage.sequence.find((s) =>
    s.items.some((p) => p.id === "request-copy" && p.actor === "aria"),
  );
  assert.ok(ready.after - writing.after >= 1600);
  const aria = taken.actors.find((a) => a.id === "aria");
  assert.ok(
    taken.after - writing.after >
      journeyDuration(
        aria,
        stage.actors.find((a) => a.id === "aria"),
      ),
  );
  const positions = new Map(taken.actors.map((a) => [a.id, a]));
  assert.deepEqual(
    stageItemTarget(
      ready.items.find((p) => p.id === "request-copy"),
      { ...stage, actors: ready.actors },
      positions,
    ),
    stageItemTarget(
      taken.items.find((p) => p.id === "request-copy"),
      { ...stage, actors: taken.actors },
      positions,
    ),
    "paper transfers at the shared hand position without travelling through the air",
  );
  assert.equal(taken.items.find((p) => p.id === "request-copy").art, "paper");
  const folded = stage.sequence.at(-1).items.find((p) => p.id === "request-copy");
  assert.equal(folded.art, "folded-paper");
  assert.equal(folded.actor, "aria");
  assert.ok(folded.width < 6, "folding reduces the sheet, not the character");
});
