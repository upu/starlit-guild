import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { stageExtraWrist } from "../lib/story-stage-extra-wrists.ts";
import { stageExtraFrame } from "../lib/story-stage-figure.ts";
import { stageCameraCue } from "../lib/story-stage-camera.ts";
import { storyArt } from "../lib/story-art.ts";
import { stories } from "../lib/stories.ts";
import { storybookPresentation } from "../lib/storybook/presentation.ts";
const id = "glowing-moss-trail-return";
const prop = (s, name) => s.items.find((i) => i.id === name);

test("the return continues the chase at the same fork without restarting at the brewery", () => {
  const cue = studyCue(id, 0, true),
    story = stories.find((s) => s.id === id);
  assert.equal(storybookPresentation(id, cue.background, 0).art, "brekka-fork-v1");
  assert.match(story.lines[0].text, /荷車を追って/);
  assert.doesNotMatch(story.lines[0].text, /醸造所の裏から出る/);
  for (const actor of cue.actors) assert.equal(cue.initial[actor.id], actor.x);
  const aria = cue.actors.find((actor) => actor.id === "aria"),
    leon = cue.actors.find((actor) => actor.id === "leon");
  assert.ok(aria.x < leon.x && leon.x < cue.extras[0].x);
  assert.equal(cue.cell, 18);
});

test("tired and pulling poses keep their calibrated head/body scale and complete padded soles", async () => {
  for (const [name, height, cell, sole] of [
    ["mira-all-nighter-v1", 126, 192, 176],
    ["brekka-cart-driver-v1", 94, 128, 120],
  ]) {
    const m = JSON.parse(await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"));
    assert.equal(m[0].height, height);
    for (const p of m) {
      assert.equal(p.scale, m[0].scale);
      assert.equal(p.top + p.height, sole);
      assert.ok(p.left > 0 && p.left + p.width < cell);
      assert.ok(p.height <= height + 2 && p.height > height * 0.9);
    }
  }
});

test("cart shaft tips remain within the driver's visible palm through all four pulling steps", () => {
  const c = studyCue(id, 0, true),
    e = c.extras[0],
    cart = prop(c, "basket-cart");
  const frames = new Set();
  for (const elapsed of [0, 180, 360, 540]) {
    frames.add(stageExtraFrame(e, true, elapsed));
    const at = { ...e, x: 66, left: false, wrist: stageExtraWrist(e, true, elapsed) };
    const positions = new Map([["extra:worker", at]]);
    const p = stageItemTarget(cart, c, positions);
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
    // Pixel coordinates of the near handle tip in the registered 512x384 cart image.
    const tip = {
      x: p.x + ((453 - 256) / 512) * cart.width,
      bottom: p.bottom + ((384 - 258) / 512) * cart.width * 1.5,
    };
    assert.ok(Math.abs(tip.x - palm.x) < 0.8);
    assert.ok(Math.abs(tip.bottom - palm.bottom) < 0.2);
  }
  assert.deepEqual([...frames], [20, 21, 22, 23]);
});

test("the rotating wheel is centered on the axle and remains smaller than the standing driver", () => {
  const c = studyCue(id, 0, true),
    cart = prop(c, "basket-cart"),
    wheel = prop(c, "cart-wheel");
  const axleX = ((106 - 256) / 512) * cart.width;
  const axleB = ((384 - 214) / 512) * cart.width * 1.5;
  assert.ok(Math.abs(wheel.x - axleX) < 0.2);
  assert.ok(Math.abs(wheel.bottom + wheel.width * 0.75 - axleB) < 0.2);
  assert.ok(wheel.width < ((c.cell * 94) / 128) * 0.7);
  assert.equal(wheel.carrier, cart.id);
});

test("the moss falls from the moving wheel and the complete cart exits before the still", () => {
  const before = studyCue(id, 2, true),
    c = stageCameraCue(studyCue(id, 3, true));
  assert.equal(prop(before, "wheel-moss").carrier, "basket-cart");
  assert.ok(prop(c, "wheel-moss").dropInPlace);
  assert.equal(prop(c, "wheel-moss").carrier, undefined);
  assert.ok(c.finishBeforeAdvance);
  const cart = prop(c, "basket-cart"),
    driver = c.extras[0];
  const left = 50 + (driver.x + cart.x - cart.width / 2 - 50) * c.cameraScale;
  assert.ok(left > 100);
  assert.equal(storyArt[id].src, "/stories/blue-cloth-alley.webp");
  assert.equal(storyArt[id].revealAtLine, 4);
  assert.equal(
    storyArt["glowing-moss-trail-departure"].src,
    "/stories/mira-after-all-nighter.webp",
  );
  assert.equal(storyArt["glowing-moss-trail-departure"].revealAtLine, 4);
});
