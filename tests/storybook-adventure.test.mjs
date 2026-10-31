import { test } from "node:test";
import assert from "node:assert/strict";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { waterwayBackgrounds } from "../lib/road-waterway-layout.ts";
import { berneJourneyAssets } from "../lib/road-berne-journey.ts";
import { lanternRoadAssets } from "../lib/road-lantern-layout.ts";
import { mossBedsAssets } from "../lib/road-moss-beds.ts";
import {
  STORYBOOK_ROAD,
  STORYBOOK_MOUNTAIN,
  STORYBOOK_TRANSPLANT,
  STORYBOOK_HILL,
  STORYBOOK_HILL_NIGHT,
  STORYBOOK_FOREST,
  STORYBOOK_DUSK_FOREST,
} from "../lib/road-scrolling-background.ts";

test("the Berne road uses the reviewed four-person route while retaining comparison OFF", () => {
  const input = { squad: { run: { quest: "berne-road" } }, now: 1250 };
  const painted = storybookAdventureInput(input);
  assert.equal(painted.backgroundOverride, berneJourneyAssets.road);
  assert.equal(painted.storybookHeroes, true);
  assert.equal(painted.squad, input.squad);
  const legacy = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(legacy), legacy);
});

test("restoration defaults to the fixed workyard while preserving comparison OFF and custom backgrounds", () => {
  const input = { squad: { run: { quest: "tower-restoration" } }, now: 1500 };
  const painted = storybookAdventureInput(input);
  assert.equal(painted.backgroundOverride, waterwayBackgrounds.blocked);
  assert.equal(painted.squad, input.squad);
  assert.equal(painted.storybookHeroes, true);
  const off = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(off), off);
  assert.equal(
    storybookAdventureInput({ ...input, backgroundOverride: "/custom.png" }).backgroundOverride,
    "/custom.png",
  );
});

test("the moss jar night route defaults to its moonlit ground without altering saved input", () => {
  const input = { squad: { run: { quest: "moss-night-road" } }, now: 1500 };
  const painted = storybookAdventureInput(input);
  assert.equal(painted.backgroundOverride, STORYBOOK_HILL_NIGHT);
  assert.equal(painted.storybookHeroes, true);
  assert.equal(painted.squad, input.squad);
  const comparison = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(comparison), comparison);
});

test("both trading routes enable their own daylight and dusk ground while keeping comparison OFF", () => {
  for (const [quest, background] of [
    ["village-trade", STORYBOOK_FOREST],
    ["evening-trade-road", STORYBOOK_DUSK_FOREST],
  ]) {
    const input = { squad: { run: { quest } }, now: 1000 },
      painted = storybookAdventureInput(input);
    assert.equal(painted.backgroundOverride, background);
    assert.equal(painted.squad, input.squad);
    assert.equal(painted.storybookHeroes, true);
    const off = { ...input, storybookHeroes: false };
    assert.equal(storybookAdventureInput(off), off);
  }
});

test("town adventure uses the reviewed art without changing the squad or simulation state", () => {
  const input = {
    squad: { run: { quest: "town-deliveries", started: 10 } },
    startQuest: "village-trade",
    now: 1234,
    paused: false,
    ready: true,
  };
  const before = JSON.stringify(input);
  const painted = storybookAdventureInput(input);
  assert.equal(painted.backgroundOverride, STORYBOOK_ROAD);
  assert.equal(painted.storybookHeroes, true);
  assert.equal(painted.squad, input.squad);
  assert.equal(painted.now, input.now);
  assert.equal(JSON.stringify(input), before);
  const legacy = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(legacy), legacy);
  const custom = { ...input, backgroundOverride: "/custom.png" };
  assert.equal(storybookAdventureInput(custom).backgroundOverride, "/custom.png");
});

test("the mountain run receives its own painted road while preserving simulation and overrides", () => {
  const squad = { run: { quest: "mountain-entrance" }, members: ["aria", "leon", "mira"] };
  const input = { squad, startQuest: "town-deliveries", now: 1234 };
  const painted = storybookAdventureInput(input);
  assert.equal(painted.backgroundOverride, STORYBOOK_MOUNTAIN);
  assert.equal(painted.storybookHeroes, true);
  assert.equal(painted.squad, squad);
  assert.equal(
    storybookAdventureInput({ ...input, storybookHeroes: false }).storybookHeroes,
    false,
  );
});

test("active quest wins over selection and unconverted regions keep their authored art", () => {
  const input = { squad: { run: { quest: "merrill-seedlings" } }, startQuest: "town-deliveries" };
  assert.equal(storybookAdventureInput(input).backgroundOverride, mossBedsAssets.yard);
  assert.equal(storybookAdventureInput(input).squad, input.squad);
  const unknown = { ...input, squad: { run: { quest: "unknown-quest" } } };
  assert.equal(storybookAdventureInput(unknown), unknown);
  assert.equal(
    storybookAdventureInput({ ...input, squad: { run: null } }).backgroundOverride,
    STORYBOOK_ROAD,
  );
});

test("the hill approach uses the reviewed ground by default while preserving comparison and custom art", () => {
  const input = { squad: { run: { quest: "tower-road" } }, now: 1250 };
  assert.equal(storybookAdventureInput(input).backgroundOverride, STORYBOOK_HILL);
  assert.equal(storybookAdventureInput(input).squad, input.squad);
  const legacy = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(legacy), legacy);
  assert.equal(
    storybookAdventureInput({ ...input, backgroundOverride: "/custom.png" }).backgroundOverride,
    "/custom.png",
  );
});

test("five-person seedling transport uses its night lane without replacing saved state", () => {
  const squad = { run: { quest: "moss-transplant" } };
  const input = { squad, now: 1250 };
  const painted = storybookAdventureInput(input);
  assert.equal(painted.backgroundOverride, STORYBOOK_TRANSPLANT);
  assert.equal(painted.storybookHeroes, true);
  assert.equal(painted.squad, squad);
});

test("the homeward quest enables its reviewed handheld scene by default and retains comparison OFF", () => {
  const input = { squad: { run: { quest: "medicine-road-home" } }, now: 1250 };
  const painted = storybookAdventureInput(input);
  assert.equal(painted.backgroundOverride, STORYBOOK_MOUNTAIN);
  assert.equal(painted.storybookHeroes, true);
  assert.equal(painted.squad, input.squad);
  const legacy = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(legacy), legacy);
});

test("the lantern detour selects its reviewed village road without changing the game state", () => {
  const input = { squad: { run: { quest: "lantern-detour" } }, startQuest: "linde-requests" };
  const before = JSON.stringify(input);
  const painted = storybookAdventureInput(input);
  assert.equal(painted.backgroundOverride, lanternRoadAssets.bank);
  assert.equal(painted.storybookHeroes, true);
  assert.equal(painted.squad, input.squad);
  assert.equal(JSON.stringify(input), before);
  const off = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(off), off);
  assert.equal(
    storybookAdventureInput({ ...input, backgroundOverride: "/custom.png" }).backgroundOverride,
    "/custom.png",
  );
});
