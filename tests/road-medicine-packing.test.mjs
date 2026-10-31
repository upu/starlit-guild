import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { medicinePackingAssets as assets } from "../lib/road-medicine-packing.ts";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
test("standing packing and merchant preserve scale, boot baseline and cell gutters", async () => {
  for (const name of [
    "aria-table-packing-v1",
    "packing-merchant-v1",
    "aria-packing-turn-v1",
    "leon-packing-turn-v1",
  ]) {
    const file = `public/storybook-study/${name}.webp`,
      metrics = JSON.parse(await readFile(file.replace(".webp", "-metrics.json"), "utf8"));
    assert.equal(new Set(metrics.map((m) => m.scale)).size, 1);
    assert.ok(metrics.every((m) => m.baseline === 176));
    assert.ok(metrics.every((m) => Math.abs(m.height - metrics[0].height) < 12));
    const { data, info } = await sharp(file)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(info.width, 1024);
    assert.equal(info.height, 192);
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++)
        if (x % 256 < 2 || x % 256 > 253 || y < 2 || y > 189)
          assert.ok(data[(y * info.width + x) * 4 + 3] < 17);
  }
});
for (const width of [374, 936])
  test(`medicine workbench reaches all three work poses at ${width}`, () => {
    const view = { width, height: (width * 2) / 3 },
      motion = new RoadMotion();
    let state = act(
      testState(0, 11, 40, 10000),
      { type: "start", id: "medicine-packing", readDeparture: true, value: false },
      0,
    );
    const phases = new Set();
    let arrived = false;
    for (let time = 0; time < 180000; time += 50) {
      state = settle(state, time);
      const saved = JSON.stringify(state);
      const frame = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: "medicine-packing",
          questComplete: !!state.done["medicine-packing"],
          now: time,
          ready: true,
          paused: false,
          storybookHeroes: true,
          backgroundOverride: assets.bank,
        },
        false,
        1400,
        view,
      );
      const { battle, look } = motion.update(frame, "packing", width, false, view.height),
        scene = battle.waterwayActions;
      assert.equal(scene.props.filter((p) => p.id === "packing-table").length, 1);
      assert.equal(scene.actors.length, 1);
      assert.equal(scene.actors[0].id, "packing-merchant");
      assert.ok(!scene.worker);
      assert.ok(!scene.props.some((p) => p.asset.includes("waterway")));
      assert.equal(JSON.stringify(state), saved);
      if ([assets.aria, assets.ariaPaper].includes(scene.poses.aria?.asset)) {
        assert.equal(battle.heroes.find((h) => h.id === "aria").walking, false);
        phases.add(look.packing.node % 3);
      }
      if (!state.squads[0].run) {
        arrived = true;
        break;
      }
    }
    assert.ok(arrived);
    assert.deepEqual([...phases].sort(), [0, 1, 2]);
  });
