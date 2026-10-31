import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { storyStageCue } from "../lib/story-stage.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
import { stageItemVisible } from "../lib/story-stage-props.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { stageWrist } from "../lib/story-stage-wrists.ts";

test("moss care preserves all prior visible atlas pixels and keeps kneeling heads at standing scale", async () => {
  const hash = createHash("sha256");
  for (const id of ["aria", "leon", "mira", "finn", "lico"]) {
    const path = `public/story-stage/${id}-poses.webp`;
    assert.equal((await sharp(path).metadata()).height, 2816);
    const raw = await sharp(path)
      .extract({ left: 0, top: 0, width: 512, height: 2688 })
      .ensureAlpha()
      .raw()
      .toBuffer();
    for (let i = 0; i < raw.length; i += 4) if (!raw[i + 3]) raw.fill(0, i, i + 3);
    hash.update(id).update(raw);
  }
  assert.equal(
    hash.digest("hex"),
    "49fb59ca27f06edc4190e5fc4967bd17605318bfc6f79169c331843e2402583d",
  );
  const path = "public/story-stage/lico-poses.webp";
  const base = await readFrame(path, { left: 0, top: 0, width: 128, height: 128 });
  const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
  for (let index = 0; index < 4; index++) {
    const frame = await readFrame(path, { left: index * 128, top: 2688, width: 128, height: 128 });
    const h = await headBounds(
      await sharp(frame.cell).extract(frame.box).png().toBuffer(),
      index < 2 ? 0.25 : 0.375,
    );
    assert.ok(Math.abs(h.width - head.width) <= 2);
    assert.equal(frame.box.height, index < 2 ? 96 : 64);
    assert.equal(frame.box.top + frame.box.height, 120);
    assert.ok(frame.box.left >= 2 && frame.box.left + frame.box.width <= 126);
  }
});

test("the empty basket stays on the ground until Finn grasps it, then rises with his hands", () => {
  const basket = (cue) => cue.items.find((p) => p.id === "return-basket");
  for (let line = 0; line < 6; line++) {
    const cue = storyStageCue("moss-transplant-return", line);
    for (const step of [cue, ...(cue.sequence ?? [])]) {
      assert.equal(basket(step).actor, undefined);
      assert.equal(basket(step).width, 6);
    }
  }
  const cue = storyStageCue("moss-transplant-return", 6);
  assert.equal(cue.finishBeforeAdvance, true);
  const [grasp, lift] = cue.sequence;
  const finn = grasp.actors.find((a) => a.id === "finn");
  const pose = actorPose(finn, false, 0, false);
  assert.equal(pose.frame, 13);
  const contact = stageItemTarget(
    basket(grasp),
    cue,
    new Map([["finn", { ...finn, wrist: stageWrist("finn", pose.atlas, pose.frame) }]]),
  );
  assert.equal(contact.x, basket(cue).x);
  assert.equal(contact.bottom, basket(cue).bottom);
  assert.ok(lift.after - grasp.after >= 650);
  assert.equal(lift.actors.find((a) => a.id === "finn").carry, true);
  for (const step of [grasp, lift, storyStageCue("moss-transplant-return", 8)]) {
    assert.equal(basket(step).actor, "finn");
    assert.equal(basket(step).width, 6);
  }
});

test("Lico wipes before spreading leaves and recording, without a second floating cloth", () => {
  const cue = storyStageCue("moss-transplant-return", 3);
  const lico = (s) => s.actors.find((a) => a.id === "lico");
  assert.equal(lico(cue).mossStudy, "wipe");
  assert.equal(cue.finishBeforeAdvance, true);
  const spread = cue.sequence.find((s) => lico(s).mossStudy === "spread");
  const write = cue.sequence.find((s) => lico(s).mossStudy === "write");
  assert.ok(spread.after >= 1500 && write.after - spread.after >= 1500);
  for (const t of [0, 450]) {
    const pose = actorPose(lico(cue), false, t, false);
    assert.equal(pose.frame, 84 + t / 450);
    assert.equal(
      stageItemVisible(
        cue.items.find((p) => p.id === "dry-cloth"),
        new Map([["lico", { ...lico(cue), ...pose }]]),
      ),
      false,
    );
    assert.equal(actorPose(lico(spread), false, t, false).frame, 86 + t / 450);
  }
  assert.equal(actorPose(lico(cue), false, 800, true).frame, 84);
  assert.equal(actorPose(lico(spread), false, 800, true).frame, 86);
  assert.equal(spread.items.find((p) => p.id === "dry-cloth").actor, undefined);
  assert.ok(write.items.some((p) => p.id === "ledger" && p.art === "closed-ledger"));
  const moss = write.items.find((p) => p.id === "transplanted-moss");
  assert.ok(Math.abs(lico(write).x - moss.x) > moss.width);
});
