import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { storyStageCue, sampleStageActor } from "../lib/story-stage.ts";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";

test("all14 overlook pages use one painted place, stable luggage and the existing narrative cues", () => {
  for (let page = 0; page < 14; page++) {
    const original = JSON.stringify(storyStageCue("berne-road-return", page));
    const cue = studyCue("berne-road-return", page, true);
    assert.equal(
      storybookPresentation("berne-road-return", cue.background, page).art,
      "berne-overlook-v1",
    );
    for (const state of [cue, ...(cue.sequence ?? [])]) {
      assert.equal(state.items.find((i) => i.id === "seat-finn").width, 8.5);
      for (const bag of state.items.filter((i) =>
        ["medicine-closed", "delivery-bag"].includes(i.art),
      ))
        assert.equal(bag.bottom, 7);
    }
    assert.equal(JSON.stringify(storyStageCue("berne-road-return", page)), original);
  }
});
test("Finn lowers into his seat before taking the paper out", () => {
  const cue = studyCue("berne-road-return", 0, true);
  assert.deepEqual(
    cue.sequence.map((s) => s.after),
    [250, 450, 650, 1350],
  );
  assert.equal(cue.sequence[0].actors.find((a) => a.id === "finn").seatTransition, "lower");
  assert.equal(cue.sequence[1].actors.find((a) => a.id === "finn").seatTransition, "settle");
  assert.equal(cue.sequence[2].actors.find((a) => a.id === "finn").seated, true);
  for (const s of cue.sequence.slice(0, 3))
    assert.ok(!s.items.some((i) => i.id === "shipping-receipt"));
  assert.equal(cue.sequence[3].items.find((i) => i.id === "shipping-receipt").actor, "finn");
});
test("the document stays at Finn's grip while Leon indicates its frayed binding corner", () => {
  const cue = studyCue("berne-road-return", 10, true);
  const positions = new Map(cue.actors.map((a) => [a.id, sampleStageActor(a, a, 10000)]));
  const paper = cue.items.find((i) => i.id === "shipping-receipt"),
    at = stageItemTarget(paper, cue, positions);
  const leon = positions.get("leon"),
    cell = cue.cell;
  const finger = {
    x: leon.x + ((leon.wrist.x - 64) * cell) / 128,
    bottom: leon.bottom + (((128 - leon.wrist.y) * cell) / 128) * 1.5,
  };
  const corner = { x: at.x - paper.width * 0.225, bottom: at.bottom + paper.width * 1.5 * 0.81 };
  assert.ok(Math.hypot(finger.x - corner.x, finger.bottom - corner.bottom) < 0.5);
  for (const step of cue.sequence) {
    const next = stageItemTarget(
      step.items.find((i) => i.id === "shipping-receipt"),
      { ...cue, ...step },
      new Map(step.actors.map((a) => [a.id, sampleStageActor(a, a, 10000)])),
    );
    assert.deepEqual(next, at);
  }
});
test("new front/back document assets retain transparent padding and matching scale", async () => {
  const metrics = JSON.parse(
    await readFile("public/storybook-study/lunch-overlook-prop-metrics.json"),
  );
  const papers = metrics.filter((m) => m.name.startsWith("berne-shipping"));
  assert.equal(papers.length, 2);
  assert.ok(Math.abs(papers[0].width - papers[1].width) < 4);
  for (const { name } of papers) {
    const { data, info } = await sharp(`public/storybook-study/${name}.webp`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++)
        if (x < 3 || y < 3 || x > 252 || y > 252)
          assert.equal(data[(y * info.width + x) * 4 + 3], 0);
  }
});
