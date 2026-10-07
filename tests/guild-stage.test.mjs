import { test } from "node:test";
import assert from "node:assert/strict";
import {
  guildRoute,
  guildStageLayout,
  guildStagePeople,
  guildCropSlots,
  guildCropWidth,
  guildMotion,
} from "../lib/guild-stage-model.ts";
import { testState, act } from "../lib/game.ts";

test("guild routes stop at work points and reduced motion stays at the starting point", () => {
  const start = guildRoute(0, "linde", 0, false);
  assert.equal(guildRoute(0, "linde", 5000, false).walking, false);
  assert.equal(guildRoute(0, "linde", 7000, false).walking, true);
  assert.equal(guildRoute(0, "linde", 12000, false).walking, false);
  assert.equal(guildRoute(0, "linde", 19000, false).walking, true);
  assert.deepEqual(guildRoute(0, "linde", 24000, false), start);
  assert.deepEqual(guildRoute(0, "linde", 19000, true), start);
  for (let i = 0; i < 5; i++)
    for (const time of [0, 7000, 12000, 19000, 24000]) {
      assert.deepEqual(
        guildRoute(i, "home", time, false),
        guildRoute(i, "home", 0, false),
        "free members stay at tea seats",
      );
    }
  for (let t = 0; t < 24000; t += 100) {
    const p = guildRoute(0, "linde", t, false);
    for (const id of ["linde-1", "linde-2"]) {
      const bed = guildStageLayout.plots[id];
      const inside =
        Math.abs(p.x - bed.x) < bed.width / 2 &&
        p.y < bed.y &&
        p.y > bed.y - (bed.width * 261) / 448;
      assert.equal(inside, false, `${t}: caretaker must walk around ${id}`);
    }
  }
  const { worker, bench } = guildStageLayout;
  assert.ok(
    worker.x < bench.x - bench.width / 2,
    "worker stands beside the counter, not inside its footprint",
  );
});

test("plants fit the inner soil at seedling and full size; gait moves the upper body too", () => {
  for (const growth of [0, 0.5, 1])
    for (const slot of guildCropSlots) {
      const width = guildCropWidth(growth);
      assert.ok(slot.x - width / 2 >= 0.1 && slot.x + width / 2 <= 0.9);
      const height = (width * 448 * 409) / 441 / 261;
      assert.ok(slot.y - height >= 0.08 && slot.y <= 0.63, "plants remain above the front timber");
    }
  assert.ok(guildMotion(80, true, false).lift > 0);
  assert.notEqual(guildMotion(80, true, false).angle, guildMotion(400, true, false).angle);
  assert.deepEqual(guildMotion(80, true, true), { lift: 0, angle: 0 });
  assert.deepEqual(guildMotion(80, false, false), { lift: 0, angle: 0 });
});
test("assigned members also rest at tea when the workbench has no active batch", () => {
  let state = testState(1000, 37, 40, 100000);
  state = act(state, { type: "guildAssign", id: "workbench", hero: "mira" }, 1000);
  assert.ok(guildStagePeople(state, "home").includes("mira"));
  state = act(state, { type: "guildBuy", id: "honey", quantity: 10 }, 1000);
  state = act(state, { type: "guildCraft", id: "tea", quantity: 1 }, 1000);
  assert.ok(!guildStagePeople(state, "home").includes("mira"));
  state = act(state, { type: "guildCancel" }, 1000);
  assert.ok(guildStagePeople(state, "home").includes("mira"));
});
