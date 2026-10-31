import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storyArtAt } from "../lib/story-art.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
const depart = "berne-restoration-departure",
  ret = "berne-restoration-return";
const item = (c, id) => c.items.find((i) => i.id === id);
const extra = (c, id) => c.extras.find((e) => e.id === id);
test("restoration workers retain standing scale and the keeper kneels below standing height", async () => {
  for (const n of ["keeper-restoration-v1", "restoration-carrier-v1"]) {
    const poses = JSON.parse(await readFile(`public/storybook-study/${n}-metrics.json`, "utf8"));
    assert.equal(poses.length, 8);
    assert.equal(poses[0].height, 94);
    for (const p of poses) {
      assert.equal(p.scale, poses[0].scale);
      assert.equal(p.top + p.height, 120);
      assert.ok(p.left > 0 && p.left + p.width < 128);
    }
    if (n.startsWith("keeper")) assert.ok(poses[1].height < 94 * 0.8);
  }
});
test("tea stays on a lower seated silhouette with the common standing scale and padded boots", async () => {
  for (const [who, height] of [
    ["aria", 134],
    ["leon", 144],
    ["mira", 126],
  ]) {
    const p = JSON.parse(
      await readFile(`public/storybook-study/${who}-tea-v1-metrics.json`, "utf8"),
    );
    assert.equal(p[0].height, height);
    for (const s of p.slice(1)) {
      assert.equal(s.scale, p[0].scale);
      assert.equal(s.top + s.height, 176);
      assert.ok(s.height < height * 0.93);
      assert.ok(s.left > 0 && s.left + s.width < 192);
    }
  }
});
test("the keeper reaches the desktop before placing the record and the plan stays in Leons hands", () => {
  const c = studyCue(depart, 8, true),
    s = c.sequence.at(-1),
    k = extra(s, "keeper"),
    at = new Map([["extra:keeper", { ...k, wrist: stageExtraWrist(k, false, 0) }]]);
  const hand = stageItemTarget(
      {
        ...item(s, "replacement-record"),
        extra: "keeper",
        support: undefined,
        wrist: true,
        wristAnchor: "bottom",
      },
      c,
      at,
    ),
    placed = item(s, "replacement-record");
  assert.ok(Math.abs(hand.x - placed.x) < placed.width / 2, "the fingers meet the paper edge");
  assert.ok(Math.abs(hand.bottom - placed.bottom) < 0.6, "the paper rests at hand height");
  assert.equal(placed.pitch, 55);
  const plan = item(studyCue(depart, 10, true).sequence[0], "groove-plan");
  assert.equal(plan.actor, "leon");
  assert.equal(plan.wristAnchor, "bottom");
});
test("the cart stays below the stone working area with a fixed crossbar grip during the detour", () => {
  const c = studyCue(depart, 15, true);
  for (const s of [c, ...c.sequence]) {
    const worker = extra(s, "stone-carrier"),
      cart = item(s, "passing-cart");
    assert.equal(cart.width, 26);
    assert.equal(cart.x, -14.3);
    assert.equal(cart.bottom - worker.bottom, 9.5);
    assert.ok(cart.bottom + ((26 * 320) / 512) * 1.5 < item(s, "recovered-stone").bottom);
    assert.equal(s.actors.find((a) => a.id === "finn").x, 20);
  }
  assert.ok(extra(c.sequence.at(-1), "stone-carrier").via.every((p) => p.bottom <= -18));
  assert.equal(c.finishBeforeAdvance, true);
});
test("only the authored five return displays precede the retained four-cup illustration", () => {
  assert.equal(storyArtAt(ret, 4), undefined);
  assert.match(storyArtAt(ret, 5).src, /four-cups-of-tea/);
  for (let i = 0; i < 17; i++) {
    const c = studyCue(depart, i, true);
    if (c.sequence?.length || c.actors.some((a) => a.via?.length))
      assert.equal(c.finishBeforeAdvance, true);
  }
  const tea = studyCue(ret, 4, true);
  assert.equal(tea.finishBeforeAdvance, true);
  assert.ok(tea.items.filter((i) => i.art === "chair").every((i) => i.width === 8.5));
});
