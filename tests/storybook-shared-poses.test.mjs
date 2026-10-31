import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import sharp from "sharp";
import { stories } from "../lib/stories.ts";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { sharedPoseContacts } from "../lib/storybook/shared-pose-contacts.ts";
import { sharedPoseImages } from "../lib/storybook/shared-pose-images.ts";
import { storyCastImages } from "../lib/storybook/stage-images.ts";
import { sampleStageActor } from "../lib/story-stage.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";

const asset = (name) => `public/storybook-study/${name}.webp`;
async function bounds(name) {
  const { data, info } = await sharp(asset(name))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return Array.from({ length: info.width / 192 }, (_, frame) => {
    let left = 192,
      right = -1,
      top = 192,
      bottom = -1;
    for (let y = 0; y < 192; y++)
      for (let x = 0; x < 192; x++)
        if (data[(y * info.width + frame * 192 + x) * 4 + 3] > 128) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
    return { left, right, top, bottom, height: bottom - top + 1 };
  });
}

test("new action strips keep crowns and feet within padded cells at the same physical scale", async () => {
  for (const [name, standing] of [
    ["aria-shoulder-v1", 134],
    ["leon-push-v1", 144],
    ["mira-bed-v2", 126],
  ]) {
    const measured = await bounds(name);
    assert.ok(Math.abs(measured[0].height - standing) < 4, name);
    for (const b of measured) {
      assert.ok(b.left >= 3 && b.right < 189 && b.top >= 3, `${name} has clear margins`);
      assert.ok(b.bottom >= 171 && b.bottom <= 176, `${name} retains its registered foot line`);
    }
    const metrics = JSON.parse(
      await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"),
    );
    const generated = metrics.frames.filter((f) => !f.pixelExact);
    assert.equal(new Set(generated.map((f) => f.scale)).size, 1, `${name} uses one calibration`);
  }
});

test("bed rest and breakfast stay lower than standing without enlarging the seated figure", async () => {
  const b = await bounds("mira-bed-v2");
  for (const index of [1, 3, 4]) assert.ok(b[index].height < b[0].height * 0.83);
  assert.ok(b[2].height < b[0].height * 0.92);
  const cell = async (name, frame) => {
    const pixels = await sharp(asset(name))
      .extract({ left: frame * 192, top: 0, width: 192, height: 192 })
      .raw()
      .toBuffer();
    // RGB under zero alpha is unspecified by WebP and has no visible contribution.
    for (let i = 0; i < pixels.length; i += 4) if (!pixels[i + 3]) pixels.fill(0, i, i + 3);
    return pixels;
  };
  assert.deepEqual(await cell("mira-bed-v2", 2), await cell("mira-seat-v3", 1));
});

test("all shared actions, including later sequence poses, are prepared before their story", async () => {
  const used = new Set();
  for (const story of stories) {
    const prepared = new Set(storyCastImages(story));
    for (let page = 0; page < story.lines.length; page++) {
      const cue = studyCue(story.id, page, true);
      if (!cue) continue;
      for (const image of sharedPoseImages(cue)) {
        assert.ok(prepared.has(image), `${story.id}:${page + 1} prepares ${image}`);
        used.add(image);
      }
    }
  }
  for (const name of ["mira-bed-v2", "aria-shoulder-v1", "leon-push-v1"])
    assert.ok(used.has(`/storybook-study/${name}.webp`));
  await Promise.all([...used].map((image) => access(`public${image}`)));
  assert.deepEqual(sharedPoseImages({ actors: [{ id: "finn", carry: true }] }), []);
});

test("shared contacts preserve actor paths and sequence timing without mutating authoring", () => {
  const cue = {
    actors: [{ id: "aria", x: 30, left: false, carry: true, via: [{ x: 32, bottom: 20 }] }],
    items: [{ id: "bread", art: "bread", actor: "aria", x: 4, bottom: 23 }],
    sequence: [{ after: 500, actors: [{ id: "aria", x: 50, left: false }], items: [] }],
  };
  const before = structuredClone(cue);
  const result = sharedPoseContacts(cue, "hilltop-picnic-departure");
  assert.deepEqual(cue, before);
  assert.deepEqual(result.actors[0].via, cue.actors[0].via);
  assert.equal(result.actors[0].x, cue.actors[0].x);
  assert.equal(result.sequence[0].after, 500);
  assert.equal(sharedPoseContacts(cue, "unrelated"), cue);
});

test("the carried medicine box stays at the supporting palm rather than above Mira's head", () => {
  for (const id of ["begging-golem-return", "mountain-entrance-departure"]) {
    const cue = studyCue(id, id === "begging-golem-return" ? 0 : 6, true);
    const mira = cue.actors.find((a) => a.id === "mira");
    const item = cue.items.find((i) => i.id === "medicine");
    const owner = sampleStageActor(mira, { x: mira.x, bottom: mira.bottom }, 0);
    const target = stageItemTarget(item, cue, new Map([["mira", owner]]));
    assert.equal(item.wrist, true);
    assert.ok(target.bottom > owner.bottom + 3 && target.bottom < owner.bottom + 13);
    assert.equal(item.width, 8);
  }
});

test("Aria's lap book and shoulder bag have contacts on the selected painted pose", () => {
  for (const [id, page, art] of [
    ["medicine-packing-departure", 1, "ledger"],
    ["medicine-packing-return", 4, "delivery-bag"],
  ]) {
    const cue = studyCue(id, page, true),
      actor = cue.actors.find((a) => a.id === "aria");
    const item = cue.items.find((i) => i.art === art);
    const owner = sampleStageActor(actor, { x: actor.x, bottom: actor.bottom }, 2000);
    assert.equal(item.wrist, true);
    assert.ok(owner.wrist && owner.wrist.y >= 60 && owner.wrist.y <= 95);
    assert.ok(item.width <= 6);
  }
});
