import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { actorPose } from "../lib/story-stage-pose.ts";
const id = "moss-transplant-departure";
const hoes = (s) => s.items.filter((i) => i.art === "farm-hoe");
test("the departure begins in the same loading yard with two persistent same-sized hoes", () => {
  for (let line = 0; line < 16; line++) {
    const c = studyCue(id, line, true);
    assert.equal(c.cell, 19);
    assert.equal(storybookPresentation(id, c.background, line).art, "tower-loading-yard-v1");
    for (const s of [c, ...(c.sequence ?? [])]) {
      assert.equal(hoes(s).length, 2);
      assert.ok(hoes(s).every((i) => i.width === 5.5));
    }
  }
});
test("each hoe is handled then laid on its side at the low hand, without blocking the standing foot", () => {
  const c = studyCue(id, 12, true),
    first = c.sequence.find((s) => s.after === 1000),
    second = c.sequence.find((s) => s.after === 3400);
  assert.equal(hoes(c).filter((i) => i.wrist).length, 1);
  for (const [s, index] of [
    [first, 0],
    [second, 1],
  ]) {
    const a = s.actors.find((a) => a.id === "leon"),
      p = a.wristPoints[actorPose(a, false, 0, true).frame],
      h = hoes(s).find((i) => i.id.endsWith(String(index)));
    const hand = {
      x: a.x + ((p[0] - 64) * c.cell) / 128,
      bottom: a.bottom + (((128 - p[1]) * c.cell) / 128) * 1.5,
    };
    const projection = (7 / 1.5) * Math.cos((h.pitch * Math.PI) / 180),
      grip = {
        x: h.x + projection * Math.sin((h.tilt * Math.PI) / 180),
        bottom: h.bottom + projection * Math.cos((h.tilt * Math.PI) / 180) * 1.5,
      };
    assert.ok(Math.abs(hand.x - grip.x) < 0.6 && Math.abs(hand.bottom - grip.bottom) < 0.1);
    assert.equal(h.actor, undefined);
    assert.equal(h.wrist, undefined);
    assert.equal(h.pitch, 55);
  }
  const final = c.sequence.at(-1);
  assert.ok(
    final.actors.find((a) => a.id === "leon").x < Math.min(...hoes(final).map((i) => i.x)) - 2,
  );
  assert.ok(
    Math.abs(
      final.actors.find((a) => a.id === "finn").x - final.actors.find((a) => a.id === "leon").x,
    ) >= 15,
  );
});
test("the hoe retains its complete blade and centers its shaft for the grip pivot", async () => {
  const m = JSON.parse(await readFile("public/storybook-study/farm-hoe-v1-metrics.json", "utf8"));
  assert.equal(m.shaftCenter, 160);
  assert.ok(m.left > 0 && m.left + m.width < 320 && m.top > 0);
  assert.equal(m.baseline, 624);
  const { data, info } = await sharp("public/storybook-study/farm-hoe-v1.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (x === 0 || x === 319 || y === 0 || y === 639)
        assert.ok(data[(y * info.width + x) * 4 + 3] <= 16);
  const c = studyCue(id, 0, true),
    body =
      ((JSON.parse(await readFile("public/storybook-study/leon-reaction-metrics.json", "utf8"))[0]
        .height *
        c.cell) /
        192) *
      1.5,
    tool = (m.height / 640) * 5.5 * 2 * 1.5;
  assert.ok(tool > body * 0.65 && tool < body * 1.1);
});

test("strapped hoes stay on the back while Leon bends, rather than floating beside him", () => {
  const start = studyCue(id, 0, true),
    placing = studyCue(id, 12, true).sequence.find((s) => s.after === 1000);
  for (const h of hoes(start)) {
    assert.ok(h.behindOwner);
    assert.ok(Math.abs(h.x) < 3);
    assert.equal(h.bottom, 24);
  }
  const remaining = hoes(placing).find((i) => i.actor && !i.wrist);
  assert.ok(Math.abs(remaining.x) < 3);
  assert.ok(remaining.tilt < hoes(start)[1].tilt);
});

test("Mira steps toward the path with her medical bag but stays visible for her last reply", () => {
  for (const line of [13, 14, 15]) {
    const c = studyCue(id, line, true),
      a = c.actors.find((a) => a.id === "mira"),
      bag = c.items.find((i) => i.id === "medicine");
    assert.equal(a.bottom, -15);
    assert.equal(c.finishBeforeAdvance, line === 13);
    assert.equal(a.visible, undefined);
    assert.equal(bag.actor, "mira");
    assert.ok(bag.wrist);
  }
});
