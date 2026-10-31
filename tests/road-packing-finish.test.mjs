import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { medicinePackingAssets as assets } from "../lib/road-medicine-packing.ts";
import { packingWrapFrame, packingWrapAsset, packingBagAsset } from "../lib/road-packing-finish.ts";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
test("wrapping physically folds smaller while the bag body remains the same width", async () => {
  const metrics = JSON.parse(
    await readFile("public/storybook-study/packing-finish-metrics.json", "utf8"),
  );
  const wrap = metrics.slice(0, 8),
    bags = metrics.slice(8);
  assert.equal(new Set(wrap.map((m) => m.scale)).size, 1);
  assert.equal(new Set(bags.map((m) => m.scale)).size, 1);
  assert.ok(wrap[2].width < wrap[0].width * 0.7);
  assert.ok(wrap[6].width < wrap[4].width * 0.7);
  assert.ok(Math.max(...bags.map((m) => m.width)) - Math.min(...bags.map((m) => m.width)) <= 2);
  assert.ok(bags[3].height < bags[0].height * 0.85, "lid lowers instead of enlarging closed bag");
  for (const m of metrics) {
    assert.equal(m.baseline, 248);
    const { data, info } = await sharp(`public/storybook-study/${m.name}.webp`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++)
        if (x < 2 || x > 253 || y < 2 || y > 253)
          assert.ok(data[(y * info.width + x) * 4 + 3] < 17);
  }
});
test("cloth is folded before a destination tag is attached", () => {
  assert.equal(packingWrapFrame(0, 3000), 0);
  assert.equal(
    packingWrapFrame(1, -20),
    0,
    "snapshot clock correction cannot select an invalid texture",
  );
  assert.deepEqual(
    [0, 650, 1300].map((t) => packingWrapFrame(1, t)),
    [0, 1, 2],
  );
  assert.equal(packingWrapFrame(2, 300), 2);
  assert.equal(packingWrapFrame(2, 600), 3);
});
test("medicine packing defaults respect explicit comparison choices and original data", () => {
  const input = {
    squad: testState(0, 11, 40, 10000).squads[0],
    startQuest: "medicine-packing",
    now: 123,
    ready: true,
    paused: false,
  };
  const output = storybookAdventureInput(input);
  assert.equal(output.backgroundOverride, assets.bank);
  assert.equal(output.squad, input.squad);
  const off = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(off), off);
  assert.equal(
    storybookAdventureInput({ ...input, backgroundOverride: "/comparison.webp" })
      .backgroundOverride,
    "/comparison.webp",
  );
});
for (const width of [374, 936])
  test(`all wrapping and closing stages play at ${width}`, () => {
    const view = { width, height: (width * 2) / 3 },
      motion = new RoadMotion();
    let state = act(
      testState(0, 11, 40, 10000),
      { type: "start", id: "medicine-packing", readDeparture: true, value: false },
      0,
    );
    const wrappers = { aria: new Set(), leon: new Set() },
      lids = { aria: new Set(), leon: new Set() };
    for (let time = 0; time < 100000; time += 50) {
      state = settle(state, time);
      const frame = chapterRoadFrame(
        storybookAdventureInput({
          squad: state.squads[0],
          startQuest: "medicine-packing",
          questComplete: !!state.done["medicine-packing"],
          now: time,
          ready: true,
          paused: false,
        }),
        false,
        1400,
        view,
      );
      const { battle } = motion.update(frame, "finish", width, false, view.height),
        scene = battle.waterwayActions;
      for (const id of ["aria", "leon"]) {
        const parcel = scene.props.find(
          (p) => p.id === (id === "aria" ? "packing-wrapped-medicine" : "packing-wrapped-honey"),
        );
        for (let n = 0; n < 4; n++) {
          if (parcel?.asset === packingWrapAsset(id, n)) wrappers[id].add(n);
          if (scene.props.find((p) => p.id === `packing-bag-${id}`).asset === packingBagAsset(n))
            lids[id].add(n);
        }
        const carried = scene.props.find((p) => p.id === `packing-carried-${id}`);
        if (carried)
          assert.equal(carried.asset, packingWrapAsset(id, 3), "only labelled packets leave table");
      }
      if (!state.squads[0].run) break;
    }
    for (const id of ["aria", "leon"]) {
      assert.equal(wrappers[id].size, 4);
      assert.equal(lids[id].size, 4);
    }
  });
