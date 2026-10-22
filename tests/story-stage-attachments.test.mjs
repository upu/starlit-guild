import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue, storyStageExitCue, sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget, stageItemDepth } from "../lib/story-stage-props.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";

test("held items follow the displayed hands when walking into a low pose", () => {
  for (const id of ["aria", "leon", "mira", "finn", "lico"]) {
    for (const action of ["seated", "inspect"]) {
      for (const cell of [19, 21, 24]) {
        const actor = { id, x: 60, left: false, [action]: true };
        const item = { id: "paper", art: "ledger", actor: id, x: 4, bottom: 23 };
        const cue = { actors: [actor], items: [item], cell };
        const walking = sampleStageActor(actor, { x: 20, bottom: 14 }, 300);
        const stopped = sampleStageActor(actor, actor, 300);
        const at = (sample) => stageItemTarget(item, cue, new Map([[id, sample]]));
        assert.equal(walking.atlas, "home");
        assert.equal(at(walking).bottom, 23, "walk keeps standing hand height");
        assert.ok(at(stopped).bottom < 23 - 4, "low hands no longer cover the face");
        assert.ok(at(stopped).bottom >= 14, "paper does not sink below the floor");
        const reduced = sampleStageActor(actor, { x: 20 }, 0, true);
        assert.deepEqual(at(reduced), at(stopped));
        const carrying = sampleStageActor({ ...actor, carry: true }, actor, 300);
        assert.equal(at(carrying).bottom, 23, "carrying stands even if seated is retained in cue");
      }
    }
  }
});

test("ground depth keeps signs behind people, supported objects above furniture, and held objects with owners", () => {
  const table = { id: "table", art: "table", x: 50, bottom: 16 };
  const ledger = { id: "book", art: "ledger", x: 50, bottom: 33, support: "table" };
  const sign = { id: "sign", art: "signpost", x: 50, bottom: 27 };
  const cue = { actors: [{ id: "leon", x: 50, bottom: 14 }], items: [table, ledger, sign] };
  const positions = new Map([["leon", { x: 50, bottom: 14 }]]);
  const depth = (item) => stageItemDepth(item, cue, positions);
  assert.ok(depth(sign) < 86);
  assert.ok(depth(table) < depth(ledger));
  assert.ok(depth(ledger) < 86, "foreground hero can occlude the tabletop");
  const held = { ...ledger, actor: "leon", support: undefined };
  assert.ok(depth(held) > 86);
  positions.set("leon", { x: 55, bottom: 35 });
  assert.ok(
    depth(held) > 65 && depth(held) < depth(table),
    "distant held item stays behind foreground table",
  );
  for (const item of [table, ledger, sign, held])
    assert.ok(Number.isInteger(depth(item)), "valid CSS z-index");
  const wiping = { ...held, support: "table" };
  assert.ok(
    depth(wiping) > depth(table),
    "a cloth touching the furniture stays visible on its surface",
  );
});

test("Lico reaches the placed basket before picking it up without overlapping Aria", () => {
  const previous = storyStageCue("moss-transplant-departure", 34);
  const cue = storyStageCue("moss-transplant-departure", 35);
  const lico = cue.actors.find((a) => a.id === "lico");
  const aria = cue.actors.find((a) => a.id === "aria");
  assert.ok(Math.abs(lico.x - aria.x) >= cue.cell / 2);
  const step = cue.sequence[0];
  assert.ok(
    step.after >
      journeyDuration(
        lico,
        previous.actors.find((a) => a.id === "lico"),
      ),
  );
  const lifted = step.items.find((p) => p.id === "seedlings");
  const owner = step.actors.find((a) => a.id === "lico");
  const at = stageItemTarget(
    lifted,
    step,
    new Map([["lico", sampleStageActor(owner, owner, 0, true)]]),
  );
  assert.equal(
    at.x,
    previous.items.find((p) => p.id === "seedlings").x,
    "pickup lifts the existing basket vertically",
  );
});

test("hill-path scenes share the background's scale and exits do not replay an earlier path", () => {
  const one = stageCameraCue(storyStageCue("tower-road-departure", 0));
  for (const id of ["berne-road-return", "hilltop-picnic-departure", "lantern-detour-departure"])
    assert.equal(stageCameraCue(storyStageCue(id, 0)).cameraScale, one.cameraScale);
  const exit = storyStageExitCue("mountain-entrance-departure");
  assert.ok(exit.actors.every((a) => !a.via && !a.lane));
  assert.equal(exit.sequence, undefined);
});

test("the same removal basket keeps its size on the ground and in Leon's hands", () => {
  const baskets = [0, 7, 10, 16, 17].map((line) =>
    storyStageCue("tower-moss-removal-departure", line).items.find((p) => p.id === "basket"),
  );
  assert.equal(baskets[3].actor, "leon");
  assert.equal(new Set(baskets.map((p) => p.width)).size, 1);
});

test("the restoration cloth is received and returned within the narrated line", () => {
  const cue = storyStageCue("tower-restoration-return", 13);
  const moments = [cue, ...cue.sequence];
  assert.deepEqual(
    moments.map((m) => m.items.find((p) => p.id === "cloth").actor),
    ["aria", "leon", "aria"],
  );
  assert.deepEqual(storyStageCue("tower-restoration-return", 14).items, moments.at(-1).items);
  for (const moment of moments) {
    const cloth = moment.items.find((p) => p.id === "cloth");
    const actor = moment.actors.find((a) => a.id === cloth.actor);
    const sample = sampleStageActor(actor, actor, 1000);
    const at = stageItemTarget(cloth, moment, new Map([[actor.id, sample]]));
    assert.ok(Math.abs(at.x - sample.x) <= 4);
  }
});
