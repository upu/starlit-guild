import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import sharp from "sharp";

test("mountain medicine box stays clear of Leon's feet and keeps its size in transit", () => {
  const start = studyCue("mountain-entrance-departure", 0, true);
  const box = start.items.find((item) => item.id === "medicine");
  assert.equal(box.art, "medicine-closed");
  assert.ok(Math.abs(box.x - start.actors.find((actor) => actor.id === "leon").x) > 6);
  const treatment = studyCue("mountain-entrance-departure", 6, true);
  assert.equal(treatment.items.find((item) => item.id === "medicine").width, box.width);
  assert.equal(treatment.sequence[0].items.find((item) => item.id === "medicine").width, box.width);
});

test("perch strips retain one scale per person, a shared foot line, and a lower seated silhouette", async () => {
  const metrics = JSON.parse(
    await readFile(
      new URL("../public/storybook-study/perch-metrics.json", import.meta.url),
      "utf8",
    ),
  );
  for (const poses of Object.values(metrics)) {
    assert.equal(poses.length, 4);
    assert.ok(poses[2].height < poses[0].height * 0.9);
    for (const pose of poses) {
      assert.equal(pose.top + pose.height, 176);
      assert.equal(pose.scale, poses[0].scale);
      assert.ok(pose.left >= 0 && pose.left + pose.width <= 192);
    }
  }
});

test("tea handoff and pouring retain grips and wait for the complete sequence", async () => {
  const cue = studyCue("mountain-entrance-return", 4, true);
  assert.equal(cue.finishBeforeAdvance, true);
  for (const step of [cue, ...cue.sequence]) {
    assert.equal(step.actors.find((actor) => actor.id === "mira").nameAbove, true);
    for (const item of step.items.filter(
      (item) => item.actor && ["kettle", "empty-cup"].includes(item.art),
    )) {
      assert.equal(item.wrist, true);
      if (item.art === "kettle") assert.equal(item.left, false);
    }
  }
  assert.ok(cue.sequence.at(-1).after >= 5300);
  const metrics = JSON.parse(
    await readFile(
      new URL("../public/storybook-study/tea-kit-metrics.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(metrics.medicine.width, metrics["medicine-closed"].width);
  assert.equal(metrics.medicine.foot, metrics["medicine-closed"].foot);
});

test("Aria's seated palm meets the pot handle until she lets go, with the pot resting on the same rock", () => {
  for (let line = 4; line < 10; line++) {
    const cue = studyCue("mountain-entrance-return", line, true);
    for (const moment of [cue, ...(cue.sequence ?? [])]) {
      const aria = moment.actors.find((actor) => actor.id === "aria");
      if (!aria.seated) continue;
      const pose = sampleStageActor(aria, aria, 0, true);
      const pot = moment.items.find((item) => item.id === "teapot");
      const rock = moment.items.find((item) => item.id === "tea-stone");
      assert.equal(pose.frame, 37);
      assert.equal(pot.left, false, "the handle faces Aria rather than away from her");
      const handX = aria.x + ((pose.wrist.x - 64) * cue.cell) / 128;
      const handBottom = (aria.bottom ?? 14) + ((128 - pose.wrist.y) * cue.cell * 1.5) / 128;
      // The outside of the handle in the registered 256x260 closed-pot image.
      const handleX = pot.x + (14 / 256 - 0.5) * pot.width;
      const handleBottom = pot.bottom + ((260 - 162) / 256) * pot.width * 1.5;
      assert.ok(Math.abs(handX - handleX) < 0.8);
      assert.ok(Math.abs(handBottom - handleBottom) < 1.3);
      assert.equal(pot.support, rock.id);
      assert.equal(pot.x, rock.x);
      assert.equal(pot.bottom - rock.bottom, 5);
    }
  }
  const released = studyCue("mountain-entrance-return", 10, true);
  const aria = released.actors.find((actor) => actor.id === "aria");
  assert.equal(sampleStageActor(aria, aria, 0, true).frame, 36);
});

test("the registered palm and outer handle points lie on visible art", async () => {
  for (const [name, x, y] of [
    ["aria-perch-v1", 3 * 192 + 119, 117],
    ["teapot-v1", 14, 162],
  ]) {
    const { data, info } = await sharp(`public/storybook-study/${name}.webp`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let opaque = false;
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++)
        opaque ||= data[((y + dy) * info.width + x + dx) * 4 + 3] > 32;
    assert.ok(opaque, `${name}: the contact is not in the transparent gutter`);
  }
});
