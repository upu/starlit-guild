import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { renderMasterPose } from "../scripts/guild-lab-master-render.mjs";
import { LabSkirtMotion } from "../lib/guild-lab-skirt.ts";
import { labCharacters } from "../lib/guild-lab-characters.ts";
import { labSingleLeg } from "../lib/guild-lab-single-legs.ts";
import { labPose } from "../lib/guild-lab-model.ts";

test("removing generated underpaint cannot change Aria's visible painted surface", async () => {
  const dir = "work/lab-thirteenth-underpaint";
  mkdirSync(dir, { recursive: true });
  const { rig, art } = labCharacters.aria,
    motion = new LabSkirtMotion(rig.skirt),
    report = [];
  for (const mode of ["walk", "idle", "tea", "work"]) {
    const times =
      mode === "walk"
        ? Array.from({ length: 32 }, (_, i) => i * 112.5)
        : Array.from({ length: 16 }, (_, i) => i * 500);
    for (const time of times) {
      const body = labPose(time, mode, false, 1, 0, rig, art);
      const angles = rig.singleLegs.map(
        (_, i) => labSingleLeg(time, i, mode, body.bob, false, rig).rotation,
      );
      const skirt = motion.sample(time, mode, angles, false);
      const normal = await renderMasterPose(mode, time, skirt, { animate: true });
      const bare = await renderMasterPose(mode, time, skirt, {
        animate: true,
        hideUnderpaint: true,
      });
      assert.ok(normal.pixels.equals(bare.pixels), `${mode}/${time}: visible underpaint`);
      report.push({ mode, time, changedPixels: 0 });
      if (time < 900 || time === 3500)
        for (const [name, r] of [
          ["normal", normal],
          ["without-underpaint", bare],
          ["parts", await renderMasterPose(mode, time, skirt, { animate: true, tintParts: true })],
        ])
          await sharp(r.pixels, { raw: { width: r.width, height: r.height, channels: 4 } })
            .resize(720)
            .png()
            .toFile(`${dir}/${mode}-${time}-${name}.png`);
    }
  }
  writeFileSync(`${dir}/surface-comparison.json`, JSON.stringify(report, null, 2));
});
