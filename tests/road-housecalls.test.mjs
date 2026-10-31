import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { housecallsAssets, housecallsLayout } from "../lib/road-housecalls-layout.ts";
import { roadX, roadY } from "../lib/road-layout.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";

for (const width of [374, 936])
  test(`three-house visit keeps all15 jobs, scale and saves at ${width}`, () => {
    const height = (width * 2) / 3,
      motion = new RoadMotion(),
      nodes = new Set(),
      poses = new Set();
    let s = act(
        testState(1000, 37, 18, 10000),
        { type: "start", id: "waiting-households", readDeparture: true, value: false },
        1000,
      ),
      identity;
    let arrived = false;
    for (let i = 0; i < 3800; i++) {
      const before = JSON.stringify(s);
      const raw = chapterRoadFrame(
        {
          squad: s.squads[0],
          startQuest: "waiting-households",
          now: s.updatedAt,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: housecallsAssets.bank,
          questComplete: !!s.done["waiting-households"],
        },
        false,
        1400,
        { width, height },
      );
      identity = roadPaintKey("housecalls", s.squads[0].run ?? null, raw.look, identity);
      const { battle: b, look } = motion.update(raw, identity.key, width, false, height);
      assert.equal(JSON.stringify(s), before);
      assert.equal(b.distance, 0);
      assert.equal(b.enemies.length, 0);
      assert.equal(b.journeyCart, undefined);
      assert.equal(look.puller, null);
      assert.deepEqual(look.frontCarriers, []);
      nodes.add(look.housecalls.node);
      const scene = b.waterwayActions;
      for (let delivered = 0; delivered < Math.floor(look.housecalls.node / 5); delivered++) {
        assert.ok(scene.props.some((p) => p.id === `parcel-${String(delivered * 5)}`));
        assert.ok(scene.props.some((p) => p.id === `water-${String(delivered * 5 + 1)}`));
      }
      assert.equal(scene.actors.length, 3);
      assert.equal(new Set(scene.props.map((p) => p.id)).size, scene.props.length);
      const layout = housecallsLayout({ width, height });
      for (const h of b.heroes) {
        const x = roadX(h.x, 0, width),
          y = roadY(h.lane, height, width);
        assert.ok(
          x > layout.figureSize * 0.3 && x < width - layout.figureSize * 0.3,
          `${h.id} side clip`,
        );
        assert.ok(y > layout.figureSize && y < height - 8, `${h.id} head/feet clip`);
        const sourceX = (x - layout.backdrop.x) / layout.scale,
          sourceY = (y - layout.backdrop.y) / layout.scale;
        assert.ok(
          !(sourceX > 845 && sourceX < 1075 && sourceY > 477 && sourceY < 533),
          `${h.id} walks through bench legs at ${sourceX},${sourceY}`,
        );
        const pose = scene.poses[h.id];
        if (h.walking && pose) poses.add(pose.asset + ":" + pose.frame);
      }
      if (!s.squads[0].run) arrived = true;
      s = settle(s, s.updatedAt + 50);
    }
    assert.equal(arrived, true);
    assert.deepEqual(
      [...nodes],
      Array.from({ length: 15 }, (_, i) => i),
    );
    for (let f = 0; f < 4; f++)
      assert.ok(poses.has(housecallsAssets.leonWalk + ":" + f), `missing carry stride${f}`);
  });

test("unregistered and explicit comparison scenes retain their existing camera", () => {
  const state = testState(1000, 37, 18, 10000);
  for (const extra of [
    { storybookHeroes: false, backgroundOverride: housecallsAssets.bank },
    { storybookHeroes: true, backgroundOverride: "/custom.png" },
  ]) {
    const f = chapterRoadFrame({
      squad: state.squads[0],
      startQuest: "waiting-households",
      now: 1000,
      ready: true,
      ...extra,
    });
    assert.equal(f.look.housecalls, undefined);
  }
});

test("reopening a completed visit keeps delivered supplies at all three homes", () => {
  const s = testState(1000, 37, 18, 10000),
    width = 374,
    height = (width * 2) / 3;
  const raw = chapterRoadFrame(
    {
      squad: s.squads[0],
      startQuest: "waiting-households",
      now: 1000,
      ready: true,
      questComplete: true,
      storybookHeroes: true,
      backgroundOverride: housecallsAssets.bank,
    },
    false,
    1400,
    { width, height },
  );
  const f = new RoadMotion().update(raw, "cold", width, false, height);
  const props = f.battle.waterwayActions.props;
  assert.equal(props.filter((p) => p.id.startsWith("parcel-")).length, 3);
  assert.equal(props.filter((p) => p.id.startsWith("water-")).length, 3);
  assert.equal(props.filter((p) => p.id === "returned-bottles").length, 1);
});

test("the complete courtyard is enabled by default and retains explicit choices", () => {
  const s = testState(1000, 37, 18, 10000),
    input = { squad: s.squads[0], startQuest: "waiting-households", now: 1000, ready: true };
  const painted = storybookAdventureInput(input);
  assert.equal(painted.squad, input.squad);
  assert.equal(painted.backgroundOverride, housecallsAssets.bank);
  assert.equal(painted.storybookHeroes, true);
  const off = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(off), off);
  assert.equal(
    storybookAdventureInput({ ...input, backgroundOverride: "/custom.png" }).backgroundOverride,
    "/custom.png",
  );
});
