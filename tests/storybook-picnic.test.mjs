import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storyStageCue, sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { storyCastImages } from "../lib/storybook/stage-images.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { stories } from "../lib/stories.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";

const cueAt = (phase, line) => studyCue(`hilltop-picnic-${phase}`, line, true);
const target = (cue, state, id) =>
  stageItemTarget(
    state.items.find((i) => i.id === id),
    { ...cue, ...state },
    new Map(state.actors.map((a) => [a.id, sampleStageActor(a, a, 10000)])),
  );
const near = (a, b, tolerance = 0.25) =>
  assert.ok(Math.hypot(a.x - b.x, a.bottom - b.bottom) < tolerance, JSON.stringify({ a, b }));

test("both bread parcels are distinct and the receiving hands meet before stowing", () => {
  for (let line = 0; line < 5; line++) {
    const cue = cueAt("departure", line);
    const bread = cue.items.filter((i) => i.art === "bread");
    assert.equal(bread.length, 2);
    assert.ok(bread.every((i) => i.actor === "leon"));
    assert.ok(Math.abs(target(cue, cue, "bread").bottom - target(cue, cue, "spare").bottom) > 2);
    assert.ok(!cue.items.some((i) => i.art === "cloth"));
  }
  const cue = cueAt("departure", 5),
    [receive, stash, finish] = cue.sequence;
  near(target(cue, cue, "bread"), target(cue, receive, "bread"));
  assert.equal(receive.items.find((i) => i.id === "bread").actor, "aria");
  assert.equal(stash.items.find((i) => i.id === "bread").carrier, "picnic-day-bag");
  assert.equal(
    stash.items.find((i) => i.id === "bread").width,
    receive.items.find((i) => i.id === "bread").width,
  );
  assert.ok(
    stash.items.find((i) => i.id === "picnic-day-bag").width >=
      stash.items.find((i) => i.id === "bread").width,
  );
  assert.ok(!finish.items.some((i) => i.id === "bread"));
  assert.equal(finish.items.find((i) => i.id === "spare").actor, "leon");
  assert.ok(cue.finishBeforeAdvance);
});

test("departure keeps the stowed parcel and remaining load when the final tap starts walking", () => {
  const final = cueAt("departure", 8),
    exit = storybookExitCue("hilltop-picnic-departure");
  assert.deepEqual(exit.items, final.items);
  assert.ok(!exit.items.some((i) => i.art === "cloth"));
  assert.ok(exit.actors.every((a) => a.wristPoints));
  assert.ok(exit.actors.some((a) => a.x !== final.actors.find((b) => b.id === a.id).x));
});

test("all picnic pages keep source cues intact and seated bodies calibrated", () => {
  for (const [phase, count] of [
    ["departure", 9],
    ["return", 17],
  ])
    for (let line = 0; line < count; line++) {
      const id = `hilltop-picnic-${phase}`,
        before = JSON.stringify(storyStageCue(id, line));
      const cue = cueAt(phase, line);
      assert.equal(JSON.stringify(storyStageCue(id, line)), before);
      if (phase !== "return") continue;
      assert.equal(storybookPresentation(id, cue.background, line).art, "picnic-hill-v1");
      for (const state of [cue, ...(cue.sequence ?? [])])
        for (const actor of state.actors) {
          assert.equal(actor.bottom, 24);
          assert.equal(actor.x, actor.id === "aria" ? 43 : 52);
          assert.ok(actor.seated);
          assert.ok(actor.snackAction);
        }
    }
});

test("both bread portions cross between coincident palms and return to the cloth before release", () => {
  const share = cueAt("return", 5),
    receive = share.sequence[0];
  for (const id of ["aria-white", "aria-walnut"]) {
    near(target(share, share, id), target(share, receive, id));
    assert.equal(receive.items.find((i) => i.id === id).actor, "aria");
  }
  const place = cueAt("return", 16),
    release = place.sequence[0];
  for (const id of ["aria-white", "aria-walnut", "leon-white", "leon-walnut"]) {
    near(target(place, place, id), target(place, release, id), 0.001);
    assert.equal(release.items.find((i) => i.id === id).actor, undefined);
  }
});

test("Aria tastes first and Leon reaches for his own portion before biting", () => {
  const cue = cueAt("return", 10),
    steps = cue.sequence;
  assert.equal(steps[0].actors.find((a) => a.id === "aria").snackAction, "bite");
  const reach = steps.find((s) => s.actors.find((a) => a.id === "leon").snackAction === "reach");
  const pick = steps.find((s) => s.items.some((i) => i.id === "leon-white" && i.actor === "leon"));
  near(
    target(cue, reach, "leon-white"),
    target(cue, { ...pick, actors: reach.actors }, "leon-white"),
    0.001,
  );
  const bite = steps.find((s) => s.actors.find((a) => a.id === "leon").snackAction === "bite");
  assert.ok(reach.after < pick.after && pick.after < bite.after);
  assert.ok(cue.finishBeforeAdvance);
});

test("the seated lunch atlases and unwrapped bread are prepared before the first frame", async () => {
  const images = storyCastImages(stories.find((s) => s.id === "hilltop-picnic-return"));
  for (const name of [
    "aria-lunch-v1",
    "leon-lunch-v1",
    "lunch-bread-v1",
    "bread-roll-v1",
    "common-bread-half-v1",
  ])
    assert.ok(images.includes(`/storybook-study/${name}.webp`), name);
  await Promise.all(images.map((image) => access(`public${image}`)));
});
