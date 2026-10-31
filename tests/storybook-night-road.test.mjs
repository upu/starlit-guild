import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { handheldPoint, handheldFrame } from "../lib/road-handheld.ts";
import { hiddenHomewardWork, roadWorkFoot } from "../lib/road-storybook-work.ts";
import sharp from "sharp";
import { readFile } from "node:fs/promises";

for (const [width, height] of [
  [374, 249],
  [936, 624],
])
  test(`night jar survives full route and remains planted through every battle at ${width}px`, () => {
    let state = act(
      testState(1000, 4, 8, 10000),
      { type: "start", id: "moss-night-road", readDeparture: true, value: false },
      1000,
    );
    const motion = new RoadMotion(),
      seen = new Set();
    let ground,
      previous = "held",
      retrieved = 0,
      last;
    for (let f = 0; f < 10000 && state.squads[0].run; f++) {
      const before = JSON.stringify(state),
        input = storybookAdventureInput({
          squad: state.squads[0],
          now: state.updatedAt,
          ready: true,
          paused: false,
          storybookHeroes: true,
        });
      last = motion.update(
        chapterRoadFrame(input, false, 1400, { width, height }),
        "night",
        width,
        false,
        height,
      );
      assert.equal(JSON.stringify(state), before);
      const item = last.battle.handheld.find((i) => i.kind === "moss-jar"),
        hero = last.battle.heroes.find((h) => h.id === "aria");
      seen.add(item.phase);
      if (item.phase === "ground") {
        if (ground) assert.deepEqual(item.point, ground);
        else ground = item.point;
      }
      if (previous === "lift" && item.phase === "held") {
        retrieved++;
        ground = undefined;
      }
      if (item.phase === "lower" && last.battle.time - item.at >= 180) {
        const p = handheldPoint(
          item,
          hero,
          handheldFrame(item, hero, last.battle.time),
          { width, height },
          last.battle.stage,
        );
        assert.ok(Math.abs(p.x - item.point.x) < 1.5 && Math.abs(p.lane - item.point.lane) < 0.04);
      }
      if (last.look.work?.frame === "night-light") {
        assert.ok(hiddenHomewardWork(last.look));
        assert.equal(roadWorkFoot(last.battle.gathering, last.battle.heroes, last.look).x, hero.x);
      }
      previous = item.phase;
      state = settle(state, state.updatedAt + 50);
    }
    assert.equal(state.done["moss-night-road"], 1);
    assert.ok(retrieved >= 3, `Only ${retrieved} retrievals`);
    assert.equal(last.battle.handheld[0].phase, "held");
    for (const phase of ["held", "lower", "ground", "lift"]) assert.ok(seen.has(phase));
  });

test("night clothes and action atlases preserve scale groups, feet and full silhouettes", async () => {
  for (const name of ["aria-night-handheld-v1", "aria-night-battle-v1"]) {
    const path = `public/storybook-study/${name}.webp`,
      metrics = JSON.parse(await readFile(path.replace(".webp", "-metrics.json")));
    for (const source of new Set(metrics.map((m) => m.source)))
      assert.equal(new Set(metrics.filter((m) => m.source === source).map((m) => m.scale)).size, 1);
    assert.ok(metrics.every((m) => m.top + m.height === 176));
    if (name.includes("handheld")) assert.ok(metrics[1].height < metrics[0].height * 0.8);
    const { data, info } = await sharp(path)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const cw = name.includes("battle") ? 256 : 192;
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++)
        if (x % cw < 2 || x % cw >= cw - 2 || y % 192 < 2 || y % 192 >= 190)
          assert.equal(data[(y * info.width + x) * 4 + 3], 0);
  }
});
