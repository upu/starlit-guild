import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookPresentation, storybookStageAttributes } from "../lib/storybook/presentation.ts";
import { stageItemDepth, stageItemTarget } from "../lib/story-stage-props.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";

const id = "moss-transplant-departure";

test("the cart has two registered wheels that stay with it through sinking and recovery", () => {
  for (let line = 16; line <= 37; line++) {
    const cue = studyCue(id, line, true);
    for (const state of [cue, ...(cue.sequence ?? [])]) {
      const cart = state.items.find((item) => item.id === "transplant-cart");
      const wheels = state.items.filter((item) => item.art === "cart-wheel");
      assert.equal(wheels.length, 2);
      for (const wheel of wheels) {
        assert.equal(wheel.carrier, cart.id);
        assert.equal(wheel.width, 5.5);
      }
      assert.equal(wheels.find((wheel) => wheel.id.endsWith("far")).behindOwner, true);
      const near = wheels.find((wheel) => wheel.id.endsWith("near"));
      assert.equal(near.x, cart.tilt ? -5.8 : -6.6);
      assert.equal(near.bottom, cart.tilt ? -0.4 : 1.5);
    }
  }
  const cue = studyCue(id, 37, true);
  const recovered = cue.sequence.find((step) => step.after === 2600);
  const cart = recovered.items.find((item) => item.id === "transplant-cart");
  const board = recovered.items.find((item) => item.id === "wheel-board");
  const wheel = recovered.items.find((item) => item.id === "transplant-wheel-near");
  const bottom = cart.bottom + wheel.bottom;
  const boardHeight = (board.width * 1.5 * Math.cos((55 * Math.PI) / 180)) / 4;
  assert.ok(bottom >= board.bottom && bottom <= board.bottom + boardHeight);
  assert.ok(Math.abs(cart.x + wheel.x - board.x) < board.width / 2);
  assert.ok(
    Math.abs(
      cue.actors.find((a) => a.id === "mira").x - cue.actors.find((a) => a.id === "finn").x,
    ) >= 10,
  );
  assert.equal(cue.actors.find((a) => a.id === "finn").nameAbove, true);
});

test("the short departure gives Finn a full pulling cycle while the cart follows him", () => {
  const cue = studyCue(id, 16, true);
  const move = cue.sequence.find((s) => s.after === 2200);
  const origin = cue.actors.find((a) => a.id === "finn");
  const finn = move.actors.find((a) => a.id === "finn");
  assert.equal(journeyDuration(finn, origin), 720);
  assert.equal(sampleJourney(finn, origin, 360, false).moving, true);
  assert.equal(sampleJourney(finn, origin, 720, false).moving, false);
  assert.equal(sampleJourney(finn, origin, 0, true).x, finn.x);
  assert.equal(move.items.find((item) => item.id === "transplant-cart").actor, "finn");
  for (const actor of move.actors) assert.equal(actor.paceMsPerUnit, 180);
});

test("Finn waits for the recovered cart to settle at his hand before the party departs", () => {
  const cue = studyCue(id, 37, true);
  const recovered = cue.sequence.find((step) => step.after === 3400);
  const grip = cue.sequence.find((step) => step.after === 3800);
  const leave = cue.sequence.find((step) => step.after === 4500);
  const before = recovered.actors.find((actor) => actor.id === "finn");
  const waiting = grip.actors.find((actor) => actor.id === "finn");
  const walking = leave.actors.find((actor) => actor.id === "finn");
  const cart = grip.items.find((item) => item.id === "transplant-cart");
  assert.equal(waiting.x, before.x);
  assert.equal(waiting.bottom, before.bottom);
  assert.equal(cart.actor, "finn");
  assert.ok(leave.after - grip.after >= 650);
  assert.ok(journeyDuration(walking, waiting) >= 720);
  assert.equal(
    cue.sequence.find((step) => step.after === 4600).actors.find((actor) => actor.id === "finn")
      .paceMsPerUnit,
    80,
  );
  const origin = recovered.items.find((item) => item.id === "transplant-cart");
  const position = stageItemTarget(
    cart,
    { ...cue, ...grip },
    new Map([["finn", sampleStageActor(waiting, waiting, 0, true)]]),
  );
  assert.ok(Math.hypot(position.x - origin.x, position.bottom - origin.bottom) < 3);
});

test("each painted pulling hand meets the cart handle at the shared body scale", async () => {
  const cue = studyCue(id, 16, true);
  const state = cue.sequence.find((s) => s.after === 2200);
  const finn = state.actors.find((a) => a.id === "finn");
  const cart = state.items.find((item) => item.id === "transplant-cart");
  const positions = new Map(state.actors.map((a) => [a.id, sampleStageActor(a, a, 0, true)]));
  const cartAt = stageItemTarget(cart, cue, positions);
  const shaft = {
    x: cartAt.x + cart.width * (445.92 / 512 - 0.5),
    bottom: cartAt.bottom + (cart.width * 1.5 * (288 - 263.01)) / 512,
  };
  const raw = await sharp("public/storybook-study/finn-pull-scene-balanced-v3.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let frame = 0; frame < 4; frame++) {
    const hand = paintedHand(raw.data, raw.info.width, frame);
    const x = finn.x + cue.cell * (hand.x / 192 - 0.5);
    const bottom = finn.bottom + cue.cell * 1.5 * (1 - hand.y / 192 - 1 / 48);
    assert.ok(Math.abs(x - shaft.x) < 0.4, `frame ${frame}: horizontal contact`);
    assert.ok(Math.abs(bottom - shaft.bottom) < 0.4, `frame ${frame}: vertical contact`);
  }
  assert.ok(stageItemDepth(cart, cue, positions) < Math.round(100 - finn.bottom));
});

test("the pulling cycle alternates a lifted rear boot and lifted front toe", async () => {
  const { data, info } = await sharp("public/storybook-study/finn-pull-scene-balanced-v3.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  function groundPixels(frame, left, right) {
    let count = 0;
    for (let y = 170; y < 177; y++)
      for (let x = left; x < right; x++)
        if (data[(y * info.width + frame * 192 + x) * 4 + 3] > 128) count++;
    return count;
  }
  assert.ok(groundPixels(0, 50, 80) > 30);
  assert.equal(groundPixels(1, 50, 80), 0, "rear boot rises in the second frame");
  assert.ok(groundPixels(0, 120, 140) > 30);
  assert.ok(
    groundPixels(3, 120, 140) < groundPixels(0, 120, 140) * 0.2,
    "front toe rises in the fourth frame",
  );
  assert.ok(groundPixels(3, 50, 80) > 30, "the other boot remains on the ground");
});

function paintedHand(data, width, frame) {
  let xSum = 0,
    ySum = 0,
    count = 0;
  for (let y = 96; y < 114; y++)
    for (let x = 26; x < 49; x++) {
      const p = (y * width + frame * 192 + x) * 4;
      const [red, green, blue, alpha] = data.subarray(p, p + 4);
      if (alpha > 180 && red > 110 && red > green * 1.15 && green > blue * 1.1 && green > 60) {
        xSum += x;
        ySum += y;
        count++;
      }
    }
  assert.ok(count > 30, `frame ${frame}: recognizable hand pixels`);
  return { x: xSum / count, y: ySum / count };
}

test("the cart's moss lights the nearby pair before Mira joins Lico", () => {
  const cue = studyCue(id, 16, true);
  for (const state of [cue, ...cue.sequence]) {
    const cart = target(
      cue,
      state,
      state.items.find((item) => item.id === "transplant-cart"),
    );
    const mossX = [cart.x - 6, cart.x + 1];
    for (const actor of state.actors.filter((a) => a.id === "aria" || a.id === "leon"))
      assert.ok(Math.min(...mossX.map((x) => Math.abs(actor.x - x))) < 12, actor.id);
  }
  assert.equal(storybookStageAttributes(id, 16)["data-transplant-moss-light"], true);
  assert.equal(storybookStageAttributes(id, 19)["data-transplant-moss-light"], true);
  assert.equal(storybookStageAttributes(id, 20)["data-transplant-moss-light"], false);
  const stopped = studyCue(id, 20, true);
  const mira = stopped.actors.find((a) => a.id === "mira");
  const lico = stopped.actors.find((a) => a.id === "lico");
  assert.ok(Math.abs(mira.x - lico.x) <= 8);
  assert.equal(stopped.finishBeforeAdvance, true);
  const handoff = studyCue(id, 31, true);
  assert.ok(
    handoff.actors.find((a) => a.id === "mira").x - handoff.actors.find((a) => a.id === "aria").x >
      15,
  );
});
const target = (cue, state, item) =>
  stageItemTarget(
    item,
    cue,
    new Map(state.actors.map((a) => [a.id, sampleStageActor(a, a, 0, true)])),
  );
test("the entire night continues at the yard body scale and preserves the three boards and basket", () => {
  for (let line = 16; line < 38; line++) {
    const cue = studyCue(id, line, true);
    assert.equal(cue.cell, 19);
    assert.equal(storybookPresentation(id, cue.background).art, "transplant-night-path-v1");
    for (const state of [cue, ...(cue.sequence ?? [])]) {
      assert.equal(state.actors.length, 5);
      assert.ok(state.items.some((i) => i.id === "transplant-basket"));
      assert.equal(
        state.items.filter((i) => i.id === "wheel-board" || i.id.startsWith("spare-board-")).length,
        3,
      );
    }
  }
});
test("the basket changes hands at one shared contact instead of jumping between two owners", () => {
  const cue = studyCue(id, 31, true);
  const next = cue.sequence.find((s) => s.after === 1600);
  const from = target(
    cue,
    cue,
    cue.items.find((i) => i.id === "transplant-basket"),
  );
  const to = target(
    cue,
    next,
    next.items.find((i) => i.id === "transplant-basket"),
  );
  assert.ok(Math.abs(from.x - to.x) < 0.001);
  assert.ok(Math.abs(from.bottom - to.bottom) < 0.001);
});
test("the basket reaches the dry patch through the low hand, and the pickup keeps the same contact", () => {
  const cue = studyCue(id, 31, true);
  const low = cue.sequence.find((s) => s.after === 6000);
  const held = target(
    cue,
    low,
    low.items.find((i) => i.id === "transplant-basket"),
  );
  const floor = cue.sequence
    .find((s) => s.after === 6700)
    .items.find((i) => i.id === "transplant-basket");
  assert.ok(Math.abs(held.x - floor.x) < 0.001 && Math.abs(held.bottom - floor.bottom) < 0.001);
  const pickup = studyCue(id, 35, true),
    lifted = pickup.sequence.find((s) => s.after === 3600);
  const to = target(
    pickup,
    lifted,
    lifted.items.find((i) => i.id === "transplant-basket"),
  );
  assert.ok(Math.abs(to.x - floor.x) < 0.001 && Math.abs(to.bottom - floor.bottom) < 0.001);
});
test("the cart has a floor near the bottom of its image and Finn retains one body scale", async () => {
  const { data, info } = await sharp("public/storybook-study/transplant-cart-v1.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let bottom = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 128) bottom = y;
  assert.ok(info.height - bottom < 12);
  const frames = JSON.parse(
    await readFile("public/storybook-study/finn-pull-scene-balanced-v3-metrics.json", "utf8"),
  );
  assert.equal(new Set(frames.map((f) => f.scale)).size, 1);
  assert.ok(
    frames.every((f) => f.baseline === 176 && f.top > 3 && f.left > 2 && f.left + f.width < 190),
  );
});
test("the final exit retains the painted road's body scale and cargo", () => {
  const cue = storybookExitCue(id);
  assert.equal(cue.cell, 19);
  assert.equal(storybookPresentation(id, cue.background).art, "transplant-night-path-v1");
  assert.ok(cue.items.some((i) => i.id === "transplant-cart"));
  assert.equal(cue.actors.find((actor) => actor.id === "finn").nameAbove, true);
});
test("Aria reaches the rear of the cart before Finn and the cart move together", () => {
  const last = studyCue(id, 37, true).sequence.at(-1);
  const exit = storybookExitCue(id);
  const depart = exit.sequence[0];
  const actor = (state, id) => state.actors.find((value) => value.id === id);
  const approach = actor(exit, "aria");
  const prior = actor(last, "aria");
  assert.ok(journeyDuration(approach, prior) < depart.after);
  for (const name of ["finn", "lico", "mira", "leon"]) {
    assert.equal(actor(exit, name).x, actor(last, name).x);
    assert.equal(actor(exit, name).bottom, actor(last, name).bottom);
  }
  assert.equal(exit.items.find((item) => item.id === "transplant-basket").actor, "lico");
  assert.equal(depart.items.find((item) => item.id === "transplant-cart").actor, "finn");
  const aria = actor(depart, "aria"),
    finn = actor(depart, "finn");
  assert.equal(aria.push, "extend");
  assert.equal(aria.reachOver, "transplant-cart");
  for (let time = 0; time <= 4300; time += 25) {
    const a = sampleJourney(aria, approach, time, false);
    const f = sampleJourney(finn, actor(exit, "finn"), time, false);
    assert.ok(Math.abs(f.x - a.x - (actor(exit, "finn").x - approach.x)) < 0.001);
    assert.equal(a.bottom, approach.bottom);
    assert.equal(f.bottom, actor(exit, "finn").bottom);
  }
});
test("Lico passes in front of Aria without their bodies crossing during the final move", () => {
  const cue = studyCue(id, 37, true);
  const before = cue.sequence.find((step) => step.after === 3400);
  const moving = cue.sequence.find((step) => step.after === 4500);
  const repeated = cue.sequence.find((step) => step.after === 4600);
  const follow = cue.sequence.find((step) => step.after === 5800);
  const get = (state, id) => state.actors.find((actor) => actor.id === id);
  const aria = get(moving, "aria"),
    lico = get(follow, "lico");
  const initialAria = get(before, "aria"),
    initialLico = get(before, "lico");
  for (let time = 0; time <= 2500; time += 25) {
    const a = sampleJourney(aria, initialAria, time + 1300, false);
    const l = sampleJourney(lico, initialLico, time, false);
    assert.ok(l.bottom >= 0, "Lico and her basket stay inside the stage");
    if (Math.abs(a.x - l.x) < 6)
      assert.ok(a.bottom - l.bottom >= 18, `insufficient depth at ${time}ms`);
  }
  assert.equal(get(moving, "lico").x, initialLico.x);
  assert.equal(get(repeated, "lico").x, initialLico.x);
  assert.equal(lico.bottom, 10);
  assert.equal(aria.nameAbove, true);
});
test("the wheel board meets the low hand before becoming a ground prop", () => {
  const cue = studyCue(id, 37, true);
  const held = cue.sequence.find((s) => s.after === 900),
    floor = cue.sequence.find((s) => s.after === 1800);
  const contact = target(
    cue,
    held,
    held.items.find((i) => i.id === "wheel-board"),
  );
  const board = floor.items.find((i) => i.id === "wheel-board");
  assert.ok(
    Math.abs(contact.x - board.x) < 0.001 && Math.abs(contact.bottom - board.bottom) < 0.001,
  );
});
test("Mira's low free hand reaches the cloth's near edge while Lico lifts the basket", () => {
  const cue = studyCue(id, 35, true),
    m = cue.actors.find((a) => a.id === "mira");
  const sample = sampleStageActor(m, m, 0, true),
    cloth = cue.items.find((i) => i.id === "basket-cloth");
  const handX = m.x + ((sample.wrist.x - 64) * cue.cell) / 128;
  const handBottom = m.bottom + (((128 - sample.wrist.y) * cue.cell) / 128) * 1.5;
  assert.ok(Math.abs(handX - (cloth.x - cloth.width / 2)) < 0.001);
  assert.ok(Math.abs(handBottom - cloth.bottom) < 0.001);
});
