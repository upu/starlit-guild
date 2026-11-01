import test from "node:test";
import assert from "node:assert/strict";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
import { extraTravelDuration, sampleExtraTravel } from "../lib/story-stage-extra-travel.ts";
import { readFrame } from "../scripts/home-pixel-frames.mjs";
import { sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { journeyDuration, sampleJourney } from "../lib/story-stage-travel.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import sharp from "sharp";

test("Leon keeps the route map while explaining the outlet and folds it away", () => {
  for (const line of [0, 1, 2]) {
    const leon = studyCue("old-waterway-return", line, true).actors.find(
      (actor) => actor.id === "leon",
    );
    assert.equal(leon.routeNotes, "read");
    assert.equal(actorPose(leon, false, 0, false).frame, 17);
  }
  const next = studyCue("old-waterway-return", 3, true);
  const notes = (actors) => actors.find((actor) => actor.id === "leon").routeNotes;
  assert.equal(next.finishBeforeAdvance, true);
  assert.equal(notes(next.actors), "read");
  assert.deepEqual(
    next.sequence.map((moment) => notes(moment.actors)),
    ["fold", "pocket", undefined, undefined, undefined, undefined, undefined, undefined],
  );
  assert.deepEqual(
    next.sequence.map((moment) => moment.after),
    [450, 900, 1400, 1650, 2300, 2950, 3200, 4050],
  );
  const keeper = (extras) => extras.find((extra) => extra.id === "keeper");
  assert.equal(keeper(next.extras).x, -1);
  assert.equal(keeper(next.sequence[6].extras).x, -1);
  assert.equal(next.sequence[6].actors.find((actor) => actor.id === "leon").pose, "offer");
  assert.equal(keeper(next.sequence[7].extras).x, 53);
  const camera = stageCameraCue(next);
  const start = keeper(camera.extras);
  const target = keeper(camera.sequence[7].extras);
  assert.ok(start.x < -20, "keeper begins beyond the widened camera frame");
  const duration = extraTravelDuration(target, start);
  assert.ok(sampleExtraTravel(target, start, duration / 2, false).moving);
  assert.equal(sampleExtraTravel(target, start, duration, false).x, target.x);
  assert.equal(sampleExtraTravel(target, start, duration, false).moving, false);
  assert.equal(sampleExtraTravel(target, start, 0, true).x, target.x);
  assert.equal(
    studyCue("old-waterway-return", 7, true).actors.find((actor) => actor.id === "leon")
      .lanternHold,
    true,
  );
});

test("the marker moves from Leon's lowered hand to dry ground and remains through the scene", () => {
  const cue = studyCue("old-waterway-return", 3, true);
  assert.ok(!cue.items.some((item) => item.id === "waterway-marker"));
  const reaching = cue.sequence[3];
  const placing = cue.sequence[4];
  const leon = reaching.actors.find((actor) => actor.id === "leon");
  const hand = sampleStageActor(leon, leon, 0, false);
  const held = reaching.items.find((item) => item.id === "waterway-marker");
  const ground = placing.items.find((item) => item.id === "waterway-marker");
  const heldAt = stageItemTarget(held, { ...cue, ...reaching }, new Map([["leon", hand]]));
  assert.equal(hand.frame, 13);
  assert.ok(Math.abs(heldAt.x - ground.x) < 0.1);
  assert.ok(heldAt.bottom > ground.bottom);
  assert.equal(ground.actor, undefined);
  for (const line of [4, 7, 12, 18]) {
    const item = studyCue("old-waterway-return", line, true).items.find((i) => i.id === ground.id);
    assert.equal(item.x, ground.x);
    assert.equal(item.bottom, ground.bottom);
  }
});

test("the returning keeper walks at his standing height with a consistent ground line", async () => {
  const cell = (frame) => ({ left: frame * 128, top: 0, width: 128, height: 128 });
  const standing = await readFrame("public/storybook-study/keeper-poses-v1.webp", cell(0));
  for (let frame = 0; frame < 4; frame++) {
    const walk = await readFrame("public/storybook-study/keeper-yard-walk-v1.webp", cell(frame));
    assert.ok(Math.abs(walk.box.height - standing.box.height) <= 1);
    assert.equal(walk.box.top + walk.box.height, 120);
    assert.ok(walk.box.left > 0 && walk.box.left + walk.box.width < 128);
  }
});

test("the final notes begin with the lantern and end with both hands free to write", async () => {
  const cue = studyCue("old-waterway-return", 18, true);
  const leon = (actors) => actors.find((a) => a.id === "leon");
  assert.equal(cue.finishBeforeAdvance, true);
  assert.equal(leon(cue.actors).lanternHold, true);
  assert.ok(!cue.items.some((i) => i.art === "map"));
  const last = cue.sequence.at(-1);
  assert.equal(leon(last.actors).lanternHold, false);
  assert.equal(leon(last.actors).routeNotes, "write");
  assert.equal(last.actors.find((a) => a.id === "aria").inspect, true);
  const lamp = last.items.find((i) => i.art === "lantern");
  assert.equal(lamp.actor, undefined);
  assert.ok(!last.items.some((i) => i.art === "map"));
  assert.equal(actorPose(leon(last.actors), false, 0, false).frame, 17);
  assert.equal(actorPose(leon(last.actors), false, 450, false).frame, 18);
  const source = "public/storybook-study/leon-kneel-notes-v1.webp";
  const upright = await readFrame(source, { left: 0, top: 0, width: 192, height: 192 });
  for (const frame of [2, 3]) {
    const kneel = await readFrame(source, { left: frame * 192, top: 0, width: 192, height: 192 });
    assert.equal(kneel.box.top + kneel.box.height, 176);
    assert.ok(kneel.box.height < upright.box.height * 0.9);
  }
});

test("Aria walks around Leon before returning to the map, with both at rest before writing", () => {
  const previous = studyCue("old-waterway-return", 17, true);
  const cue = studyCue("old-waterway-return", 18, true);
  const origin = (id) => previous.actors.find((actor) => actor.id === id);
  const target = (id) => cue.actors.find((actor) => actor.id === id);
  const arrival = Math.max(...cue.actors.map((actor) => journeyDuration(actor, origin(actor.id))));
  assert.ok(arrival < cue.sequence[0].after, "placing the lamp starts after both arrive");
  for (let time = 0; time <= arrival; time += 25) {
    const aria = sampleJourney(target("aria"), origin("aria"), time, false);
    const leon = sampleJourney(target("leon"), origin("leon"), time, false);
    const gap = Math.hypot(aria.x - leon.x, ((aria.bottom - leon.bottom) * 2) / 3);
    assert.ok(gap > 11, `separate ground paths at ${time}ms: ${gap}`);
  }
});

test("drain inspection approaches the opening with a single supported lantern", () => {
  const before = studyCue("old-waterway-return", 6, true);
  const inspect = studyCue("old-waterway-return", 7, true);
  const notes = studyCue("old-waterway-return", 18, true);
  const aria = (cue) => cue.actors.find((actor) => actor.id === "aria");
  assert.ok(aria(inspect).bottom > (aria(before).bottom ?? 14));
  assert.ok(aria(inspect).x > aria(before).x);
  assert.ok(aria(notes).x < aria(inspect).x);
  assert.equal(inspect.actors.find((actor) => actor.id === "leon").lanternHold, true);
  assert.ok(!inspect.items.some((item) => item.art === "lantern"));
  assert.equal(
    studyCue("old-waterway-return", 7, false).actors.some((actor) => actor.lanternHold),
    false,
  );
});

test("blocked and cleared views remain distinct and tools stay by the removed logs", () => {
  assert.notEqual(
    storybookPresentation("", "drain-blocked").art,
    storybookPresentation("", "drain-cleared").art,
  );
  const cue = studyCue("tower-restoration-return", 0, true);
  const tools = cue.items.find((item) => item.art === "tools");
  assert.ok(tools.bottom > 65 && tools.x < 35 && tools.width <= 8);
});

test("the repair discussion cuts to the blocked outlet and sets the basket onto dry ground", () => {
  const before = studyCue("tower-restoration-departure", 8, true);
  assert.equal(before.background, "tower-foot");
  assert.equal(before.items.find((item) => item.art === "basket").actor, "leon");
  const cue = studyCue("tower-restoration-departure", 9, true);
  assert.equal(cue.background, "drain-blocked");
  assert.equal(cue.cut, true);
  assert.equal(cue.finishBeforeAdvance, true);
  const lowering = { ...cue, ...cue.sequence[0] };
  const leon = lowering.actors.find((actor) => actor.id === "leon");
  const hand = sampleStageActor(leon, leon, 0, false);
  const held = lowering.items.find((item) => item.art === "basket");
  const ground = cue.sequence[1].items.find((item) => item.art === "basket");
  const at = stageItemTarget(held, lowering, new Map([["leon", hand]]));
  assert.equal(hand.frame, 13);
  assert.ok(Math.abs(at.x - ground.x) < 0.02);
  assert.ok(at.bottom > ground.bottom);
  assert.equal(ground.actor, undefined);
  assert.equal(cue.sequence.at(-1).actors.find((actor) => actor.id === "leon").inspect, false);
  const aria = cue.actors.find((actor) => actor.id === "aria");
  assert.ok(journeyDuration(aria, { x: cue.initial.aria, bottom: cue.initialBottom.aria }) < 600);
});

test("the placement strip preserves every visible source pixel and the same feet", async () => {
  const sources = ["leon-carry-v1", "leon-forage-v1", "leon-forage-v1", "leon-conversation-v1"];
  for (const [frame, name] of sources.entries()) {
    const rect = { left: frame * 192, top: 0, width: 192, height: 192 };
    const actual = await sharp("public/storybook-study/leon-basket-place-v1.webp")
      .extract(rect)
      .ensureAlpha()
      .raw()
      .toBuffer();
    const expected = await sharp(`public/storybook-study/${name}.webp`)
      .extract({ ...rect, left: 192 })
      .ensureAlpha()
      .raw()
      .toBuffer();
    for (let pixel = 0; pixel < actual.length; pixel += 4) {
      assert.equal(actual[pixel + 3], expected[pixel + 3]);
      if (actual[pixel + 3])
        assert.ok(
          actual.subarray(pixel, pixel + 3).equals(expected.subarray(pixel, pixel + 3)),
          `${name}: visible pixel ${pixel / 4}`,
        );
    }
    const image = await readFrame("public/storybook-study/leon-basket-place-v1.webp", rect);
    assert.equal(image.box.top + image.box.height, 176);
  }
});

test("Leon opens the map at the narrated line and puts it away before leaving the basket", () => {
  const opening = studyCue("tower-restoration-departure", 11, true);
  const notes = (actors) => actors.find((actor) => actor.id === "leon").routeNotes;
  assert.equal(notes(opening.actors), "pocket");
  assert.deepEqual(
    opening.sequence.map((beat) => notes(beat.actors)),
    ["fold", "read"],
  );
  for (const line of [12, 13])
    assert.equal(notes(studyCue("tower-restoration-departure", line, true).actors), "read");
  const closing = studyCue("tower-restoration-departure", 14, true);
  assert.deepEqual(
    closing.sequence.map((beat) => notes(beat.actors)),
    ["fold", "pocket", undefined],
  );
  const ground = opening.items.find((item) => item.art === "basket");
  for (let line = 10; line <= 15; line++) {
    const cue = studyCue("tower-restoration-departure", line, true);
    assert.equal(cue.background, "drain-blocked");
    assert.ok(!cue.cut);
    assert.deepEqual(
      cue.items.find((item) => item.art === "basket"),
      ground,
    );
  }
  assert.equal(notes(studyCue("tower-restoration-departure", 15, true).actors), undefined);
});

test("the repair departure keeps its location and walks clear of the basket and wet bank", () => {
  const final = studyCue("tower-restoration-departure", 15, true);
  const exit = storybookExitCue("tower-restoration-departure");
  assert.equal(exit.background, final.background);
  assert.deepEqual(exit.items, final.items);
  assert.ok(!exit.cut);
  const groundItems = exit.items.filter((item) => !item.actor && !item.extra && !item.carrier);
  for (const actor of exit.actors) {
    assert.ok(actor.x < 0);
    assert.equal(actor.carry, false);
    assert.equal(actor.routeNotes, undefined);
    const origin = final.actors.find((before) => before.id === actor.id);
    for (let time = 0; time <= journeyDuration(actor, origin); time += 25) {
      const at = sampleJourney(actor, origin, time, false);
      for (const item of groundItems) {
        const distance = Math.hypot(at.x - item.x, ((at.bottom - item.bottom) * 2) / 3);
        assert.ok(distance > item.width / 2 + 2, `${actor.id} avoids ${item.id} at ${time}ms`);
      }
      assert.ok(at.bottom <= 24, "stay on the dry foreground");
    }
  }
});
