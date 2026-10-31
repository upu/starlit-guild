import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { act, testState, settle } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { storybookWorkAppearance } from "../lib/road-storybook-work.ts";
import {
  STORYBOOK_FOREST,
  STORYBOOK_MOON_FOREST,
  STORYBOOK_MOUNTAIN,
  STORYBOOK_HILL,
  STORYBOOK_HILL_NIGHT,
  roadForestTileFlip,
  isScrollingStorybookRoad,
} from "../lib/road-scrolling-background.ts";
import { roadScale, roadX, roadHeroSize } from "../lib/road-layout.ts";
import { roadWorkWidth } from "../lib/road-work-layout.ts";
import { RoadMotion } from "../lib/road-motion.ts";

for (const [quest, index, background, profile] of [
  ["forest-wetland", 5, STORYBOOK_FOREST, "moss"],
  ["moonlit-herbs", 10, STORYBOOK_MOON_FOREST, "herb"],
  ["tower-road", 3, STORYBOOK_HILL, "herb"],
]) {
  test(`${quest}: painted route and forage contacts preserve the simulation`, () => {
    let state = act(
        testState(1000, index, 8, 10000),
        { type: "start", id: quest, readDeparture: true, value: false },
        1000,
      ),
      found = false;
    for (let i = 0; i < 1500; i++) {
      const input = storybookAdventureInput({
        squad: state.squads[0],
        startQuest: quest,
        now: state.updatedAt,
        ready: true,
        paused: false,
        storybookHeroes: true,
      });
      const frame = chapterRoadFrame(input);
      if (
        frame.look.work?.frame === profile &&
        frame.look.workers.length === 2 &&
        !frame.battle.enemies.some((e) => e.hp > 0)
      ) {
        found = true;
        break;
      }
      state = settle(state, state.updatedAt + 100);
    }
    assert.ok(found);
    const before = JSON.stringify(state);
    for (const [width, height] of [
      [374, 249],
      [936, 624],
    ]) {
      const input = storybookAdventureInput({
        squad: state.squads[0],
        startQuest: quest,
        now: state.updatedAt,
        ready: true,
        paused: false,
        storybookHeroes: true,
      });
      const { battle, look } = chapterRoadFrame(input, false, 1400, { width, height });
      const drawn = new RoadMotion().update({ battle, look }, quest, width, false, height);
      assert.equal(
        drawn.look.workers.length,
        2,
        "settled spacing must allow both actors to adopt their forage pose",
      );
      assert.equal(input.backgroundOverride, background);
      assert.equal(look.night, quest === "moonlit-herbs");
      assert.ok(
        storybookWorkAppearance(look).asset.includes(
          profile === "moss" ? "moss-colony" : "forage-herb",
        ),
      );
      const center = roadX(battle.gathering.x + 65, battle.distance, width, battle.stage),
        patch = roadWorkWidth(width, false, profile),
        size = roadHeroSize(width, height);
      for (const hero of battle.heroes) {
        const foot = roadX(hero.x, battle.distance, width, battle.stage);
        assert.ok(Math.abs(foot - center) > patch * 0.3, "boots outside roots");
        assert.ok(Math.abs(foot - center) < patch * 0.3 + size * 0.3, "hands within a short reach");
        assert.equal(hero.facing, hero.id === "aria" ? 1 : -1);
      }
    }
    assert.equal(JSON.stringify(state), before);
    const legacy = { squad: state.squads[0], startQuest: quest, storybookHeroes: false };
    assert.equal(storybookAdventureInput(legacy), legacy);
  });
}
test("forest and mountain repetition has matching mirrored edges and preserves custom compositions", () => {
  for (const bg of [
    STORYBOOK_FOREST,
    STORYBOOK_MOON_FOREST,
    STORYBOOK_MOUNTAIN,
    STORYBOOK_HILL,
    STORYBOOK_HILL_NIGHT,
  ]) {
    assert.ok(isScrollingStorybookRoad(bg));
    const period = 960 / roadScale(936, "forest");
    assert.equal(roadForestTileFlip(bg, period - 0.001, 936, 960, "forest"), false);
    assert.equal(roadForestTileFlip(bg, period + 0.001, 936, 960, "forest"), true);
    assert.equal(roadForestTileFlip(bg, period * 2 + 0.001, 936, 960, "forest"), false);
  }
  assert.equal(roadForestTileFlip("/custom.png", 0, 936, 960, "forest"), null);
});
test("phone and desktop preserve the same plant-to-body ratio", () => {
  for (const [width, height] of [
    [374, 249],
    [936, 624],
  ])
    for (const profile of ["herb", "moss"])
      assert.equal(roadWorkWidth(width, false, profile, height) / roadHeroSize(width, height), 0.6);
});
test("forage crouches retain one body scale and every full silhouette has transparent gutters", async () => {
  for (const id of ["aria", "leon"]) {
    const metrics = JSON.parse(
      await readFile(`public/storybook-study/${id}-forage-v1-metrics.json`),
    );
    assert.equal(new Set(metrics.map((m) => m.scale)).size, 1);
    assert.ok(metrics.every((m) => m.top + m.height === 176));
    assert.ok(metrics.slice(1).every((m) => m.height < metrics[0].height * 0.85));
    const { data, info } = await sharp(`public/storybook-study/${id}-forage-v1.webp`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++)
        if (x % 192 < 3 || x % 192 > 189 || y < 3 || y > 179)
          assert.equal(data[(y * info.width + x) * 4 + 3], 0);
  }
});
