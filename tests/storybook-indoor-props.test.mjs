import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue, sampleStageActor } from "../lib/story-stage.ts";
import { indoorStudyCue } from "../lib/storybook/indoor-cue.ts";
import { stageItemVisible, stageItemTarget, stageItemDepth } from "../lib/story-stage-props.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";

test("the paper circuit keeps the same sheet visible in each painted standing palm", () => {
  const original = storyStageCue("starlit-guild-founding-return", 35);
  const before = JSON.stringify(original);
  const study = indoorStudyCue(original, 35);
  for (const id of ["leon", "mira", "lico"]) {
    const step = study.sequence.find((s) =>
      s.items.some((i) => i.id === "ledger" && i.actor === id),
    );
    const actor = step.actors.find((a) => a.id === id);
    const paper = step.items.find((i) => i.id === "ledger");
    const at = sampleStageActor(actor, actor, 900, true);
    const positions = new Map([[id, at]]);
    assert.equal(at.frame, 14);
    assert.ok(at.wrist);
    assert.equal(stageItemVisible(paper, positions), true);
    assert.equal(paper.width, 6);
    assert.equal(paper.wristOffset, undefined);
    const target = stageItemTarget(paper, { ...study, ...step }, positions);
    assert.ok((target.x - at.x) * (at.left ? -1 : 1) > 0);
  }
  assert.equal(study.actors.find((a) => a.id === "aria").nameAbove, true);
  assert.equal(JSON.stringify(original), before);
});

test("paper carry uses the registered palm throughout Aria's four walking frames", () => {
  const original = storyStageCue("starlit-guild-founding-return", 35);
  const study = indoorStudyCue(original, 35);
  const carry = study.sequence[0];
  const actor = carry.actors.find((a) => a.id === "aria");
  const origin = study.actors.find((a) => a.id === "aria");
  const paper = carry.items.find((item) => item.id === "ledger");
  const frames = new Set();
  for (const elapsed of [0, 130, 260, 390]) {
    const at = sampleStageActor(actor, origin, elapsed, false);
    frames.add(at.frame);
    assert.deepEqual(at.wrist, { x: 83, y: 73 });
    assert.equal(stageItemVisible(paper, new Map([["aria", at]])), true);
    const target = stageItemTarget(paper, { ...study, ...carry }, new Map([["aria", at]]));
    assert.ok(Number.isFinite(target.x) && Number.isFinite(target.bottom));
  }
  assert.deepEqual([...frames], [8, 9, 22, 23]);
  assert.equal(original.actors.find((a) => a.id === "aria").wristPoints, undefined);
});

test("Mira's alternative carry cycle reaches all four registered palms without changing the original cue", () => {
  const original = storyStageCue("starlit-guild-founding-return", 35);
  const before = JSON.stringify(original);
  const study = indoorStudyCue(original, 35);
  const step = study.sequence.find((s) => s.after === 5200);
  const previous = study.sequence.find((s) => s.after === 4500);
  const actor = step.actors.find((a) => a.id === "mira");
  const origin = previous.actors.find((a) => a.id === "mira");
  const frames = [0, 130, 260, 390].map((time) => {
    const at = sampleStageActor(actor, origin, time, false);
    assert.deepEqual(at.wrist, { x: 84, y: 77 });
    return at.frame;
  });
  assert.deepEqual(frames, [8, 9, 22, 23]);
  assert.equal(sampleStageActor(actor, origin, 300, true).frame, 14);
  assert.equal(JSON.stringify(original), before);
});

test("Finn reaches before receiving paper, stays seated, and retracts after transfer", () => {
  const original = storyStageCue("starlit-guild-founding-return", 35);
  const before = JSON.stringify(original);
  const study = indoorStudyCue(original, 35);
  const step = (after) => study.sequence.find((s) => s.after === after);
  const finn = (s) => s.actors.find((a) => a.id === "finn");
  for (const after of [5700, 6200, 7200, 7800]) {
    const actor = finn(step(after));
    assert.ok(actor.seated && actor.chair);
    assert.equal(actor.pose, "offer");
  }
  const receiving = step(6200);
  const actor = finn(receiving);
  const at = sampleStageActor(actor, actor, 900, true);
  const paper = receiving.items.find((item) => item.id === "ledger");
  const target = stageItemTarget(paper, { ...study, ...receiving }, new Map([["finn", at]]));
  assert.equal(at.frame, 29);
  assert.ok(target.x < at.x, "paper must be in the left-facing receiving palm");
  assert.equal(finn(step(7200)).left, false);
  assert.equal(finn(step(8000)).wristPoints, undefined);
  const returned = step(14400);
  const returnedPaper = returned.items.find((item) => item.id === "ledger");
  const leon = returned.actors.find((actor) => actor.id === "leon");
  assert.equal(returnedPaper.support, "table");
  assert.ok(Math.abs(returnedPaper.x - leon.x) < 4, "paper returns within arm's reach");
  assert.equal(JSON.stringify(original), before);
});

test("specimen stays visible until it reaches the front pack, and departure waits for repacking", () => {
  const original = storyStageCue("starlit-guild-founding-return", 21);
  const before = JSON.stringify(original);
  const study = indoorStudyCue(original, 21);
  const transfer = study.sequence.find((step) => step.after === 3200);
  const hiding = study.sequence.find((step) => step.after === 4000);
  const repacking = study.sequence.find((step) => step.after === 4200);
  const departure = study.sequence.at(-1);
  const sample = transfer.items.find((item) => item.carrier === "lico-sample-bag");
  assert.equal(stageItemVisible(sample, new Map()), true);
  assert.ok(hiding.after - transfer.after >= sample.travelMs);
  assert.equal(
    stageItemVisible(
      hiding.items.find((item) => item.id === sample.id),
      new Map(),
    ),
    false,
  );
  const bag = transfer.items.find((item) => item.id === sample.carrier);
  assert.equal(bag.behindOwner, false);
  assert.ok(
    stageItemDepth(bag, transfer, new Map()) >
      stageItemDepth(
        transfer.items.find((item) => item.id === "table"),
        transfer,
        new Map(),
      ),
  );
  assert.equal(repacking.items.find((item) => item.id === bag.id).behindOwner, true);
  assert.ok(departure.after - repacking.after >= 650);
  const researcher = transfer.actors.find((actor) => actor.id === "lico");
  for (const step of [hiding, repacking]) {
    const actor = step.actors.find((actor) => actor.id === "lico");
    assert.equal(actor.x, researcher.x);
    assert.equal(actor.bottom, researcher.bottom);
  }
  assert.equal(study.finishBeforeAdvance, true);
  assert.equal(JSON.stringify(original), before);
});

test("Aria clears the research aisle before Lico approaches without moving the sample contact", () => {
  const original = storyStageCue("starlit-guild-founding-return", 18);
  const before = JSON.stringify(original);
  const prior = indoorStudyCue(storyStageCue("starlit-guild-founding-return", 17), 17);
  const study = indoorStudyCue(original, 18);
  const aria = study.actors.find((a) => a.id === "aria");
  const lico = study.actors.find((a) => a.id === "lico");
  const origin = prior.actors.find((a) => a.id === "lico");
  assert.equal(prior.actors.find((a) => a.id === "aria").x, aria.x);
  assert.deepEqual(lico.via, original.actors.find((a) => a.id === "lico").via);
  for (let t = 0; t <= journeyDuration(lico, origin); t += 25) {
    const at = sampleJourney(lico, origin, t, false);
    assert.ok(Math.hypot(at.x - aria.x, ((at.bottom - aria.bottom) * 2) / 3) > 13);
  }
  const placement = indoorStudyCue(storyStageCue("starlit-guild-founding-return", 16), 16);
  assert.equal(placement.sequence.at(-1).actors.find((a) => a.id === "aria").x, aria.x);
  const returning = indoorStudyCue(storyStageCue("starlit-guild-founding-return", 21), 21);
  for (const state of [returning, ...returning.sequence]) {
    const walker = state.actors.find((a) => a.id === "aria");
    assert.equal(walker.lane, -25);
    assert.equal(walker.nameAbove, true);
    assert.equal(walker.nameOffset, 0);
    assert.equal(state.actors.find((a) => a.id === "mira").nameOffset, undefined);
    assert.equal(state.actors.find((a) => a.id === "mira").nameAbove, true);
  }
  assert.equal(JSON.stringify(original), before);
});

test("painted research hands meet the specimen without a jump when it is picked up", () => {
  const study = indoorStudyCue(storyStageCue("starlit-guild-founding-return", 18), 18);
  const pickup = study.sequence.at(-1);
  const lico = pickup.actors.find((a) => a.id === "lico");
  const at = sampleStageActor(lico, lico, 0, true);
  const held = pickup.items.find((i) => i.art === "sample-dish");
  const tabled = study.items.find((i) => i.art === "sample-dish");
  const target = stageItemTarget(held, { ...study, ...pickup }, new Map([["lico", at]]));
  assert.ok(Math.abs(target.x - tabled.x) < 0.001);
  assert.ok(Math.abs(target.bottom - tabled.bottom) < 0.001);
  assert.equal(at.frame, 73);
  assert.deepEqual(at.wrist, { x: 81, y: 83 });
  assert.equal(lico.reachOver, "table");
  const table = pickup.items.find((i) => i.id === "table");
  assert.ok(
    stageItemDepth(held, { ...study, ...pickup }, new Map([["lico", at]])) >
      stageItemDepth(table, study, new Map()),
  );
  const original = storyStageCue("starlit-guild-founding-return", 18).actors.find(
    (a) => a.id === "lico",
  );
  assert.equal(original.wristPoints, undefined);
});

test("painted clerk places the quill at its table destination with only the hand above the desk", () => {
  const original = storyStageCue("starlit-guild-founding-return", 42);
  const before = JSON.stringify(original);
  const study = indoorStudyCue(original, 42);
  const placing = study.sequence.find((s) => s.extras?.some((e) => e.service === "place"));
  const release = study.sequence.find((s) =>
    s.items.some((i) => i.id === "clerk-quill" && !i.extra),
  );
  const clerk = placing.extras.find((e) => e.id === "merchant");
  const held = placing.items.find((i) => i.id === "clerk-quill");
  const laid = release.items.find((i) => i.id === "clerk-quill");
  const positions = new Map([
    ["extra:merchant", { ...clerk, wrist: stageExtraWrist(clerk, false, 0) }],
  ]);
  const heldAt = stageItemTarget(held, { ...study, ...placing }, positions);
  const laidAt = stageItemTarget(laid, { ...study, ...release }, new Map());
  assert.ok(Math.abs(heldAt.x - laidAt.x) < 0.001);
  assert.ok(Math.abs(heldAt.bottom - laidAt.bottom) < 0.001);
  assert.equal(clerk.handOver.item, "table");
  assert.ok(clerk.handOver.rect[2] < 64, "Body must not be lifted in front of the table");
  const table = placing.items.find((i) => i.id === "table");
  assert.ok(
    stageItemDepth(held, { ...study, ...placing }, positions) >
      stageItemDepth(table, study, positions),
  );
  assert.equal(study.sequence.at(-1).extras.find((e) => e.id === "merchant").handOver, undefined);
  assert.equal(JSON.stringify(original), before);
});

test("Mira rises before leaving and Leon goes around the desk and her waiting position", () => {
  const original = storyStageCue("starlit-guild-founding-return", 50);
  const before = JSON.stringify(original);
  const study = indoorStudyCue(original, 50);
  const actor = (state, id) => state.actors.find((a) => a.id === id);
  assert.ok(actor(study, "mira").seated);
  for (const step of study.sequence.filter((s) => s.after < 750)) {
    assert.equal(actor(step, "mira").x, 67);
    assert.equal(actor(step, "mira").bottom, 14);
    assert.equal(actor(step, "leon").x, 35);
  }
  const leaving = study.sequence.find((s) => actor(s, "mira").x === 51);
  assert.equal(actor(leaving, "mira").seatTransition, undefined);
  assert.equal(actor(leaving, "mira").seated, false);
  const approach = study.sequence.find((s) => actor(s, "leon").via?.length === 2);
  const leon = actor(approach, "leon");
  const origin = actor(study, "leon");
  const lower = study.sequence.find((s) => actor(s, "leon").seatTransition === "lower");
  assert.equal(leon.seated, false);
  assert.ok(lower.after >= approach.after + journeyDuration(leon, origin));
  assert.ok(actor(study.sequence.at(-1), "leon").seated);
  assert.equal(actor(study.sequence.at(-1), "leon").seatTransition, undefined);
  for (let t = 0; t < journeyDuration(leon, origin); t += 25) {
    const at = sampleJourney(leon, origin, t, false);
    if (at.x > 40 && at.x < 62) assert.equal(at.bottom, -14);
    assert.ok(
      Math.hypot(at.x - 51, (at.bottom * 2) / 3) > 8,
      "Leon must not walk through Mira after she steps away",
    );
  }
  assert.equal(JSON.stringify(original), before);
});

test("Mira stops at the chair before lowering herself and completes the seat transition", () => {
  const original = storyStageCue("starlit-guild-founding-return", 42);
  const before = JSON.stringify(original);
  const study = indoorStudyCue(original, 42);
  const mira = (state) => state.actors.find((a) => a.id === "mira");
  const walk = study.sequence.find((s) => mira(s).x === 67 && !mira(s).seatTransition);
  const lower = study.sequence.find((s) => mira(s).seatTransition === "lower");
  const settle = study.sequence.find((s) => mira(s).seatTransition === "settle");
  const seated = study.sequence.find((s) => s.after > settle.after && mira(s).seated);
  assert.equal(mira(walk).seated, false);
  assert.ok(lower.after >= walk.after + journeyDuration(mira(walk), mira(study)));
  for (const state of [lower, settle, seated]) {
    assert.equal(mira(state).x, mira(walk).x);
    assert.equal(mira(state).bottom, mira(walk).bottom);
  }
  assert.ok(settle.after > lower.after);
  assert.equal(mira(seated).seatTransition, undefined);
  assert.equal(JSON.stringify(original), before);
});

test("standing up precedes departure for both seated men and preserves later actions", () => {
  for (const [line, id] of [
    [16, "finn"],
    [42, "finn"],
    [64, "leon"],
  ]) {
    const original = storyStageCue("starlit-guild-founding-return", line);
    const study = indoorStudyCue(original, line);
    const actor = (state) => state.actors.find((a) => a.id === id);
    assert.ok(actor(study).seated);
    for (const step of study.sequence.filter((s) => s.after < 750)) {
      assert.equal(actor(step).x, 67);
      assert.equal(actor(step).bottom, 14);
      assert.equal(actor(step).via, undefined);
    }
    const walk = study.sequence.find((s) => s.after === 750);
    assert.equal(actor(walk).seatTransition, undefined);
    assert.equal(actor(walk).seated, false);
    for (const step of original.sequence ?? [])
      assert.ok(study.sequence.some((s) => s.after === step.after + 750));
  }
});

test("Finn reaches his chair before the sit-down frames", () => {
  const study = indoorStudyCue(storyStageCue("starlit-guild-founding-return", 22), 22);
  const finn = (state) => state.actors.find((a) => a.id === "finn");
  const previous = storyStageCue("starlit-guild-founding-return", 21);
  const lower = study.sequence.find((s) => finn(s).seatTransition === "lower");
  assert.equal(finn(study).seated, false);
  assert.ok(lower.after >= journeyDuration(finn(study), finn(previous)));
  const clerk = study.extras.find((extra) => extra.id === "merchant");
  const lico = study.actors.find((actor) => actor.id === "lico");
  for (let t = 0; t <= journeyDuration(finn(study), finn(previous)); t += 25) {
    const at = sampleJourney(finn(study), finn(previous), t, false);
    for (const other of [clerk, lico])
      assert.ok(
        Math.hypot(at.x - other.x, ((at.bottom - other.bottom) * 2) / 3) > 8,
        `Finn overlaps ${other.id} on his way to the chair`,
      );
  }
  assert.ok(finn(study.sequence.at(-1)).seated);
});

test("Finn leaves the chair through the clear aisle before the clerk approaches", () => {
  const id = "starlit-guild-founding-return";
  const previous = indoorStudyCue(storyStageCue(id, 41), 41);
  const study = indoorStudyCue(storyStageCue(id, 42), 42);
  const walk = study.sequence.find((step) => step.after === 750);
  const finn = walk.actors.find((actor) => actor.id === "finn");
  const origin = previous.actors.find((actor) => actor.id === "finn");
  const lico = walk.actors.find((actor) => actor.id === "lico");
  const clerk = walk.extras.find((extra) => extra.id === "merchant");
  const clerkMoves = study.sequence.find((step) =>
    step.extras?.some((extra) => extra.id === "merchant" && extra.service === "place"),
  );
  assert.ok(walk.after + journeyDuration(finn, origin) <= clerkMoves.after + 200);
  for (let t = 0; t <= journeyDuration(finn, origin); t += 25) {
    const at = sampleJourney(finn, origin, t, false);
    for (const other of [clerk, lico])
      assert.ok(Math.hypot(at.x - other.x, ((at.bottom - other.bottom) * 2) / 3) > 8);
  }
});

test("painted seated people keep their separate chair throughout the handover", () => {
  for (const line of [0, 41, 42, 44, 60]) {
    const original = storyStageCue("starlit-guild-founding-return", line);
    const before = JSON.stringify(original);
    const study = indoorStudyCue(original, line);
    for (const state of [study, ...(study.sequence ?? [])]) {
      for (const item of state.items.filter((p) => p.art === "chair")) {
        const positions = new Map(
          state.actors.map((actor) => [
            actor.id,
            {
              ...actor,
              onChair: !!actor.chair,
            },
          ]),
        );
        assert.ok(stageItemVisible(item, positions), "chair is not embedded in painted seat art");
      }
    }
    assert.equal(JSON.stringify(original), before, "original atlas visibility stays unchanged");
  }
});

test("study paper placement preserves scale at release and stays on the table without changing the story cue", () => {
  const original = storyStageCue("starlit-guild-founding-return", 60);
  const before = JSON.stringify(original);
  const study = indoorStudyCue(original, 60);
  const widths = new Map();
  for (const items of [study.items, ...study.sequence.map((step) => step.items)]) {
    for (const item of items.filter((p) => ["ledger", "leon-notes"].includes(p.id))) {
      const key = `${item.id}:${item.art}`;
      if (widths.has(key))
        assert.equal(item.width, widths.get(key), "paper changed size when released");
      widths.set(key, item.width);
      if (item.support === "table") {
        assert.ok(item.x - item.width / 2 >= 34);
        assert.ok(item.x + item.width / 2 <= 66);
        assert.ok(67 - item.x < 8, "seated actor must not place paper at the far end");
      }
    }
  }
  assert.equal(JSON.stringify(original), before);
});

test("seated paper placement reaches before release and keeps the arm out until both sheets settle", () => {
  const study = indoorStudyCue(storyStageCue("starlit-guild-founding-return", 60), 60);
  const steps = study.sequence;
  const leon = (step) => step.actors.find((actor) => actor.id === "leon");
  const reach = steps.find((step) => leon(step).pose === "offer");
  assert.equal(leon(reach).seatedPaper, "reach");
  assert.ok(study.finishBeforeAdvance, "dialogue must wait for placement to finish");
  for (const id of ["ledger", "leon-notes"]) {
    const release = steps.find((step) =>
      step.items.some((p) => p.id === id && p.support === "table"),
    );
    assert.ok(
      reach.after + 650 <= release.after,
      "paper must reach the hand before it leaves for the desk",
    );
    assert.equal(leon(release).pose, "offer");
    const retract = steps.find((step) => step.after > release.after && leon(step).pose !== "offer");
    assert.ok(retract.after >= release.after + 650, "arm returned before paper transfer settled");
  }
  assert.equal(leon(steps.at(-1)).pose, leon(steps[0]).pose);
  const releaseHand = steps.find((step) => leon(step).seatedPaper === "release");
  assert.ok(
    releaseHand.items
      .filter((p) => ["ledger", "leon-notes"].includes(p.id))
      .every((p) => p.support === "table" && !p.actor),
  );
  assert.equal(leon(steps.at(-1)).seatedPaper, undefined, "hand state must clear after placement");
});
