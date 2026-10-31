import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { act, testState, settle } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { roadHeroSize, roadX } from "../lib/road-layout.ts";
import { roadWorkWidth, roadWorkObstacle } from "../lib/road-work-layout.ts";
import {
  storybookWorkAppearance,
  STORYBOOK_EARTHWORK,
  gatherCrouch,
  roadWorkOrigin,
  roadWorkProgressLayout,
} from "../lib/road-storybook-work.ts";

test("all five earthwork atlases preserve one scale, lower crouches, grounded tools and gutters", async () => {
  for (const id of ["aria", "leon", "mira", "finn", "lico"]) {
    const metrics = JSON.parse(
      await readFile(`public/storybook-study/${id}-earthwork-v1-metrics.json`),
    );
    assert.equal(new Set(metrics.map((m) => m.scale)).size, 1);
    for (const m of metrics) {
      assert.equal(m.top + m.height, 176);
      if (m.frame)
        assert.ok(m.height < metrics[0].height * 0.85, `${id}: kneeling is lower than standing`);
    }
    const { data, info } = await sharp(`public/storybook-study/${id}-earthwork-v1.webp`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(info.width, 768);
    assert.equal(info.height, 192);
    for (let y = 0; y < 192; y++)
      for (let x = 0; x < 768; x++) {
        if (data[(y * 768 + x) * 4 + 3] < 96) continue;
        assert.ok(x % 192 > 2 && x % 192 < 190 && y > 3 && y < 180, `${id}: intact silhouette`);
      }
  }
});

test("actual seedling quest uses earthwork on a walkable soil surface, separated from HP bars", () => {
  let state = act(
    testState(1000, 35, 18, 10000),
    { type: "start", id: "moss-transplant", readDeparture: true, value: false },
    1000,
  );
  let ready = false;
  for (let i = 0; i < 3000; i++) {
    const { look } = chapterRoadFrame({
      squad: state.squads[0],
      startQuest: "moss-transplant",
      now: state.updatedAt,
      ready: true,
      paused: false,
      storybookHeroes: true,
    });
    if (
      look.work?.frame === "earthwork" &&
      look.workers.length === 5 &&
      !state.squads[0].run.enemies?.some((e) => e.hp > 0)
    ) {
      ready = true;
      break;
    }
    state = settle(state, state.updatedAt + 100);
  }
  assert.ok(ready);
  const saved = JSON.stringify(state);
  for (const [width, height] of [
    [374, 249],
    [936, 624],
  ]) {
    const { battle, look } = chapterRoadFrame(
      {
        squad: state.squads[0],
        startQuest: "moss-transplant",
        now: state.updatedAt,
        ready: true,
        paused: false,
        storybookHeroes: true,
      },
      false,
      1400,
      { width, height },
    );
    assert.equal(battle.gathering.task, "gather");
    assert.equal(storybookWorkAppearance(look).asset, STORYBOOK_EARTHWORK);
    assert.equal(roadWorkOrigin(look, false), 0.6);
    assert.equal(
      roadWorkObstacle(battle, width, height, { x: 10, lane: 0.1 }, "earthwork", true),
      undefined,
    );
    const xs = battle.heroes
      .map((h) => roadX(h.x, battle.distance, width, battle.stage))
      .sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++)
      assert.ok(xs[i] - xs[i - 1] > roadHeroSize(width, height) * 0.8);
    assert.ok(xs.at(-1) - xs[0] < roadWorkWidth(width, false, "earthwork", height));
    const progress = roadWorkProgressLayout(look, 460, 110, 90);
    assert.ok(
      progress.size < 460 && progress.offset > 44,
      "progress is below the soil instead of across the workers' HP bars",
    );
    for (const time of [0, 100, 500, 1000])
      assert.equal(
        gatherCrouch(true, false, time, look),
        0,
        "supporting feet never bob above soil",
      );
  }
  assert.equal(JSON.stringify(state), saved);
});
