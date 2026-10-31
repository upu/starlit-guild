import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { storybookExitCue } from "../lib/storybook/travel-packing.ts";
import { actorJourney } from "../lib/story-stage-travel.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
const id = "glowing-moss-trail-next-day-return";
const actor = (s, who) => s.actors.find((a) => a.id === who);
const prop = (s, who) => s.items.find((i) => i.id === who);
const screenFoot = (p) => ({ x: 50 + (p.x - 50) * 0.72, y: 81 - (p.bottom + 2.25) * 0.72 });

test("the return begins with the four following the cart in two separate rows", () => {
  const cue = studyCue(id, 0, true);
  const aria = actor(cue, "aria"),
    leon = actor(cue, "leon"),
    mira = actor(cue, "mira"),
    finn = actor(cue, "finn");
  assert.equal(cue.background, "brekka-fork");
  assert.equal(cue.cell, 18);
  assert.ok(aria.x < leon.x && mira.x < finn.x);
  assert.ok(aria.bottom > mira.bottom && leon.bottom > finn.bottom);
  assert.ok(cue.extras[0].x > Math.max(...cue.actors.map((a) => a.x)));
  assert.ok(aria.nameAbove && leon.nameAbove);
  for (const a of cue.actors) assert.equal(cue.initial[a.id], a.x);
});

test("the route notebook retains Leon's standing scale in every reading and writing frame", async () => {
  const m = JSON.parse(
    await readFile("public/storybook-study/leon-route-notes-metrics.json", "utf8"),
  );
  assert.equal(m[0].height, 144);
  for (const p of m) {
    assert.equal(p.scale, m[0].scale);
    assert.ok(Math.abs(p.height - 144) <= 1);
    assert.equal(p.top + p.height, 176);
    assert.ok(p.left > 0 && p.left + p.width < 192);
  }
  assert.equal(actor(studyCue(id, 2, true), "leon").routeNotes, "write");
  assert.equal(actor(studyCue(id, 2, true).sequence.at(-1), "leon").routeNotes, "read");
  assert.equal(
    actor(studyCue("glowing-moss-trail-next-day-departure", 5, true), "leon").routeNotes,
    undefined,
  );
  assert.equal(
    actor(storybookExitCue("glowing-moss-trail-next-day-departure"), "leon").routeNotes,
    undefined,
  );
});

test("all four stair routes and Finn's return use the painted steps and upper landing", () => {
  const c = studyCue(id, 7, true);
  for (const who of ["aria", "leon", "mira", "finn"]) {
    const route = actor(c.sequence.at(-1), who).via;
    for (const p of route) {
      const f = screenFoot(p);
      // Bounds include only the stone tread/landing, excluding both retaining walls.
      const min = f.y > 53 ? 36 : f.y > 38 ? 43 : f.y > 29 ? 48 : 50;
      const max = f.y > 53 ? 61 : f.y > 38 ? 64 : f.y > 29 ? 68 : 70;
      assert.ok(f.x - 1.8 > min && f.x + 1.8 < max, `${who}: ${JSON.stringify(f)}`);
    }
  }
  assert.ok(c.finishBeforeAdvance);
  const down = studyCue(id, 9, true),
    finn = actor(down.sequence.at(-1), "finn");
  assert.deepEqual(finn.via.slice(0, 4), actor(c.sequence.at(-1), "finn").via.toReversed());
  assert.ok(screenFoot(actorJourney(finn, actor(down, "finn")).at(-1)).y > 125);
  assert.equal(actor(down, "finn").left, true);
});

test("the lower cart stays below the retaining wall and keeps its wheel and driver's height together", () => {
  const c = studyCue(id, 3, true),
    e = c.extras[0],
    cart = prop(c, "basket-cart");
  const p = stageItemTarget(cart, c, new Map([["extra:worker", e]]));
  assert.equal(e.bottom, -20);
  assert.ok(Math.abs(p.bottom - e.bottom - 2.325) < 0.001);
  const wheel = prop(c, "cart-wheel"),
    floorY = 81 - (p.bottom + wheel.bottom) * 0.72;
  assert.ok(floorY > 86 && floorY < 94);
  assert.ok(screenFoot(e).y < 97);
  const upper = studyCue(id, 8, true);
  assert.equal(upper.extras[0].bottom, 68);
  assert.ok(screenFoot(upper.extras[0]).y > 29 && screenFoot(upper.extras[0]).y < 40);
  assert.equal(storybookPresentation(id, "brekka-tower-path").art, "brekka-tower-path-v2");
});

test("the pursuit keeps its scale and the driver's hand on the cart through every walking frame", () => {
  for (const line of [0, 3, 7, 8]) {
    const c = studyCue(id, line, true),
      cart = prop(c, "basket-cart");
    assert.equal(c.cell, 18);
    for (const elapsed of [0, 180, 360, 540]) {
      const driver = {
        ...c.extras[0],
        x: 66,
        left: false,
        wrist: stageExtraWrist(c.extras[0], true, elapsed),
      };
      const positions = new Map([["extra:worker", driver]]);
      const at = stageItemTarget(cart, c, positions);
      const palm = stageItemTarget(
        {
          id: "palm",
          art: "moss",
          extra: "worker",
          x: 0,
          bottom: 0,
          wrist: true,
          wristAnchor: "bottom",
        },
        c,
        positions,
      );
      const tip = {
        x: at.x + ((453 - 256) / 512) * cart.width,
        bottom: at.bottom + ((384 - 258) / 512) * cart.width * 1.5,
      };
      assert.ok(Math.abs(tip.x - palm.x) < 0.8);
      assert.ok(Math.abs(tip.bottom - palm.bottom) < 0.2);
    }
  }
});

test("the upper group keeps a clear floor position and head padding at the original camera scale", () => {
  const c = studyCue(id, 8, true),
    heights = { aria: 134, leon: 144, mira: 126, finn: 148 };
  for (const a of c.actors) {
    const f = screenFoot(a),
      headY = f.y - (heights[a.id] / 192) * c.cell * 1.5 * 0.72;
    assert.ok(f.x > 25 && f.x < 62 && f.y > 19 && f.y < 27);
    assert.ok(headY > 1.5, `${a.id} head ${headY}`);
  }
  assert.ok(c.finishBeforeAdvance);
});
