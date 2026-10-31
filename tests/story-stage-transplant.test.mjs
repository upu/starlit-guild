import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue, storyStageExitCue } from "../lib/story-stage.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageWrist } from "../lib/story-stage-wrists.ts";
import { stageItemTarget, stageItemVisible } from "../lib/story-stage-props.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";

test("Leon strikes once while the others free the cart and the threat retreats outside", () => {
  const cue = storyStageCue("moss-transplant-departure", 37);
  const threat = (s) => s.items.find((p) => p.id === "transplant-threat");
  const approach = cue.sequence.find((s) => threat(s).x > 0);
  const strike = cue.sequence.find((s) => s.actors.find((a) => a.id === "leon").sword === "strike");
  const retreat = cue.sequence.find(
    (s) => s.after > strike.after && threat(s).x < threat(strike).x,
  );
  assert.ok(strike.after >= approach.after + threat(approach).travelMs);
  assert.ok(retreat.after >= strike.after + 600);
  assert.ok(threat(cue).x < 0 && threat(cue.sequence.at(-1)).x < 0);
  const leon = strike.actors.find((a) => a.id === "leon");
  for (const state of [cue, ...cue.sequence]) {
    assert.equal(threat(state).width, 7);
    assert.equal(state.actors.find((a) => a.id === "leon").x, leon.x);
    assert.ok(state.items.some((p) => p.id === "wheel-board"));
  }
  assert.deepEqual(
    [0, 150, 300, 450, 1600].map((t) => actorPose(leon, false, t, false).frame),
    [10, 11, 12, 13, 13],
  );
  assert.equal(actorPose(leon, false, 0, true).frame, 13);
  assert.equal(
    actorPose(
      retreat.actors.find((a) => a.id === "leon"),
      false,
      0,
      false,
    ).frame,
    21,
  );
});

test("the surplus boards move together from the cart to dry ground and stay behind", () => {
  const cue = storyStageCue("moss-transplant-departure", 33);
  const board = (s) => s.items.find((p) => p.id === "spare-board-0");
  const pickup = cue.sequence.find((s) => board(s).actor === "finn");
  const laid = cue.sequence.find((s) => !board(s).actor && !board(s).carrier);
  assert.equal(cue.finishBeforeAdvance, true);
  assert.ok(pickup.after < laid.after);
  const walking = cue.sequence.find(
    (s) => s.after > pickup.after && s.actors.find((a) => a.id === "finn").carry,
  );
  assert.ok(
    laid.after - walking.after >
      journeyDuration(
        walking.actors.find((a) => a.id === "finn"),
        pickup.actors.find((a) => a.id === "finn"),
      ),
  );
  const finn = pickup.actors.find((a) => a.id === "finn");
  const pose = actorPose(finn, false, 0, false);
  const positions = new Map([
    ["finn", { ...finn, wrist: stageWrist("finn", pose.atlas, pose.frame) }],
    ["item:transplant-cart", cue.items.find((p) => p.id === "transplant-cart")],
  ]);
  const from = stageItemTarget(board(cue), cue, positions);
  const to = stageItemTarget(board(pickup), cue, positions);
  assert.ok(Math.hypot(from.x - to.x, from.bottom - to.bottom) < 0.001);
  for (let line = 16; line <= 37; line++) {
    const s = storyStageCue("moss-transplant-departure", line);
    for (const step of [s, ...(s.sequence ?? [])]) {
      for (const id of ["wheel-board", "spare-board-0", "spare-board-1"]) {
        assert.equal(step.items.filter((p) => p.id === id).length, 1);
        assert.equal(step.items.find((p) => p.id === id).width, 13);
      }
      if (line > 33) {
        assert.equal(board(step).actor, undefined);
        assert.equal(board(step).carrier, undefined);
        assert.equal(board(step).x, board(laid).x);
      }
    }
  }
  const exit = storyStageExitCue("moss-transplant-departure");
  assert.deepEqual(board(exit), board(laid));
  const cart = storyStageCue("moss-transplant-departure", 37)
    .sequence.at(-1)
    .actors.find((a) => a.id === "finn");
  assert.ok(
    board(laid).bottom - cart.bottom >= 20,
    "leave boards away from the cart's onward route",
  );
  assert.equal(board(laid).pitch, 55);
  for (const frame of [14, 15, 16]) assert.ok(stageWrist("finn", "conversation", frame));
});

test("Leon takes the rope from the cart before putting it aside and drawing his sword", () => {
  const rope = (s) => s.items.find((p) => p.id === "transplant-rope");
  const before = storyStageCue("moss-transplant-departure", 24);
  assert.equal(rope(before).carrier, "transplant-cart");
  const cue = storyStageCue("moss-transplant-departure", 25);
  const approach = cue.actors.find((a) => a.id === "leon");
  const take = cue.sequence.find((s) => rope(s)?.actor === "leon");
  const walk = cue.sequence.find(
    (s) => s.after > take.after && s.actors.find((a) => a.id === "leon").x !== approach.x,
  );
  const put = cue.sequence.find((s) => !rope(s)?.actor && !rope(s)?.carrier);
  const sword = cue.sequence.find((s) => s.actors.find((a) => a.id === "leon").sword);
  assert.ok(
    take.after >
      journeyDuration(
        approach,
        before.actors.find((a) => a.id === "leon"),
      ),
  );
  assert.ok(
    put.after - walk.after >
      journeyDuration(
        walk.actors.find((a) => a.id === "leon"),
        approach,
      ),
  );
  assert.ok(sword.after >= put.after + 650);
  assert.equal(cue.finishBeforeAdvance, true);
  const leon = take.actors.find((a) => a.id === "leon");
  const pose = actorPose(leon, false, 0, false);
  const cart = cue.items.find((p) => p.id === "transplant-cart");
  const positions = new Map([
    ["leon", { ...leon, ...pose, wrist: stageWrist("leon", pose.atlas, pose.frame) }],
    ["item:transplant-cart", cart],
  ]);
  const from = stageItemTarget(rope(cue), cue, positions);
  const to = stageItemTarget(rope(take), cue, positions);
  assert.ok(Math.hypot(from.x - to.x, from.bottom - to.bottom) < 0.001);
  for (const state of [before, cue, ...cue.sequence]) assert.equal(rope(state).width, 6);
  for (const line of [26, 31, 35, 37]) {
    const s = storyStageCue("moss-transplant-departure", line);
    assert.equal(rope(s).actor, undefined);
    assert.equal(rope(s).carrier, undefined);
    assert.equal(rope(s).x, rope(put).x);
  }
});

test("Leon sets both hoes down before departure without changing their scale", () => {
  const initial = storyStageCue("moss-transplant-departure", 9);
  const cue = storyStageCue("moss-transplant-departure", 12);
  assert.equal(cue.finishBeforeAdvance, true);
  for (const id of ["loading-hoe-0", "loading-hoe-1"]) {
    assert.equal(initial.items.find((p) => p.id === id).behindOwner, true);
    const stages = [cue, ...cue.sequence];
    const heldAt = stages.findIndex((s) => s.items.find((p) => p.id === id)?.wrist);
    const laidAt = stages.findIndex((s) => !s.items.find((p) => p.id === id)?.actor);
    assert.ok(heldAt >= 0 && laidAt > heldAt);
    for (const step of stages) assert.equal(step.items.find((p) => p.id === id).width, 3.5);
    for (const line of [13, 14, 15])
      assert.equal(
        storyStageCue("moss-transplant-departure", line).items.find((p) => p.id === id).actor,
        undefined,
      );
    assert.ok(!storyStageCue("moss-transplant-departure", 16).items.some((p) => p.id === id));
  }
  const hand = cue.items.find((p) => p.id === "loading-hoe-0");
  for (const time of [0, 130, 260, 390]) {
    const leon = cue.actors.find((a) => a.id === "leon");
    const pose = actorPose(leon, true, time, false);
    const wrist = stageWrist("leon", pose.atlas, pose.frame);
    assert.ok(wrist);
    const owner = { ...leon, ...pose, wrist };
    const at = stageItemTarget(hand, cue, new Map([["leon", owner]]));
    const palm = stageItemTarget(
      { ...hand, wristOffset: undefined },
      cue,
      new Map([["leon", owner]]),
    );
    assert.ok(Math.abs(at.x + (leon.left ? -1.2 : 1.2) - palm.x) < 0.001);
    assert.ok(Math.abs(at.bottom + 11.8 - palm.bottom) < 0.001);
  }
});

test("transplanted moss stays in its bed while Lico inspects then records it", () => {
  const cue = storyStageCue("moss-transplant-return", 3);
  const snapshots = [cue, ...cue.sequence];
  const patches = snapshots.map((s) => s.items.find((p) => p.id === "transplanted-moss"));
  for (const patch of patches) {
    assert.equal(patch.art, "moss");
    assert.equal(patch.actor, undefined);
    assert.equal(patch.glow, "dim");
    assert.deepEqual(patch, patches[0]);
  }
  assert.ok(snapshots.every((s) => s.items.every((p) => p.art !== "seedlings")));
  const inspect = cue.sequence.find((s) => s.actors.find((a) => a.id === "lico").inspect);
  const write = cue.sequence.find(
    (s) => s.actors.find((a) => a.id === "lico").mossStudy === "write",
  );
  assert.ok(inspect.after < write.after);
  const lico = inspect.actors.find((a) => a.id === "lico");
  assert.ok(Math.abs(lico.x - patches[0].x) < 5);
  assert.ok(Math.abs(lico.bottom - patches[0].bottom) < 5);
});

test("the dry cloth passes between touching hands before Aria steps back", () => {
  const cue = storyStageCue("moss-transplant-return", 0);
  const positions = new Map(
    cue.actors.map((a) => {
      const pose = actorPose(a, false, 0, false);
      return [a.id, { ...a, ...pose, wrist: stageWrist(a.id, pose.atlas, pose.frame) }];
    }),
  );
  const cloth = (items) => items.find((p) => p.id === "dry-cloth");
  const transfer = cue.sequence.find((s) => cloth(s.items)?.actor === "lico");
  const from = stageItemTarget(cloth(cue.items), cue, positions);
  const to = stageItemTarget(cloth(transfer.items), cue, positions);
  assert.ok(Math.hypot(from.x - to.x, from.bottom - to.bottom) < 0.1);
  assert.ok(transfer.after < cue.sequence.at(-1).after);
  assert.equal(cue.finishBeforeAdvance, true);
  assert.ok(cloth(cue.items).width < 4);
  const record = storyStageCue("moss-transplant-return", 3);
  assert.equal(record.sequence.at(-1).actors.find((a) => a.id === "lico").mossStudy, "write");
});

test("transplant basket is handed over only after the two palms meet", () => {
  const cue = storyStageCue("moss-transplant-departure", 31);
  assert.equal(cue.finishBeforeAdvance, true);
  const positions = new Map(
    cue.actors.map((a) => {
      const pose = actorPose(a, false, 0, false);
      return [a.id, { ...a, ...pose, wrist: stageWrist(a.id, pose.atlas, pose.frame) }];
    }),
  );
  const basket = (items) => items.find((p) => p.id === "transplant-basket");
  const from = basket(cue.items);
  const transfer = cue.sequence.find((s) => basket(s.items)?.actor === "aria");
  assert.equal(from.actor, "lico");
  assert.ok(transfer.after >= 1500);
  const to = basket(transfer.items);
  const a = stageItemTarget(from, cue, positions),
    b = stageItemTarget(to, cue, positions);
  assert.ok(Math.hypot(a.x - b.x, a.bottom - b.bottom) < 0.1);
  assert.ok(stageItemVisible(from, positions) && stageItemVisible(to, positions));
  for (const id of ["aria", "lico"]) {
    const actor = { ...cue.actors.find((a) => a.id === id), carry: true };
    for (const elapsed of [0, 130, 260, 390]) {
      const pose = actorPose(actor, true, elapsed, false);
      assert.ok(stageWrist(id, pose.atlas, pose.frame), `${id} loses basket while walking`);
    }
  }
});

test("Mira reaches and holds the cloth edge before Lico lifts the basket", () => {
  const before = storyStageCue("moss-transplant-departure", 34);
  const cue = storyStageCue("moss-transplant-departure", 35);
  const mira = cue.actors.find((a) => a.id === "mira");
  const cloth = cue.items.find((p) => p.id === "basket-cloth");
  assert.ok(
    cue.sequence[0].after >
      journeyDuration(
        mira,
        before.actors.find((a) => a.id === "mira"),
      ),
  );
  const pose = actorPose(mira, false, 0, false);
  const wrist = stageWrist("mira", pose.atlas, pose.frame);
  const pixel = cue.cell / 128;
  assert.equal(mira.x + (wrist.x - 64) * pixel, cloth.x - cloth.width / 2);
  assert.equal(mira.bottom + (128 - wrist.y) * pixel * 1.5, cloth.bottom);
});

test("the wheel board is laid before the cart is lifted and remains after it leaves", () => {
  const cue = storyStageCue("moss-transplant-departure", 37);
  const board = (s) => s.items.find((p) => p.id === "wheel-board");
  const held = cue.sequence.find((s) => board(s)?.actor);
  const laid = cue.sequence.find((s) => board(s) && !board(s).actor && !board(s).carrier);
  const raised = cue.sequence.find(
    (s) => s.items.find((p) => p.id === "transplant-cart").support === "wheel-board",
  );
  assert.ok(held.after < laid.after && laid.after < raised.after);
  const aria = held.actors.find((a) => a.id === "aria");
  const pose = actorPose(aria, false, 0, false);
  const at = stageItemTarget(
    board(held),
    cue,
    new Map([["aria", { ...aria, wrist: stageWrist("aria", pose.atlas, pose.frame) }]]),
  );
  assert.equal(at.x, board(laid).x);
  assert.equal(at.bottom, board(laid).bottom);
  assert.ok(board(cue.sequence.at(-1)));
});

test("transport stays outside the beds and keeps moss attached to a basket", () => {
  for (const line of [16, 20, 25, 31, 35, 37]) {
    const cue = storyStageCue("moss-transplant-departure", line);
    assert.equal(cue.background, "transplant-path");
    for (const state of [cue, ...(cue.sequence ?? [])]) {
      assert.ok(!state.items.some((p) => p.art === "seedlings" || p.art === "seedling-cart"));
      for (const item of state.items.filter((p) => p.carrier))
        assert.ok(
          state.items.some((p) => p.id === item.carrier),
          item.id,
        );
    }
  }
});

test("the party waits on screen for the final tap before taking the cart away", () => {
  const last = storyStageCue("moss-transplant-departure", 37);
  const settled = last.sequence.at(-1);
  const exit = storyStageExitCue("moss-transplant-departure");
  for (const id of ["aria", "lico", "mira", "finn"]) {
    assert.ok(settled.actors.find((a) => a.id === id).x < 100);
    assert.ok(exit.actors.find((a) => a.id === id).x > 100);
  }
  assert.ok(exit.actors.find((a) => a.id === "leon").x < 100);
  assert.equal(settled.items.find((p) => p.id === "transplant-cart").actor, "finn");
});

test("the cloth reaches the ground before the basket and care starts after the handoff", () => {
  const cue = storyStageCue("moss-transplant-departure", 31);
  const item = (step, id) => step.items.find((p) => p.id === id);
  const held = cue.sequence.find((s) => item(s, "basket-cloth")?.wrist);
  assert.equal(item(cue, "basket-cloth").carrier, "transplant-basket");
  const laid = cue.sequence.find(
    (s) =>
      item(s, "basket-cloth") && !item(s, "basket-cloth").actor && !item(s, "basket-cloth").carrier,
  );
  const placed = cue.sequence.find((s) => !item(s, "transplant-basket").actor);
  assert.ok(held.after < laid.after && laid.after < placed.after);
  assert.equal(item(laid, "transplant-basket").actor, "aria");
  assert.equal(item(placed, "transplant-basket").support, "basket-cloth");
  const aria = held.actors.find((a) => a.id === "aria");
  const pose = actorPose(aria, false, 0, false);
  const positions = new Map([
    ["aria", { ...aria, ...pose, wrist: stageWrist("aria", pose.atlas, pose.frame) }],
  ]);
  const at = stageItemTarget(item(held, "basket-cloth"), cue, positions);
  assert.equal(at.x, item(laid, "basket-cloth").x);
  assert.equal(at.bottom, item(laid, "basket-cloth").bottom);
  const care = cue.sequence.find((s) => s.actors.find((a) => a.id === "mira").healing === "treat");
  assert.equal(item(care, "transplant-basket").actor, "aria");
  assert.equal(care.actors.find((a) => a.id === "lico").mossStudy, "reach");
  assert.equal(
    storyStageCue("moss-transplant-departure", 36).actors.find((a) => a.id === "mira").healing,
    undefined,
  );
});
