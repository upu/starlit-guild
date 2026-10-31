import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { stageItemDepth, stageItemTarget } from "../lib/story-stage-props.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";
import {
  foundingCargo,
  foundingCargoPosition,
  foundingCargoSize,
} from "../lib/road-founding-cargo.ts";
import { STANDARD_QUEST_NODES } from "../lib/puppet-battles.ts";

const id = "starlit-guild-founding-departure";
const item = (s, id) => s.items.find((i) => i.id === id);
const actor = (s, id) => s.actors.find((a) => a.id === id);
function hand(c, a) {
  const s = sampleStageActor(a, a, 0, true);
  return {
    x: a.x + (((s.wrist.x - 64) * c.cell) / 128) * (s.left ? -1 : 1),
    bottom: (a.bottom ?? 14) + (((128 - s.wrist.y) * c.cell) / 128) * 1.5,
  };
}
const at = (c, s, i) =>
  stageItemTarget(i, c, new Map(s.actors.map((a) => [a.id, sampleStageActor(a, a, 0, true)])));
const near = (a, b) => assert.ok(Math.abs(a.x - b.x) + Math.abs(a.bottom - b.bottom) < 0.001);

test("all42 lines keep a shared body scale and the established courtyard-to-road transition", () => {
  for (let line = 0; line < 42; line++) {
    const c = studyCue(id, line, true);
    assert.equal(c.cell, 19);
    const displayed = stageCameraCue(c);
    assert.equal(displayed.cameraScale, line < 37 ? 0.72 : 0.46);
    assert.ok(
      displayed.actors.every(
        (a) =>
          Math.abs((a.x - 50) * displayed.cameraScale) + (c.cell * displayed.cameraScale) / 2 < 50,
      ),
    );
    assert.equal(c.actors.length, 5);
    assert.equal(
      storybookPresentation(id, c.background).art,
      line < 37 ? "founding-tower-yard-v1" : "founding-return-path-v1",
    );
    assert.ok(item(c, "lico-travel-bag"));
    if (line >= 19) assert.ok(item(c, "comparison-jar"));
    if (line >= 37) assert.ok(item(c, "return-cart"));
  }
});
test("the five travellers enter the road together over one pulling cycle", () => {
  const c = studyCue(id, 37, true);
  for (const a of c.actors) {
    const origin = { x: c.initial[a.id], bottom: c.initialBottom[a.id] };
    assert.equal(journeyDuration(a, origin), 720, a.id);
    assert.equal(sampleJourney(a, origin, 360, false).moving, true, a.id);
    assert.equal(sampleJourney(a, origin, 720, false).moving, false, a.id);
    assert.equal(sampleJourney(a, origin, 0, true).x, a.x, a.id);
  }
  assert.equal(item(c, "return-cart").actor, "finn");
});
test("the departure cart carries the same cargo as the start of the adventure", () => {
  const cargo = foundingCargo(STANDARD_QUEST_NODES, new Set());
  for (let line = 37; line < 42; line++) {
    const c = studyCue(id, line, true);
    const cart = item(c, "return-cart");
    for (const [kind, prefix, aspect] of [
      ["basket", "return-basket", 197 / 256],
      ["letter", "return-letters", 1],
    ]) {
      const shown = c.items.filter((i) => i.id === prefix || i.id.startsWith(`${prefix}-`));
      assert.equal(shown.length, cargo.slots[kind].length);
      assert.equal(new Set(shown.map((i) => i.id)).size, shown.length);
      shown.forEach((prop, index) => {
        const [x, y] = foundingCargoPosition(kind, index);
        const width = cart.width * foundingCargoSize[kind];
        assert.equal(prop.carrier, cart.id);
        assert.ok(Math.abs(prop.width - width) < 0.00001);
        assert.ok(Math.abs(prop.x - cart.width * x) < 0.00001);
        // Compare image centers against the adventure cart's wheel-contact origin.
        assert.ok(
          Math.abs(prop.bottom / 1.5 + (width * aspect) / 2 - cart.width * (20 / 504 - y)) <
            0.00001,
        );
      });
    }
  }
});
test("after the last line the two leave the stone before the whole party resumes", () => {
  const last = studyCue(id, 41, true);
  const exit = storybookExitCue(id);
  const onward = exit.sequence[0];
  const start = (name) => actor(last, name);
  const target = (name) => actor(exit, name);
  for (const name of ["aria", "lico"]) {
    assert.equal(start(name).inspect, true);
    assert.equal(target(name).inspect, false);
    assert.ok(journeyDuration(target(name), start(name)) < onward.after);
  }
  for (let time = 0; time <= onward.after; time += 25) {
    const a = sampleJourney(target("aria"), start("aria"), time, false);
    const l = sampleJourney(target("lico"), start("lico"), time, false);
    assert.ok(l.x - a.x >= 9, `the two should not cross at ${time}ms`);
    assert.equal(sampleJourney(target("finn"), start("finn"), time, false).x, start("finn").x);
  }
  for (const a of exit.actors) {
    const next = actor(onward, a.id);
    assert.equal(next.x - a.x, 3.5);
    assert.equal(next.left, false);
  }
  assert.deepEqual(onward.items, exit.items);
  assert.equal(item(exit, "return-cart").actor, "finn");
  assert.equal(item(exit, "lico-travel-bag").actor, "lico");
});
test("the drawstring and the low pickup use the same bag opening without enlarging the body", () => {
  for (const line of [8, 18]) {
    const c = studyCue(id, line, true),
      bag = item(c, "lico-travel-bag");
    near(hand(c, actor(c, "lico")), { x: bag.x, bottom: bag.bottom + bag.width * 1.5 });
  }
  const c = studyCue(id, 18, true),
    lifted = c.sequence.find((s) => s.after === 600);
  const p = at(c, lifted, item(lifted, "lico-travel-bag"));
  assert.ok(p.bottom > item(c, "lico-travel-bag").bottom);
  assert.equal(item(c, "lico-travel-bag").width, item(lifted, "lico-travel-bag").width);
});
test("the gift changes owner at one palm position and stays the same bottle through wrapping and storage", () => {
  const c = studyCue(id, 27, true),
    received = c.sequence.find((s) => s.after === 5200),
    wrapped = c.sequence.find((s) => s.after === 6200),
    stored = c.sequence.find((s) => s.after === 7200);
  near(at(c, c, item(c, "comparison-jar")), at(c, received, item(received, "comparison-jar")));
  assert.equal(item(wrapped, "comparison-jar").art, "packing-cloth");
  assert.equal(item(wrapped, "comparison-jar").width, item(received, "comparison-jar").width);
  assert.equal(item(stored, "comparison-jar").carrier, "aria-gift-bag");
  assert.equal(item(stored, "comparison-jar").stored, true);
});
test("the two low poses reach opposite sides of the roadside stone with room between their bodies", () => {
  const c = studyCue(id, 40, true),
    a = actor(c, "aria"),
    l = actor(c, "lico");
  const ah = hand(c, a),
    lh = hand(c, l);
  const screenX = (x) => 50 + (x - 50) * c.cameraScale;
  assert.ok(screenX(ah.x) >= 84 && screenX(ah.x) <= 89);
  assert.ok(screenX(lh.x) >= 84 && screenX(lh.x) <= 89);
  assert.ok(Math.abs(ah.bottom - lh.bottom) < 0.001);
  assert.ok(l.x - a.x >= 9);
  assert.ok(a.x < l.x && a.left === false && l.left === true);
  assert.ok(actor(c, "finn").x < a.x - 20);
  assert.equal(item(c, "return-cart").actor, "finn");
});
test("on the return road Finn's pulling hand reaches the cart bar, with Aria on a clear lane", () => {
  const c = studyCue(id, 37, true);
  const finn = actor(c, "finn"),
    aria = actor(c, "aria"),
    cart = item(c, "return-cart");
  const positions = new Map(c.actors.map((a) => [a.id, sampleStageActor(a, a, 0, true)]));
  const p = stageItemTarget(cart, c, positions);
  // The bar runs from approximately (416, 295) to (496, 230) on the 512x320 source.
  const bar = {
    x: p.x + cart.width * (455 / 512 - 0.5),
    bottom: p.bottom + (cart.width * 1.5 * (320 - 263)) / 512,
  };
  for (const [x, y] of [
    [43.44, 104.78],
    [44.51, 106.38],
    [41.41, 104.66],
    [44.07, 105.76],
  ]) {
    const hand = {
      x: finn.x + c.cell * (x / 192 - 0.5),
      bottom: finn.bottom + c.cell * 1.5 * (1 - y / 192 - 1 / 48),
    };
    assert.ok(Math.abs(hand.x - bar.x) < 0.5 && Math.abs(hand.bottom - bar.bottom) < 0.5);
  }
  assert.ok(stageItemDepth(cart, c, positions) < Math.round(100 - finn.bottom));
  assert.ok(finn.bottom - aria.bottom >= 20);
});
test("the tower desk and seat remain until the road cut, without carrying the desk into the next place", () => {
  assert.ok(item(studyCue(id, 36, true), "keeper-desk"));
  assert.ok(item(studyCue(id, 36, true), "founding-keeper-chair"));
  assert.equal(item(studyCue(id, 37, true), "keeper-desk"), undefined);
});
test("the jar wrapping is wired to its own prop rather than a generic loose cloth", async () => {
  const css = await readFile("app/storybook/founding-departure.css", "utf8");
  assert.match(css, /data-item="comparison-jar"/);
  assert.match(css, /wrapped-moss-jar-v1/);
});
