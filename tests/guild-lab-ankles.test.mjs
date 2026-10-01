import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { labCharacters } from "../lib/guild-lab-characters.ts";
import { labAnkle } from "../lib/guild-lab-ankles.ts";
import { renderMasterPose } from "../scripts/guild-lab-master-render.mjs";

test("measured shoe soles stay level through midstance, with separate contact and swing rolls", async () => {
  for (const [id, { art, rig }] of Object.entries(labCharacters)) {
    for (let t = 0; t < 900; t += 25) {
      const r = await renderMasterPose("walk", t, undefined, { character: id });
      for (const [i, foot] of art.feet.entries()) {
        const a = labAnkle(t, i, "walk"),
          layer = r.layers.find((l) => l.frame === foot.frame);
        const s = art.master.scale,
          [px, py] = foot.point;
        const local = (p) => [p[0] - px + foot.root[0], p[1] - py + foot.root[1]];
        const p = layer.point(...local(foot.sole[0])),
          q = layer.point(...local(foot.sole[1]));
        const angle = Math.atan2(q[1] - p[1], q[0] - p[0]);
        if (a.phase === "plant")
          assert.ok(Math.abs(angle) <= (5 * Math.PI) / 180, `${id}/${i}/${t}: sole tilted`);
        assert.ok(Math.abs(angle - a.angle) < 1e-6);
        assert.ok(s > 0 && rig.feet[i].sole > 0);
      }
    }
    for (const mode of ["idle", "tea", "work"])
      for (const i of [0, 1]) assert.equal(labAnkle(400, i, mode).angle, 0);
    assert.equal(labAnkle(0, 0, "walk").phase, "heel");
    assert.equal(labAnkle(445, 0, "walk").phase, "push");
    assert.ok(labAnkle(600, 0, "walk").angle < 0);
    assert.equal(labAnkle(600, 0, "walk", true).angle, 0);
  }
});

test("shaft and shoe share original leather pixels across a generous ankle overlap", async () => {
  for (const { art } of Object.values(labCharacters))
    for (const [i, foot] of art.feet.entries()) {
      const part = art.master.parts.find((p) => p.name === (i ? "near-boot" : "far-boot"));
      const pixels = async (frame) => {
        const [left, top, width, height] = art.frames[frame];
        return sharp("public" + art.asset)
          .extract({ left, top, width, height })
          .raw()
          .toBuffer();
      };
      const shaft = await pixels(part.frame),
        shoe = await pixels(foot.frame);
      let shared = 0;
      for (let p = 0; p < shaft.length; p += 4)
        if (shaft[p + 3] > 240 && shoe[p + 3] > 240) {
          assert.deepEqual(shaft.subarray(p, p + 3), shoe.subarray(p, p + 3));
          shared++;
        }
      assert.ok(shared > 1000, "painted leather overlaps at the ankle");
      assert.equal(foot.overlap, 20);
    }
});

test("bent glove and boot samples are the identical original pixels under a rigid rotation", async () => {
  const { art } = labCharacters.aria;
  for (const variant of art.variants) {
    const source = variant.sharedSource,
      { data: original, info } = await sharp(source.image)
        .raw()
        .toBuffer({ resolveWithObject: true });
    assert.equal(createHash("sha256").update(original).digest("hex"), source.sha256);
    const [left, top, width, height] =
      art.frames[variant.kind === "arm" ? variant.forearmFrame : variant.frame];
    const actual = await sharp("public" + art.asset)
      .extract({ left, top, width, height })
      .raw()
      .toBuffer();
    const root = art.master.parts.find(
      (p) =>
        p.name ===
        (variant.side ? "near-" : "far-") + (variant.kind === "arm" ? "upper-arm" : "thigh"),
    ).joints[0];
    let checked = 0;
    for (let y = 4; y < height - 4; y++)
      for (let x = 4; x < width - 4; x++) {
        const dx = x - variant.root[0] + root[0] + 0.5 - source.hinge[0],
          dy = y - variant.root[1] + root[1] + 0.5 - source.hinge[1];
        if (Math.hypot(dx, dy) < 40) continue; // Only the exposed cuff/hinge may be repainted.
        const sx = Math.floor(
          source.hinge[0] +
            dx * Math.cos(source.rotation) +
            dy * Math.sin(source.rotation) -
            source.sourceRect[0],
        );
        const sy = Math.floor(
          source.hinge[1] -
            dx * Math.sin(source.rotation) +
            dy * Math.cos(source.rotation) -
            source.sourceRect[1],
        );
        if (sx < 0 || sy < 0 || sx >= info.width || sy >= info.height) continue;
        const p = (sy * info.width + sx) * 4,
          q = (y * width + x) * 4;
        if (original[p + 3] < 245 || actual[q + 3] < 245) continue;
        assert.deepEqual(
          actual.subarray(q, q + 3),
          original.subarray(p, p + 3),
          variant.name + " repaint outside joint",
        );
        checked++;
      }
    assert.ok(checked > 1000, variant.name + ": sufficient unchanged leather samples");
  }
});

test("material-only repairs leave no old skin below the skirt or green cloth in the hair", async () => {
  const { art } = labCharacters.aria;
  const repairs = JSON.parse(
    readFileSync("assets/source/guild/aria-master-v5-parts/material-repairs.json"),
  ).repairs;
  for (const repair of repairs) {
    const part = art.master.parts.find((p) => p.name === repair.name),
      [left, top, width, height] = art.frames[part.frame];
    const data = await sharp("public" + art.asset)
      .extract({ left, top, width, height })
      .raw()
      .toBuffer();
    let opaque = 0;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const [r, g, b, a] = data.subarray((y * width + x) * 4, (y * width + x) * 4 + 4);
        if (a < 180) continue;
        opaque++;
        if (repair.name === "skirt")
          assert.ok(y < repair.paintHeight + 4, "thigh or glove below owned cloth mask");
        else assert.ok(!(g >= r * 0.96 && g - b > 18 && r < 200), "cape pixel in hair");
      }
    assert.ok(opaque > 1000);
  }
  const { rig } = labCharacters.aria;
  assert.equal(rig.skirt.x, rig.skirtBack.x);
  assert.equal(rig.skirt.y, rig.skirtBack.y);
  assert.ok(
    rig.skirtBack.layer < rig.legs[0].layer &&
      rig.legs[0].layer < rig.legs[1].layer &&
      rig.legs[1].layer < rig.skirt.layer &&
      rig.skirt.layer < rig.torso.layer,
  );
});

test("Leon thigh completion contains one short trouser leg, with no coat edge or hanging second leg", async () => {
  const c = JSON.parse(readFileSync("assets/source/guild/leon-master-v7.json"));
  const measures = JSON.parse(readFileSync(`${c.directory}/measurements.json`));
  for (const name of ["near-thigh", "far-thigh"]) {
    const m = measures.find((p) => p.name === name),
      { data, info } = await sharp(`${c.directory}/${name}.png`)
        .raw()
        .toBuffer({ resolveWithObject: true });
    assert.ok(
      c.completedPaint.parts[name].cell[2] < 256,
      "cut a single leg from the completion sheet",
    );
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++) {
        const [r, g, b, a] = data.subarray((y * info.width + x) * 4, (y * info.width + x) * 4 + 4);
        if (a < 180) continue;
        assert.ok(
          y + m.rect[1] <= m.joints[1][1] + 12,
          "completion extends only inside the knee cuff",
        );
        if (name === "near-thigh")
          assert.ok(!(r > 165 && g > 150 && b > 120), "cream coat edge belongs to the torso");
      }
  }
});
