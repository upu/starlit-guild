import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue as cue, sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";

test("the carrier's notebook follows his hand and remains separate from the request copy", () => {
  for (const line of [18, 19, 20, 21]) {
    const stage = cue("lantern-detour-return", line);
    for (const step of [stage, ...(stage.sequence ?? [])]) {
      const owner = step.extras.find((p) => p.id === "worker");
      assert.ok(owner.notebook);
      assert.ok(
        [8, 9].includes(stageExtraFrame(owner, false, 400)),
        "notebook is drawn in the worker's hands",
      );
      assert.ok(
        !step.items.some((p) => p.id === "carrier-notebook" || p.art === "ledger"),
        "no second overlaid notebook",
      );
    }
  }
  const writing = cue("lantern-detour-return", 18).extras.find((p) => p.id === "worker");
  assert.equal(stageExtraFrame(writing, false, 0), 8);
  assert.equal(stageExtraFrame(writing, false, 400), 9);
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
  const positions = new Map(taken.actors.map((a) => [a.id, sampleStageActor(a, a, 0, true)]));
  const from = stageItemTarget(
    ready.items.find((p) => p.id === "request-copy"),
    { ...stage, actors: ready.actors },
    positions,
  );
  const to = stageItemTarget(
    taken.items.find((p) => p.id === "request-copy"),
    { ...stage, actors: taken.actors },
    positions,
  );
  assert.ok(
    Math.hypot(from.x - to.x, ((from.bottom - to.bottom) * 2) / 3) < 2,
    "both hands meet within the sheet's width",
  );
  assert.equal(taken.items.find((p) => p.id === "request-copy").art, "paper");
  const folded = stage.sequence.at(-1).items.find((p) => p.id === "request-copy");
  assert.equal(folded.art, "folded-paper");
  assert.equal(folded.actor, "aria");
  assert.ok(folded.width < 6, "folding reduces the sheet, not the character");
});
