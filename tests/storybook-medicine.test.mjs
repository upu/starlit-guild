import test from "node:test";
import assert from "node:assert/strict";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";

test("bedside breakfast stays on the small table through the ledger handover", () => {
  for (const line of [0, 9, 13]) {
    const cue = studyCue("medicine-packing-departure", line, true);
    for (const items of [cue.items, ...(cue.sequence ?? []).map((step) => step.items)]) {
      const plate = items.find((item) => item.art === "dish");
      const bread = items.find((item) => item.art === "bread");
      assert.ok(plate.x < 70 && plate.bottom > 80);
      assert.equal(bread.x, plate.x);
      assert.equal(bread.support, "dish");
      assert.ok(bread.bottom > plate.bottom);
    }
  }
  assert.equal(
    studyCue("medicine-packing-departure", 0, false).items.find((item) => item.art === "dish").x,
    92,
  );
  assert.equal(
    storybookPresentation("medicine-packing-departure", "medicine-room").art,
    "medicine-room-v1",
  );
});

test("herb samples follow the owner's hand and the painted tabletop height", () => {
  const onTable = studyCue("moonlit-herbs-departure", 0, true).items.find(
    (item) => item.art === "herbs",
  );
  assert.ok(onTable.bottom < 33 && onTable.width <= 6);
  for (const line of [6, 10, 13]) {
    const sample = studyCue("moonlit-herbs-departure", line, true).items.find(
      (item) => item.art === "herbs",
    );
    assert.equal(sample.wrist, true);
    assert.equal(sample.wristAnchor, "bottom");
    assert.ok(sample.width <= 6);
  }
});

test("the folded packing cloth uses the same registered tabletop as the herb samples", () => {
  const reference = studyCue("moonlit-herbs-departure", 0, true).items;
  const herb = reference.find((i) => i.art === "herbs"),
    desk = reference.find((i) => i.art === "table");
  const cue = studyCue("medicine-packing-return", 4, true);
  const cloth = cue.items.find((i) => i.art === "cloth"),
    table = cue.items.find((i) => i.art === "table");
  assert.equal(cloth.support, table.id);
  assert.equal(cloth.x, table.x);
  assert.equal(
    (cloth.bottom - table.bottom) / table.width,
    (herb.bottom - desk.bottom) / desk.width,
  );
  assert.ok(cloth.bottom < 33);
  assert.equal(cue.items.find((i) => i.art === "delivery-bag").actor, "aria");
});

test("sample handover waits for approach and exit retains the painted holders", () => {
  const cue = studyCue("moonlit-herbs-departure", 13, true);
  assert.equal(cue.finishBeforeAdvance, true);
  assert.equal(cue.items.find((item) => item.art === "herbs").actor, "mira");
  const transfer = cue.sequence[0];
  assert.ok(transfer.after >= 2000);
  assert.equal(transfer.items.find((item) => item.art === "herbs").actor, "aria");
  assert.equal(transfer.items.find((item) => item.art === "cloth").actor, "leon");
  const aria = cue.actors.find((actor) => actor.id === "aria");
  assert.ok(aria.via.every((point) => point.bottom < 10));
  const exit = storybookExitCue("moonlit-herbs-departure");
  assert.equal(exit.actors.find((actor) => actor.id === "mira").pose, "think");
  assert.ok(
    exit.actors.find((actor) => actor.id === "leon").via.every((point) => point.bottom < 0),
  );
  assert.ok(
    exit.items.filter((item) => ["herbs", "cloth"].includes(item.art)).every((item) => item.wrist),
  );
});

test("returned samples remain separate after the held bundle reaches the desk", () => {
  const cue = studyCue("moonlit-herbs-return", 0, true);
  assert.equal(cue.finishBeforeAdvance, true);
  const held = cue.items.find((item) => item.id === "slope-herbs");
  assert.equal(held.actor, "leon");
  assert.equal(held.wrist, true);
  const placed = cue.sequence[0].items.find((item) => item.id === "slope-herbs");
  assert.equal(placed.actor, undefined);
  assert.equal(placed.support, "table");
  assert.equal(placed.width, held.width);
  const next = studyCue("moonlit-herbs-return", 1, true);
  const samples = next.items.filter((item) => item.art === "herbs");
  assert.equal(samples.length, 2);
  assert.ok(Math.abs(samples[0].x - samples[1].x) > samples[0].width);
  assert.ok(
    next.items
      .filter((item) => ["reward-pouch", "healing-bottle"].includes(item.id))
      .every((item) => item.support === "table"),
  );
});
