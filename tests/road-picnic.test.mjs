import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { RoadGait } from "../lib/road-gait.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { handheldFrame, handheldPoint } from "../lib/road-handheld.ts";
import {
  picnicLeonPose,
  picnicAssets,
  picnicEncounterNear,
  picnicEffects,
} from "../lib/road-picnic.ts";
import { STORYBOOK_HILL } from "../lib/road-scrolling-background.ts";
import { access } from "node:fs/promises";

test("remote next enemies allow retrieval, and occupied hands cannot shoot or slash", () => {
  const battle = {
    heroes: [{ id: "aria", x: 400, hp: 1 }],
    enemies: [{ x: 450, hp: 1 }],
    effects: [
      { kind: "arrow", hero: "aria" },
      { kind: "heal", hero: "aria" },
    ],
  };
  assert.equal(picnicEncounterNear(battle, new Map([["aria", { x: 100 }]])), false);
  assert.equal(picnicEncounterNear(battle, new Map([["aria", { x: 300 }]])), true);
  assert.deepEqual(picnicEffects(battle, [{ hero: "aria", phase: "lift", returning: true }]), [
    battle.effects[1],
  ]);
  assert.deepEqual(
    picnicEffects(battle, [{ hero: "aria", phase: "ground", returning: false }]),
    battle.effects,
  );
});

test("picnic defaults to the shared hill and retains explicit comparison choices", async () => {
  const input = { squad: {}, startQuest: "hilltop-picnic" };
  assert.equal(storybookAdventureInput(input).backgroundOverride, STORYBOOK_HILL);
  assert.equal(
    storybookAdventureInput({ ...input, backgroundOverride: "custom" }).backgroundOverride,
    "custom",
  );
  const off = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(off), off);
  for (const path of Object.values(picnicAssets)) await access("public" + path);
  assert.deepEqual(picnicLeonPose(1), { asset: picnicAssets.lower, frame: 3, cell: 192 });
  assert.deepEqual(picnicLeonPose(2), { asset: picnicAssets.lower, frame: 2, cell: 192 });
  for (let stride = 0; stride < 4; stride++)
    assert.deepEqual(picnicLeonPose(4 + stride), {
      asset: picnicAssets.walk,
      frame: stride,
      cell: 256,
    });
});

for (const [width, height] of [
  [374, 249],
  [936, 624],
])
  test(`picnic retrieves and carries lunches at every encounter and stays at arrival at ${width}`, () => {
    let state = act(
      testState(1000, 9, 8, 10000),
      { type: "start", id: "hilltop-picnic", readDeparture: true, value: false },
      1000,
    );
    const motion = new RoadMotion(),
      gait = new RoadGait(),
      strides = { aria: new Set(), leon: new Set() },
      seen = { aria: new Set(), leon: new Set() },
      cycles = { aria: 0, leon: 0 },
      prior = {},
      ground = new Map(),
      lastDrops = new Map(),
      expected = state.squads[0].run.nodes;
    let identity,
      finished = false,
      arrivedAt,
      arrivalPosition;
    for (let step = 0; step < 10000; step++) {
      const input = storybookAdventureInput({
        squad: state.squads[0],
        startQuest: "hilltop-picnic",
        now: state.updatedAt,
        ready: true,
        paused: false,
        questComplete: !!state.done["hilltop-picnic"],
      });
      const saved = JSON.stringify(state),
        raw = chapterRoadFrame(input, false, 1400, { width, height });
      identity = roadPaintKey("picnic", state.squads[0].run ?? null, raw.look, identity);
      const { battle, look } = motion.update(raw, identity.key, width, false, height);
      assert.equal(JSON.stringify(state), saved);
      assert.equal(input.backgroundOverride, STORYBOOK_HILL);
      assert.equal(look.quest, "hilltop-picnic");
      assert.equal(battle.journeyCart, undefined);
      assert.equal(battle.handheld.length, 2);
      for (const item of battle.handheld) {
        const walking = battle.heroes.find((h) => h.id === item.hero);
        const stride = gait.frame(walking, { width, height, stage: battle.stage });
        if (item.phase === "held" && walking.walking) strides[item.hero].add(stride);
        seen[item.hero].add(item.phase);
        assert.equal(item.kind, item.hero === "aria" ? "lunch-bag" : "bread-parcel");
        if (item.phase === "ground") {
          if (ground.has(item.hero)) assert.deepEqual(item.point, ground.get(item.hero));
          else ground.set(item.hero, item.point);
          lastDrops.set(item.hero, item.point.x);
        } else if (item.phase === "held") ground.delete(item.hero);
        if (prior[item.hero] === "lift" && item.phase === "held") cycles[item.hero]++;
        prior[item.hero] = item.phase;
        if (item.phase === "lower" && battle.time - item.at >= 180) {
          const hero = battle.heroes.find((h) => h.id === item.hero),
            palm = handheldPoint(
              item,
              hero,
              handheldFrame(item, hero, battle.time),
              { width, height },
              battle.stage,
            );
          assert.ok(
            Math.abs(palm.x - item.point.x) < 1.5,
            JSON.stringify({ item, hero, palm, age: battle.time - item.at }),
          );
          assert.ok(Math.abs(palm.lane - item.point.lane) < 0.04);
        }
      }
      if (state.done["hilltop-picnic"] && battle.handheld.every((i) => i.phase === "held")) {
        if (!arrivedAt) {
          arrivedAt = state.updatedAt;
          arrivalPosition = {
            feet: battle.heroes.map((h) => [h.x, h.lane]),
            camera: battle.distance,
          };
        }
        if (state.updatedAt - arrivedAt > 10000) {
          battle.heroes.forEach((h, i) => {
            assert.ok(Math.abs(h.x - arrivalPosition.feet[i][0]) < 1.5);
            assert.ok(Math.abs(h.lane - arrivalPosition.feet[i][1]) < 0.02);
          });
          assert.ok(Math.abs(battle.distance - arrivalPosition.camera) < 1.5);
          finished = true;
          break;
        }
      }
      state = settle(state, state.updatedAt + 50);
    }
    assert.ok(finished);
    for (const id of ["aria", "leon"]) {
      for (const phase of ["held", "lower", "ground", "lift"]) assert.ok(seen[id].has(phase));
      assert.ok(cycles[id] >= expected, JSON.stringify({ cycles, expected }));
      assert.equal(strides[id].size, 4, "carrying uses all four distance-driven walking frames");
      assert.ok(
        lastDrops.get(id) > 2400,
        "lunch must travel with the party to the final encounter",
      );
    }
  });
