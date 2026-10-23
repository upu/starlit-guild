import { storyArtAt } from "../lib/story-art.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { readFrame, headBounds } from "../scripts/home-pixel-frames.mjs";
import { storyStageCue } from "../lib/story-stage.ts";
import { stageExtraFrame, stageExtraRows } from "../lib/story-stage-figure.ts";
import { stageItemTarget } from "../lib/story-stage-props.ts";
import { actorPose } from "../lib/story-stage-pose.ts";

const oldHashes = {
  aria: "65930cfc3d493a50320dca93df4501f98977ab64e33f72982aaaf09817344ef5",
  leon: "466a084580109daff925300cf3e3e947c7a26be1bf7294f7015a7fed8932be9b",
  mira: "2845aa53976d0c52b06746abf426613e45d6f38251f1090c3039004f4960c3b7",
  finn: "ec2952c7505673b525beab1dc1206c184af67f51dbb2d7d64553af4f179b1cbc",
  lico: "f8b3fd6894c4637e2303ee5db52e59a1cd420fe0ffa211ad6fa90c732676912d",
  worker: "f151fd4579d8fd5af30bbf80ef4134c6ad2e6dd65300d9585c24f556fec956c5",
};
test("trail poses preserve existing atlas cells and head / sole registration", async () => {
  for (const [id, hash] of Object.entries(oldHashes)) {
    const p = `public/story-stage/${id}-poses.webp`,
      height = id === "worker" ? 640 : 2048;
    const raw = await sharp(p)
      .extract({ left: 0, top: 0, width: 512, height })
      .ensureAlpha()
      .raw()
      .toBuffer();
    assert.equal(createHash("sha256").update(raw).digest("hex"), hash, id);
    if (!["mira", "worker"].includes(id)) continue;
    const base = await readFrame(p, { left: 0, top: 0, width: 128, height: 128 });
    const head = await headBounds(await sharp(base.cell).extract(base.box).png().toBuffer(), 0.25);
    for (let col = 0; col < 4; col++) {
      const f = await readFrame(p, { left: col * 128, top: height, width: 128, height: 128 });
      const h = await headBounds(await sharp(f.cell).extract(f.box).png().toBuffer(), 0.25);
      assert.ok(Math.abs(head.width - h.width) <= 1, `${id}/${col}`);
      assert.equal(f.box.height, 96);
      assert.equal(f.box.top + f.box.height, 120);
      assert.ok(f.box.left >= 2 && f.box.left + f.box.width <= 126);
    }
  }
  assert.equal(stageExtraRows({ id: "worker" }), 6);
});
test("Mira keeps her half-withdrawn note until the existing still begins", () => {
  const id = "glowing-moss-trail-departure";
  assert.equal(storyArtAt(id, 3), undefined);
  assert.equal(storyArtAt(id, 4).src, "/stories/mira-after-all-nighter.webp");
  assert.equal(storyArtAt("glowing-moss-trail-return", 3), undefined);
  assert.equal(storyArtAt("glowing-moss-trail-return", 4).src, "/stories/blue-cloth-alley.webp");
  for (let i = 0; i < 4; i++) {
    const c = storyStageCue(id, i),
      a = c.actors.find((a) => a.id === "mira");
    assert.equal(c.background, "brekka-foyer");
    assert.ok(actorPose(a, false, 0, false).frame >= 64);
    assert.ok(!c.items.some((i) => i.art === "ledger" || i.art === "medicine"));
  }
  const c = storyStageCue(id, 0);
  assert.equal(
    actorPose(
      c.actors.find((a) => a.id === "mira"),
      false,
      0,
      false,
    ).frame,
    64,
  );
  assert.equal(
    actorPose(
      c.sequence[0].actors.find((a) => a.id === "mira"),
      false,
      0,
      false,
    ).frame,
    65,
  );
});
test("the driver pulls the same cart and moss falls only on its announced line", () => {
  for (let line = 0; line < 4; line++) {
    const c = storyStageCue("glowing-moss-trail-return", line);
    const d = c.extras.find((e) => e.id === "worker"),
      cart = c.items.find((i) => i.art === "basket-cart"),
      moss = c.items.find((i) => i.id === "wheel-moss");
    assert.equal(d.pullCart, true);
    assert.equal(cart.extra, "worker");
    assert.ok(!c.actors.some((a) => a.inspect));
    assert.equal(moss.carrier, line < 3 ? "basket-cart" : undefined);
    assert.ok(moss.width < 3);
    for (const x of [60, 75, 90]) {
      const p = new Map([["extra:worker", { ...d, x }]]);
      const at = stageItemTarget(cart, c, p);
      assert.ok(Math.abs(at.x - x - cart.x) < 0.00001);
      p.set("item:basket-cart", at);
      const wheel = c.items.find((i) => i.art === "cart-wheel");
      const w = stageItemTarget(wheel, c, p);
      assert.ok(Math.abs(w.x - at.x - wheel.x) < 0.00001);
    }
  }
  assert.deepEqual(
    [0, 180, 360, 540].map((t) => stageExtraFrame({ id: "worker", pullCart: true }, true, t)),
    [20, 21, 22, 23],
  );
});
