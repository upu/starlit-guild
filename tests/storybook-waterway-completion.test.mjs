import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { stageBackground } from "../lib/storybook/stage-images.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { extraTravelDuration, sampleExtraTravel } from "../lib/story-stage-extra-travel.ts";
import { sampleJourney, journeyDuration } from "../lib/story-stage-travel.ts";
import { storyArtAt } from "../lib/story-art.ts";
import { readFrame } from "../scripts/home-pixel-frames.mjs";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
import { storyCastImages } from "../lib/storybook/stage-images.ts";
import { stories } from "../lib/stories.ts";

const id = "tower-moss-removal-return";
const item = (cue, id) => cue.items.find((i) => i.id === id);
const keeper = (cue) => cue.extras.find((e) => e.id === "keeper");
function target(cue, id) {
  const positions = new Map(cue.actors.map((a) => [a.id, sampleStageActor(a, a, 0, false)]));
  for (const e of cue.extras ?? [])
    positions.set(`extra:${e.id}`, { ...e, wrist: stageExtraWrist(e, false, 0) });
  return stageItemTarget(item(cue, id), cue, positions);
}

test("the cleared recess is inspected, lamp is grounded, and the same stone closes without hand/floor jumps", () => {
  const cue = studyCue(id, 0, true),
    beats = cue.sequence.map((b) => ({ ...cue, ...b }));
  assert.equal(cue.cut, true);
  assert.equal(cue.finishBeforeAdvance, true);
  assert.equal(stageBackground(id, 0, cue), "/storybook-study/drain-inspection-empty-dusk-v1.png");
  for (const [before, after, id] of [
    [3300, 3750, "inspection-lamp"],
    [5250, 5700, "inspection-lid"],
    [8900, 9400, "inspection-lid"],
  ]) {
    const a = target(
        beats.find((b) => b.after === before),
        id,
      ),
      b = target(
        beats.find((b) => b.after === after),
        id,
      );
    assert.ok(
      Math.abs(a.x - b.x) < 0.001 && Math.abs(a.bottom - b.bottom) < 0.001,
      `${id}: retain contact when ownership changes`,
    );
  }
  for (const beat of [cue, ...beats]) {
    assert.equal(item(beat, "inspection-lid").width, 8.7);
    assert.equal(item(beat, "inspection-lamp").width, 2.1);
    assert.ok(
      !beat.items.some((i) => i.art === "inspection-glow"),
      "no old glow remains in the cleared recess",
    );
  }
  assert.equal(
    item(beats.at(-1), "inspection-lid").x,
    item(studyCue("tower-moss-removal-departure", 0, true), "inspection-lid").x,
  );
  assert.equal(item(beats.at(-1), "inspection-lamp").extra, undefined);
  assert.ok(beats.find((b) => b.after === 7150).extras.find((e) => e.id === "keeper").carry);
});

test("the last basket stays in the worker palms and the backward heavy gait is explicitly reversed", () => {
  const cue = studyCue(id, 0, true),
    departing = cue.sequence[0].extras.find((e) => e.id === "worker");
  assert.equal(item(cue, "last-basket").extra, "worker");
  assert.equal(item(cue, "last-moss").carrier, "last-basket");
  assert.deepEqual(
    [0, 180, 360, 540].map((t) => stageExtraFrame(departing, true, t)),
    [32, 33, 34, 35],
  );
  const carrying = keeper(cue.sequence.find((b) => b.after === 7150));
  assert.deepEqual(
    [0, 180, 360, 540].map((t) => stageExtraFrame(carrying, true, t)),
    [35, 34, 33, 32],
  );
  for (let t = 0; t < 3400; t += 25) {
    const at = sampleExtraTravel(
      departing,
      cue.extras.find((e) => e.id === "worker"),
      t,
      false,
    );
    const w = stageExtraWrist(departing, true, t);
    const p = stageItemTarget(
      item(cue, "last-basket"),
      cue,
      new Map([["extra:worker", { ...at, wrist: w }]]),
    );
    assert.ok(Math.abs(p.x - (at.x + ((w.x - 64) * 24) / 128)) < 0.001);
    assert.ok(
      p.bottom > at.bottom && p.bottom < at.bottom + 8,
      "carry below the face and above the boots",
    );
  }
});

test("all keeper moves settle before the next task and the group clears the rear frame before the front cut", () => {
  const cue = studyCue(id, 0, true),
    states = [{ ...cue, after: 0 }, ...cue.sequence];
  for (let index = 1; index < states.length; index++) {
    const from = keeper(states[index - 1]),
      to = keeper(states[index]);
    if (from.x === to.x && from.bottom === to.bottom) continue;
    const next = states[index + 1]?.after ?? states[index].after + 6500;
    assert.ok(
      extraTravelDuration(to, from) < next - states[index].after,
      `finish move at ${states[index].after}`,
    );
  }
  const group = states.at(-1),
    origin = states.at(-2);
  for (let t = 0; t <= 6000; t += 50) {
    const people = group.actors.map((a) => ({
      ...a,
      ...sampleJourney(
        a,
        origin.actors.find((b) => b.id === a.id),
        t,
        false,
      ),
    }));
    const npc = sampleExtraTravel(keeper(group), keeper(origin), t, false);
    assert.ok(npc.bottom === 14);
    assert.ok(Math.abs(people[0].x - people[1].x) > 12);
    assert.ok(Math.min(...people.map((a) => Math.abs(a.x - npc.x))) > 12);
  }
  assert.ok(group.actors.every((a) => a.x < -25) && keeper(group).x <= -25);
  const front = studyCue(id, 1, true);
  assert.equal(front.cut, true);
  assert.equal(stageBackground(id, 1, front), "/storybook-study/tower-front-dusk-v1.png");
  assert.ok(!front.items.some((i) => i.id === "inspection-lid" || i.id === "last-basket"));
});

test("Aria puts down the wooden tool before the pair approach and lower onto their low seats", () => {
  const cue = studyCue(id, 2, true),
    states = cue.sequence.map((b) => ({ ...cue, ...b }));
  assert.equal(cue.finishBeforeAdvance, true);
  const low = states.find((b) => b.after === 350),
    released = states.find((b) => b.after === 800);
  assert.deepEqual(target(low, "spatula"), target(released, "spatula"));
  assert.equal(item(released, "spatula").actor, undefined);
  const moving = states.find((b) => b.after === 1450),
    lower = states.find((b) => b.after === 2200),
    before = states.find((b) => b.after === 1250);
  for (const a of moving.actors)
    assert.ok(
      journeyDuration(
        a,
        before.actors.find((b) => b.id === a.id),
      ) <
        lower.after - moving.after,
    );
  assert.ok(lower.actors.every((a) => !a.seated && a.seatTransition === "lower"));
  const settled = states.at(-1);
  assert.ok(settled.actors.every((a) => a.seated && a.perch && !a.carry));
  assert.ok(settled.actors[0].nameOffset < 0 && settled.actors[1].nameOffset > 0);
  for (const line of [3, 4, 5])
    assert.deepEqual(item(studyCue(id, line, true), "spatula"), item(settled, "spatula"));
  assert.equal(storyArtAt(id, 5), undefined);
  assert.equal(storyArtAt(id, 6).src, "/stories/tower-light-restored.webp");
  assert.equal(
    storyArtAt(id, 44).src,
    storyArtAt(id, 6).src,
    "epilogue remains the same static illustration",
  );
});

test("the keeper enters through the open doorway before disappearing, then returns through it before pointing", () => {
  const sitting = stageCameraCue(studyCue(id, 2, true));
  const enters = sitting.sequence.find((beat) => beat.scenery === "tower-door-open");
  const hidden = sitting.sequence.find((beat) => !beat.extras.length);
  assert.equal(keeper(enters).x, 108, "door remains inside the pulled-back camera");
  assert.ok(extraTravelDuration(keeper(enters), keeper(sitting)) < hidden.after - enters.after);
  const arrived = sampleExtraTravel(
    keeper(enters),
    keeper(sitting),
    hidden.after - enters.after,
    false,
  );
  assert.ok(arrived.x > 100 && arrived.bottom > 55, "reach the doorway before hiding");
  assert.equal(hidden.scenery, undefined, "close the entrance only after entering");
  const returning = stageCameraCue(studyCue(id, 5, true));
  assert.equal(returning.extras.length, 0);
  const open = returning.sequence[0],
    appears = returning.sequence[1],
    walks = returning.sequence[2];
  assert.ok(open.after < appears.after && appears.after < walks.after);
  assert.equal(open.scenery, "tower-door-open");
  assert.ok(
    extraTravelDuration(keeper(walks), keeper(appears)) < returning.sequence[3].after - walks.after,
  );
  assert.equal(keeper(returning.sequence.at(-1)).towerSignal, "point");
  assert.equal(stageExtraFrame(keeper(returning.sequence.at(-1))), 41);
  assert.ok(returning.finishBeforeAdvance);
  assert.ok(
    storyCastImages(stories.find((s) => s.id === id)).includes(
      "/storybook-study/tower-front-open-dusk-v1.png",
    ),
  );
});

test("reused work and perch strips retain common scale, complete hair/boots and lower crouches", async () => {
  for (const [name, baseline, standing] of [
    ["keeper-lantern-registered-v2", 120, 93],
    ["keeper-tower-signal-v1", 120, 93],
    ["worker-repair-basket-v2", 120, 93],
    ["aria-rest-perch-v2", 176, 148],
    ["leon-rest-perch-v2", 176, 148],
  ]) {
    const metrics = JSON.parse(await readFile(`public/storybook-study/${name}-metrics.json`));
    assert.ok(metrics.every((m) => m.scale === metrics[0].scale));
    const cell = baseline === 120 ? 128 : 192;
    for (const m of metrics) {
      const p = await readFrame(`public/storybook-study/${name}.webp`, {
        left: (m.frame % 4) * cell,
        top: Math.floor(m.frame / 4) * cell,
        width: cell,
        height: cell,
      });
      assert.equal(p.box.top + p.box.height, baseline);
      assert.ok(p.box.left >= 2 && p.box.left + p.box.width <= cell - 2);
    }
    assert.ok(metrics.some((m) => m.height === standing));
    if (name.includes("lantern")) assert.equal(metrics[0].height, 64);
    if (name.includes("tower-signal")) {
      const reference = await readFrame("public/storybook-study/keeper-poses-v1.webp", {
        left: 0,
        top: 0,
        width: 128,
        height: 128,
      });
      assert.ok(Math.abs(metrics[0].upperSilhouetteWidth - reference.head.width) <= 4);
      assert.ok(metrics[1].height <= 110, "raised hand does not enlarge the whole man");
    }
    if (name.includes("perch")) assert.ok(metrics[2].height < standing - 12);
  }
  for (const name of [
    "drain-inspection-empty-dusk-v1",
    "tower-front-dusk-v1",
    "tower-front-open-dusk-v1",
  ]) {
    assert.deepEqual(
      await sharp(`assets/source/storybook/${name}.png`).raw().toBuffer(),
      await sharp(`public/storybook-study/${name}.png`).raw().toBuffer(),
    );
  }
});
