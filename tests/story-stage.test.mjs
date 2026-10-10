import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { stories } from "../lib/stories.ts";
import {
  meetingStoryId,
  storyStageCue,
  storyStageExitCue,
  stageEntrance,
  sampleStageActor,
  stageTravel,
  stageLuggage,
  compactStoryDialogue,
} from "../lib/story-stage.ts";
import { eveningDepartureId, eveningReturnId } from "../lib/story-stage-evening.ts";
import { townDepartureId, townReturnId } from "../lib/story-stage-town.ts";
import { deliveryBoxTarget, transferBox, boxTransferDuration } from "../lib/story-stage-props.ts";

test("the first three stages have staging for every line except the static handover", () => {
  const meeting = stories.find((story) => story.id === meetingStoryId);
  for (const story of stories) {
    story.lines.forEach((_, line) => {
      assert.equal(
        !!storyStageCue(story.id, line),
        [
          meetingStoryId,
          eveningDepartureId,
          eveningReturnId,
          townDepartureId,
          townReturnId,
        ].includes(story.id),
      );
    });
  }
  assert.equal(storyStageCue(meetingStoryId, -1), null);
  assert.equal(storyStageCue(meetingStoryId, meeting.lines.length), null);
  assert.match(meeting.lines[4].text, /ずいぶん多くない/);
  assert.equal(meeting.lines[4].expression, "surprised");
  assert.equal(storyStageCue(meetingStoryId, 4).actors[0].reaction, "surprise");
  assert.match(meeting.lines[8].text, /私が持つ/);
  assert.ok(
    storyStageCue(meetingStoryId, 8).actors[0].x > storyStageCue(meetingStoryId, 6).actors[0].x,
  );
  assert.match(meeting.lines.at(-1).text, /行こう/);
  assert.deepEqual(
    storyStageCue(meetingStoryId, 12).actors.map((actor) => actor.x),
    [32, 81],
  );
  assert.equal(storyStageCue(meetingStoryId, 12).cartX, undefined);
  assert.equal(storyStageExitCue("other-story"), null);
});

test("compact dialogue includes the static handover and only the first three stages", () => {
  for (const story of stories) {
    assert.equal(
      compactStoryDialogue(story.id),
      [
        meetingStoryId,
        "village-trade-return",
        eveningDepartureId,
        eveningReturnId,
        townDepartureId,
        townReturnId,
      ].includes(story.id),
    );
  }
  assert.equal(storyStageCue("village-trade-return", 0), null);
});

test("evening scenes start together with return purchases and hold the last line before exit", () => {
  for (const id of [eveningDepartureId, eveningReturnId]) {
    const story = stories.find((s) => s.id === id);
    story.lines.forEach((_, line) => {
      const cue = storyStageCue(id, line);
      assert.equal(cue.cartArt, "return-cart");
      assert.equal(cue.background, id === eveningDepartureId ? "town-exit" : "meeting-dusk");
      assert.equal(stageEntrance("aria", cue).x, 28);
      assert.equal(stageEntrance("leon", cue).x, 56);
      assert.equal(cue.cartX, undefined);
    });
    assert.equal(storyStageCue(id, story.lines.length), null);
    const exit = storyStageExitCue(id);
    assert.equal(exit.bundleMode, "carried");
    assert.equal(exit.actors[1].pull, true);
    assert.equal(exit.actors[1].x - exit.cartX, 17);
    assert.equal(exit.actors[0].x < 0, id === eveningReturnId);
  }
});

test("a rapid next line continues from the displayed position and settles without a queued walk", () => {
  const arrival = storyStageCue(meetingStoryId, 1).actors[0];
  const mid = sampleStageActor(arrival, stageEntrance("aria"), 200);
  assert.ok(mid.x > -10 && mid.x < arrival.x);
  assert.ok(mid.frame < 8);
  const next = storyStageCue(meetingStoryId, 8).actors[0];
  assert.equal(sampleStageActor(next, mid, 0).x, mid.x);
  const end = sampleStageActor(next, mid, 3000);
  assert.equal(end.x, next.x);
  assert.equal(end.atlas, "conversation");
  assert.equal(end.frame, 4);
  assert.deepEqual(sampleStageActor(next, mid, 6000), end);
});

test("surprise is a short single reaction; reduced motion gives the final pose and a static cue", () => {
  const actor = storyStageCue(meetingStoryId, 4).actors[0];
  const origin = { x: 28 };
  assert.ok(sampleStageActor(actor, origin, 260).lift < 0);
  assert.equal(sampleStageActor(actor, origin, 260).bubble, "！");
  assert.equal(sampleStageActor(actor, origin, 3000).bubble, "");
  assert.equal(sampleStageActor(actor, origin, 3000).lift, 0);
  for (const elapsed of [0, 260, 3000]) {
    const still = sampleStageActor(actor, { x: 12 }, elapsed, true);
    assert.equal(still.x, actor.x);
    assert.equal(still.lift, 0);
    assert.equal(still.frame, 2);
    assert.equal(still.bubble, "！");
  }
});

test("Aria carries luggage while arriving, even after rapid advance, and holds the greeting", () => {
  const first = storyStageCue(meetingStoryId, 0);
  assert.equal(
    stageLuggage(first, sampleStageActor(first.actors[0], stageEntrance("aria"), 0)),
    "hidden",
  );
  const arrival = storyStageCue(meetingStoryId, 1);
  const mid = sampleStageActor(arrival.actors[0], stageEntrance("aria"), 500);
  assert.equal(stageLuggage(arrival, mid), "carried");
  const greeting = storyStageCue(meetingStoryId, 2);
  assert.equal(stageLuggage(greeting, sampleStageActor(greeting.actors[0], mid, 0)), "carried");
  for (const time of [2000, 5000, 20000]) {
    const sample = sampleStageActor(greeting.actors[0], mid, time);
    assert.equal(sample.atlas, "conversation");
    assert.equal(sample.frame, 1);
    assert.equal(stageLuggage(greeting, sample), "ground");
  }
  const exit = storyStageExitCue(meetingStoryId);
  assert.equal(stageLuggage(exit, sampleStageActor(exit.actors[0], { x: 32 }, 1000)), "carried");
});

test("dialogue poses match walking stature and head size without opaque background or bleed", async () => {
  for (const id of ["aria", "leon"]) {
    const walk = await sharp(`public/home-pixel/${id}.webp`).png().toBuffer();
    const poses = await sharp(`public/story-stage/${id}-poses.webp`).png().toBuffer();
    const base = await readFrame(walk, { left: 0, top: 0, width: 128, height: 128 });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    for (let frame = 0; frame < 6; frame++) {
      const pose = await readFrame(poses, {
        left: (frame % 4) * 128,
        top: Math.floor(frame / 4) * 128,
        width: 128,
        height: 128,
      });
      assert.ok(Math.abs(pose.box.height - base.box.height) <= 2, `${id}/${frame}: stature`);
      const poseHead = await headBounds(
        await sharp(pose.cell).extract(pose.box).png().toBuffer(),
        0.25,
      );
      assert.ok(Math.abs(poseHead.width / head.width - 1) < 0.08, `${id}/${frame}: head size`);
      assert.ok(
        Math.abs(pose.box.left + poseHead.left + poseHead.width / 2 - 64) <= 1,
        `${id}/${frame}: head registration`,
      );
      assert.ok(pose.box.top >= 22 && pose.box.top + pose.box.height <= 122);
      const { data, info } = await sharp(pose.cell).raw().toBuffer({ resolveWithObject: true });
      assert.equal(info.channels, 4);
      assert.equal(data[3], 0);
    }
  }
});

test("Leon is already inspecting the cart before Aria arrives, and takes it along at departure", () => {
  const opening = storyStageCue(meetingStoryId, 0);
  const aria = sampleStageActor(opening.actors[0], stageEntrance("aria"), 1000);
  const leon = sampleStageActor(opening.actors[1], stageEntrance("leon"), 1000);
  assert.equal(aria.visible, false);
  assert.equal(leon.x, stageEntrance("leon").x);
  assert.equal(leon.atlas, "conversation");
  assert.ok([6, 7].includes(leon.frame));
  const arriving = storyStageCue(meetingStoryId, 1);
  assert.equal(sampleStageActor(arriving.actors[0], stageEntrance("aria"), 500).visible, true);
  const last = storyStageExitCue(meetingStoryId);
  const pulling = sampleStageActor(last.actors[1], { x: 81 }, 150);
  assert.equal(pulling.atlas, "adventure");
  assert.ok([20, 21].includes(pulling.frame));
  assert.ok(stageTravel(64, last.cartX, 150).x > 64);
  assert.equal(stageTravel(64, last.cartX, 0, true).x, last.cartX);
  const pullingAt = sampleStageActor(last.actors[1], { x: 81 }, 1000);
  assert.ok(Math.abs(pullingAt.x - stageTravel(64, last.cartX, 1000).x - 17) < 0.001);
});

test("stage props retain transparent margins and use the common scene aspect ratio", async () => {
  for (const name of [
    "meeting-path",
    "town-exit",
    "meeting-dusk",
    "town-shop",
    "town-shop-return",
  ]) {
    const background = await sharp(`public/story-stage/${name}.webp`).metadata();
    assert.equal(background.width / background.height, 1.5);
  }
  for (const name of [
    "loaded-cart",
    "return-cart",
    "travel-bundle",
    "delivery-box",
    "packing-table",
  ]) {
    const { data, info } = await sharp(`public/story-stage/${name}.webp`)
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(info.channels, 4);
    assert.equal(data[3], 0, `${name} background remains transparent`);
    const alphas = data.filter((_, i) => i % 4 === 3);
    assert.ok(
      alphas.some((alpha) => alpha > 240),
      `${name} includes opaque artwork`,
    );
  }
});

test("crouching retains walking head size and ground contact while reducing body height", async () => {
  for (const id of ["aria", "leon"]) {
    const home = await sharp(`public/home-pixel/${id}.webp`).png().toBuffer();
    const base = await readFrame(home, { left: 0, top: 0, width: 128, height: 128 });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    const sheet = await sharp(`public/story-stage/${id}-poses.webp`).png().toBuffer();
    for (const index of [6, 7, 8, 9]) {
      const pose = await readFrame(sheet, {
        left: (index % 4) * 128,
        top: Math.floor(index / 4) * 128,
        width: 128,
        height: 128,
      });
      const poseHead = await headBounds(
        await sharp(pose.cell).extract(pose.box).png().toBuffer(),
        0.25,
      );
      assert.ok(Math.abs(poseHead.width - head.width) <= 2, `${id}/${index}: head scale`);
      assert.equal(pose.box.top + pose.box.height, 120, `${id}/${index}: feet on ground`);
      if (index < 8)
        assert.ok(
          pose.box.height < base.box.height * 0.82,
          `${id}/${index}: crouching is lower than standing`,
        );
      else
        assert.ok(
          Math.abs(pose.box.height - base.box.height) < 10,
          `${id}/${index}: carry stature`,
        );
    }
  }
});

test("delivery scenes put the box down and carry it together without flipping the second carrier", () => {
  assert.equal(storyStageCue(townDepartureId, 5).box, "high");
  assert.equal(storyStageCue(townDepartureId, 7).box, "table");
  assert.equal(storyStageCue(townDepartureId, 10).actors[0].inspect, true);
  const last = storyStageCue(townDepartureId, 14);
  assert.ok(last.actors.every((a) => a.carry));
  assert.equal(last.box, "shared");
  const exit = storyStageExitCue(townDepartureId);
  assert.equal(storyStageExitCue(townDepartureId), exit, "rerenders must not restart departure");
  assert.equal(storyStageExitCue(townReturnId), storyStageExitCue(townReturnId));
  const samples = exit.actors.map((actor, i) =>
    sampleStageActor(actor, { x: last.actors[i].x }, 500),
  );
  assert.equal(samples[1].x - samples[0].x, 20);
  assert.equal(samples[1].left, true);
  assert.ok(samples.every((s) => s.atlas === "conversation" && [8, 9].includes(s.frame)));
  for (const line of stories.find((s) => s.id === townReturnId).lines.keys()) {
    assert.equal(storyStageCue(townReturnId, line).background, "town-shop-return");
    assert.equal(storyStageCue(townReturnId, line).box, undefined);
    assert.equal(storyStageCue(townReturnId, line).hideCart, true);
  }
});

test("the shopkeeper listens, points out the remaining goods, speaks and sees both visitors off", () => {
  for (const id of [townDepartureId, townReturnId]) {
    for (const i of stories.find((s) => s.id === id).lines.keys())
      assert.ok(storyStageCue(id, i).merchant);
    assert.equal(storyStageExitCue(id).merchant.pose, "wave");
  }
  assert.deepEqual(storyStageCue(townDepartureId, 4).merchant, { pose: "point", speaking: true });
  assert.deepEqual(storyStageCue(townReturnId, 10).merchant, { pose: "explain", speaking: true });
  assert.equal(storyStageCue(townDepartureId, 2).merchant.speaking, false);
  assert.equal(storyStageCue(townReturnId, 2).merchant.speaking, false);
  assert.deepEqual(storyStageCue(townReturnId, 18).merchant, { pose: "wave", speaking: true });
});

test("putting the box down is a short continuous hand-to-table transfer, including interruption", () => {
  const cue = storyStageCue(townDepartureId, 7),
    aria = cue.actors[0];
  const from = deliveryBoxTarget("high", aria.x, 64);
  const to = deliveryBoxTarget("table", aria.x, 64);
  assert.ok(Math.hypot(to.x - from.x, to.bottom - from.bottom) < 6);
  assert.deepEqual(transferBox(from, to, 0), from);
  const mid = transferBox(from, to, boxTransferDuration / 2);
  assert.ok(mid.x > from.x && mid.x < to.x);
  assert.deepEqual(transferBox(mid, to, 0), mid, "rapid advance preserves the displayed box");
  assert.deepEqual(transferBox(from, to, boxTransferDuration), to);
  assert.deepEqual(transferBox(from, to, 0, true), to);
  assert.equal(sampleStageActor(aria, { x: aria.x }, 200).frame, 8);
  assert.equal(sampleStageActor(aria, { x: aria.x }, 1000).frame, 4);
  assert.equal(sampleStageActor(aria, { x: aria.x }, 0, true).frame, 4);
});

test("the merchant uses the same standing stature and cell registration as the heroes", async () => {
  const source = await sharp("public/story-stage/merchant-poses.webp").png().toBuffer();
  for (let i = 0; i < 4; i++) {
    const pose = await readFrame(source, { left: i * 128, top: 0, width: 128, height: 128 });
    assert.ok(pose.box.height >= 94 && pose.box.height <= 98);
    assert.ok(Math.abs(pose.box.top + pose.box.height - 120) <= 1);
    const head = await headBounds(await sharp(pose.cell).extract(pose.box).png().toBuffer(), 0.25);
    assert.ok(Math.abs(head.width - 48) < 6, `merchant/${i}: head width ${head.width}`);
  }
});
