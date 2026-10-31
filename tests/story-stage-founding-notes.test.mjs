import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue } from "../lib/story-stage.ts";

test("Leon keeps the registration sheet while folding only the extra notes and leaves them on the table", () => {
  const cue = (line) => storyStageCue("starlit-guild-founding-return", line);
  const papers = (s) => s.items.filter((p) => ["ledger", "leon-notes"].includes(p.id));
  assert.ok(!cue(51).items.some((p) => p.id === "leon-notes"));
  for (let line = 52; line < 60; line++) {
    const held = papers(cue(line));
    assert.equal(held.length, 2);
    assert.ok(
      held.every((p) => p.art === "paper" && p.actor === "leon" && p.wrist && p.width === 7),
    );
  }
  const fold = cue(60);
  assert.equal(fold.finishBeforeAdvance, true);
  const [folded, laid, top] = fold.sequence;
  const note = (s) => s.items.find((p) => p.id === "leon-notes");
  assert.equal(note(folded).art, "folded-paper");
  assert.equal(note(folded).actor, "leon");
  assert.equal(note(laid).actor, undefined);
  assert.equal(note(laid).support, "table");
  assert.ok(laid.after - folded.after >= 650 && top.after - laid.after >= 650);
  const sheet = top.items.find((p) => p.id === "ledger");
  assert.equal(sheet.width, 7);
  assert.equal(sheet.art, "paper");
  assert.equal(sheet.support, "table");
  assert.equal(sheet.pitch, 55);
  assert.equal(note(laid).pitch, 55);
  assert.ok(Math.abs(sheet.x - note(top).x) > (sheet.width + note(top).width) / 2);
  for (let line = 61; line <= 66; line++) {
    const c = cue(line);
    for (const step of [c, ...(c.sequence ?? [])]) {
      assert.equal(note(step).width, 3.5);
      assert.equal(note(step).support, "table");
      assert.equal(note(step).actor, undefined);
    }
  }
});
