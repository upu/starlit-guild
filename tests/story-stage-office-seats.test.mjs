import { test } from "node:test";
import assert from "node:assert/strict";
import { storyStageCue as cue, sampleStageActor } from "../lib/story-stage.ts";
import { stageItemVisible } from "../lib/story-stage-props.ts";
import { journeyDuration } from "../lib/story-stage-travel.ts";
import { storyArtAt } from "../lib/story-art.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageWrist } from "../lib/story-stage-wrists.ts";

test("office handoffs finish before advancing and the signature illustration stays in place", () => {
  const id = "starlit-guild-founding-return";
  for (const line of [16, 18, 21, 35, 42, 50, 64]) {
    assert.equal(cue(id, line).finishBeforeAdvance, true, String(line));
  }
  const signing = cue(id, 64);
  const leon = signing.actors.find((a) => a.id === "leon");
  const previous = cue(id, 63).actors.find((a) => a.id === "leon");
  assert.ok(signing.sequence.at(-1).after > journeyDuration(leon, previous) + 500);
  assert.equal(storyArtAt(id, 66), undefined);
  for (let line = 67; line <= 110; line++) {
    assert.equal(storyArtAt(id, line).src, "/stories/guild-formation.webp");
  }
});

test("the same office chair passes from Finn to Mira to Leon after it is vacated", () => {
  const id = "starlit-guild-founding-return";
  const opening = cue(id, 0),
    start = opening.items.find((p) => p.id === "representative-chair");
  assert.equal(start.seatFor, "finn");
  assert.ok(opening.actors.find((a) => a.id === "finn").seated);
  for (const [line, oldOwner, newOwner] of [
    [42, "finn", "mira"],
    [50, "mira", "leon"],
  ]) {
    const step = cue(id, line),
      chair = step.items.find((p) => p.id === start.id);
    assert.deepEqual([chair.x, chair.bottom, chair.width], [start.x, start.bottom, start.width]);
    assert.equal(chair.seatFor, newOwner);
    assert.equal(step.actors.find((a) => a.id === oldOwner).seated, false);
    const prior = cue(id, line - 1).actors.find((a) => a.id === oldOwner);
    const leaving = sampleStageActor(
      step.actors.find((a) => a.id === oldOwner),
      prior,
      step.sequence[0].after,
      false,
    );
    assert.ok(Math.abs(leaving.x - start.x) + Math.abs(leaving.bottom - 14) > 6);
    const sitter = step.sequence.at(-1).actors.find((a) => a.id === newOwner);
    const seated = sampleStageActor(sitter, sitter, 5000, false);
    assert.ok(seated.onChair);
    assert.equal(stageItemVisible(chair, new Map([[newOwner, seated]])), false);
  }
  const writing = cue(id, 64),
    leon = writing.actors.find((a) => a.id === "leon");
  assert.equal(
    stageItemVisible(
      writing.items.find((p) => p.id === start.id),
      new Map([["leon", sampleStageActor(leon, leon, 5000, false)]]),
    ),
    true,
  );
  assert.equal(cue(id, 67), null); // existing signature illustration owns the rest
});

test("Mira has a chair before trying to get up and the group stays inside the storeroom", () => {
  const id = "matching-lantern-stone-return";
  const before = cue(id, 14).actors.find((a) => a.id === "mira");
  assert.ok(before.seated && before.chair);
  const attempt = cue(id, 15);
  assert.equal(attempt.actors.find((a) => a.id === "mira").seated, false);
  assert.ok(attempt.sequence.at(-1).actors.find((a) => a.id === "mira").seated);
  const end = cue(id, 21);
  assert.equal(end.background, "stone-storeroom");
  assert.equal(end.cut, false);
  const settled = end.sequence.at(-1);
  assert.ok(settled.actors.every((a) => a.seated && a.chair));
  assert.equal(settled.items.find((p) => p.art === "kettle").support, "brazier");
  assert.equal(settled.items.find((p) => p.art === "medicine-packet").support, "table");
  assert.equal(settled.items.filter((p) => p.art === "empty-cup" || p.art === "teacup").length, 4);
  assert.ok(!settled.items.some((p) => p.art === "tea-four"), "the tea is still being prepared");
});

test("the receipt reaches Finn only after arrival and reaches Leon after the return walk", () => {
  const id = "matching-lantern-stone-return",
    stage = cue(id, 12);
  const start = cue(id, 11).actors.find((a) => a.id === "finn"),
    target = stage.actors.find((a) => a.id === "finn");
  assert.ok(stage.sequence[0].after >= journeyDuration(target, start));
  assert.equal(stage.sequence[0].items.find((p) => p.art === "paper").actor, "finn");
  const walking = stage.sequence[1].actors.find((a) => a.id === "finn");
  assert.ok(stage.sequence[2].after - stage.sequence[1].after >= journeyDuration(walking, target));
  assert.equal(stage.sequence[2].items.find((p) => p.art === "paper").actor, "leon");
});

test("office and rest sequences never duplicate a prop id", () => {
  for (const [id, total] of [
    ["matching-lantern-stone-return", 22],
    ["starlit-guild-founding-return", 67],
  ])
    for (let i = 0; i < total; i++) {
      const c = cue(id, i);
      for (const m of [c, ...(c.sequence ?? [])])
        assert.equal(new Set(m.items.map((p) => p.id)).size, m.items.length, `${id}/${i}`);
    }
});

test("registration is written first, passed through all five hands, then returned by Leon", () => {
  const stage = cue("starlit-guild-founding-return", 35);
  const aria = stage.actors.find((a) => a.id === "aria");
  assert.ok(aria.writing);
  assert.ok([17, 18].includes(sampleStageActor(aria, aria, 2000, false).frame));
  let previous = stage,
    owner;
  const owners = [];
  for (const step of stage.sequence) {
    const paper = step.items.find((p) => p.art === "paper");
    if (paper?.actor) {
      const holder = step.actors.find((a) => a.id === paper.actor);
      assert.equal(paper.wrist, true);
      for (const elapsed of [0, 130, 260, 390]) {
        const pose = actorPose(holder, !holder.seated, elapsed, false);
        const wrist = stageWrist(holder.id, pose.atlas, pose.frame);
        assert.ok(wrist, `${holder.id}: paper loses hand during frame ${pose.frame}`);
        assert.ok(stageItemVisible(paper, new Map([[holder.id, { ...holder, ...pose, wrist }]])));
      }
    }
    if (paper?.actor && paper.actor !== owner) {
      if (owner) {
        const from = step.actors.find((a) => a.id === owner);
        const to = step.actors.find((a) => a.id === paper.actor);
        assert.ok(
          Math.hypot(from.x - to.x, (((from.bottom ?? 14) - (to.bottom ?? 14)) * 2) / 3) <= 16,
        );
        const start = previous.actors.find((a) => a.id === paper.actor);
        assert.ok(step.after - (previous.after ?? 0) >= journeyDuration(to, start));
      }
      owner = paper.actor;
      owners.push(owner);
    }
    previous = step;
  }
  assert.deepEqual(owners, ["aria", "leon", "mira", "finn", "lico", "leon"]);
  const end = stage.sequence.at(-1).items.find((p) => p.art === "paper");
  assert.equal(end.actor, undefined);
  assert.equal(end.support, "table");
  assert.equal(end.x, 50);
  assert.equal(
    cue("starlit-guild-founding-return", 36).actors.find((a) => a.id === "aria").writing,
    false,
  );
});
