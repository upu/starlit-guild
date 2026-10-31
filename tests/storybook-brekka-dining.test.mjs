import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { actorJourney } from "../lib/story-stage-travel.ts";
import { extraTravelDuration } from "../lib/story-stage-extra-travel.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
const id = "brekka-arrival-departure";
const prop = (s, id) => s.items.find((i) => i.id === id);
const server = (s) => s.extras.find((e) => e.id === "merchant");

test("adopted drinking poses use a single body scale and keep seated feet padded", async () => {
  for (const [name, start, end, standing, sole] of [
    ["brekka-pair-drinks-v2", 0, 4, 134, 176],
    ["brekka-leon-drinks-v1", 0, 4, 144, 176],
    ["brekka-adult-drinks-v1", 0, 4, 126, 176],
    ["finn-drinks-balanced-v2", 0, 4, 148, 176],
    ["brekka-worker-drinks-v1", 0, 4, 94, 120],
  ]) {
    const m = JSON.parse(await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"));
    assert.equal(m[start].height, standing);
    for (const p of m.slice(start + 1, end)) {
      assert.equal(p.scale, m[start].scale);
      assert.ok(p.height < standing * 0.92);
      assert.equal(p.top + p.height, sole);
      assert.ok(p.left > 0 && p.left + p.width < (sole === 176 ? 192 : 128));
    }
  }
});

test("Finn's seated drinking heads stay close to his normal seated poses", async () => {
  async function widths(name) {
    const metrics = JSON.parse(
      await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"),
    );
    const { data, info } = await sharp(`public/storybook-study/${name}.webp`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return metrics.slice(1).map((p, index) => {
      let left = 192,
        right = -1;
      for (let y = p.top; y < p.top + 30; y++)
        for (let x = 0; x < 192; x++)
          if (data[(y * info.width + (index + 1) * 192 + x) * 4 + 3] > 128) {
            left = Math.min(left, x);
            right = Math.max(right, x);
          }
      return right - left + 1;
    });
  }
  const drinking = await widths("finn-drinks-balanced-v2");
  const seated = await widths("finn-seat-balanced-v3");
  for (const width of drinking)
    assert.ok(width <= Math.max(...seated) + 8, `drinking head width ${width} is too large`);
});

test("empty and filled tiny ale cups remain the same physical cup", async () => {
  const m = JSON.parse(
    await readFile("public/storybook-study/brekka-drink-props-v1-metrics.json", "utf8"),
  );
  assert.equal(m[0].scale, m[1].scale);
  assert.ok(Math.abs(m[0].width - m[1].width) < 4);
  assert.ok(Math.abs(m[0].height - m[1].height) < 4);
  assert.equal(m[0].top + m[0].height, 248);
});

test("the two glasses meet within their rim widths while the chairs remain fixed", () => {
  const c = studyCue(id, 12, true),
    toast = c.sequence.find((s) => s.actors.find((a) => a.id === "aria").dining === "reach");
  const at = new Map(
    toast.actors.map((a) => [
      a.id,
      { ...a, wrist: { x: a.wristPoints[58][0], y: a.wristPoints[58][1] } },
    ]),
  );
  const a = stageItemTarget(prop(toast, "aria-glass"), c, at),
    l = stageItemTarget(prop(toast, "leon-glass"), c, at);
  assert.ok(l.x - a.x > 0 && l.x - a.x < 1.7);
  assert.ok(Math.abs(a.bottom - l.bottom) < 0.6);
  for (const s of c.sequence)
    for (const who of ["aria", "leon"]) {
      assert.equal(prop(s, `chair-${who}`).x, prop(c, `chair-${who}`).x);
      assert.equal(prop(s, `chair-${who}`).bottom, prop(c, `chair-${who}`).bottom);
    }
});

test("the server reaches each cup and the tray before serving it", () => {
  const c = studyCue(id, 12, true),
    firstPour = c.sequence.find((s) => s.after === 4000),
    second = c.sequence.find((s) => s.after === 5700),
    secondPour = c.sequence.find((s) => s.after === 9600);
  assert.equal(server(c).x, server(firstPour).x);
  assert.equal(server(c).bottom, server(firstPour).bottom);
  assert.ok(extraTravelDuration(server(c), server(studyCue(id, 11, true))) < 4000);
  assert.equal(server(second).x, server(secondPour).x);
  assert.ok(
    extraTravelDuration(server(second), server(firstPour)) < secondPour.after - second.after,
  );
  const trayApproach = c.sequence.find((s) => s.after === 13200),
    placed = c.sequence.find((s) => s.after === 16500),
    before = c.sequence.find((s) => s.after === 12500);
  assert.ok(
    extraTravelDuration(server(trayApproach), server(before)) < placed.after - trayApproach.after,
  );
  assert.equal(prop(placed, "fruit-tray").support, "table");
  assert.ok(c.finishBeforeAdvance);
});

test("the first cup lands at the hand and both pitcher spouts reach the cup rims", () => {
  const start = studyCue(id, 0, true),
    e = server(start),
    at = new Map([["extra:merchant", { ...e, wrist: stageExtraWrist(e, false, 0) }]]);
  const held = stageItemTarget(prop(start, "finn-ale"), start, at),
    placed = prop(start.sequence[0], "finn-ale");
  assert.ok(Math.abs(held.x - placed.x) < 0.1 && Math.abs(held.bottom - placed.bottom) < 0.1);
  const c = studyCue(id, 12, true);
  for (const s of c.sequence.filter((s) => [4000, 9600].includes(s.after))) {
    const e = server(s),
      p = stageItemTarget(
        prop(s, "ale-jug"),
        c,
        new Map([["extra:merchant", { ...e, wrist: stageExtraWrist(e, false, 0) }]]),
      );
    const cup = prop(s, s.after === 4000 ? "mira-ale" : "finn-ale");
    const spoutX = p.x + (e.left ? 2.2 : -2.2),
      spoutB = p.bottom - 2.7;
    assert.ok(Math.abs(spoutX - cup.x) < 1.5);
    assert.ok(Math.abs(spoutB - (cup.bottom + 2.6)) < 0.8);
  }
});

test("getting up keeps the chairs and walks around both ends of the table", () => {
  const c = studyCue(id, 24, true),
    leave = c.sequence.at(-1),
    standing = c.sequence.at(-2);
  assert.equal(standing.after, 600);
  for (const who of ["aria", "leon"]) {
    const a = leave.actors.find((a) => a.id === who),
      origin = standing.actors.find((a) => a.id === who),
      route = actorJourney(a, origin);
    assert.ok(route.some((p) => p.x < 38 || p.x > 82));
    for (let i = 1; i < route.length; i++)
      for (let t = 0; t <= 1; t += 0.1) {
        const x = route[i - 1].x + (route[i].x - route[i - 1].x) * t,
          b = route[i - 1].bottom + (route[i].bottom - route[i - 1].bottom) * t;
        assert.ok(!(x > 39 && x < 81 && b > 14 && b < 29), "no path through the table footprint");
      }
    assert.equal(prop(leave, `chair-${who}`).bottom, prop(c, `chair-${who}`).bottom);
  }
});
