import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { roadX, roadY } from "../lib/road-layout.ts";
import { enemyDisplayHeight } from "../lib/road-enemy-layout.ts";
import { blockadeAssets, blockadeGatheredFoot } from "../lib/road-blockade-layout.ts";
import { blockadeSceneFoot } from "../lib/road-blockade-path.ts";
import { fixedRoadLayout } from "../lib/road-fixed-layout.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";

test("workshop default preserves comparison overrides and the cold completed group", () => {
  const state = testState(1000, 37, 18, 10000);
  const input = {
    squad: state.squads[0],
    startQuest: "sweet-blockade",
    now: 1000,
    ready: true,
    questComplete: true,
  };
  const painted = storybookAdventureInput(input);
  assert.equal(painted.squad, input.squad);
  assert.equal(painted.backgroundOverride, blockadeAssets.bank);
  const off = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(off), off);
  assert.equal(
    storybookAdventureInput({ ...input, backgroundOverride: "/custom.png" }).backgroundOverride,
    "/custom.png",
  );
  for (const width of [374, 936]) {
    const height = (width * 2) / 3,
      raw = chapterRoadFrame(painted, false, 1400, { width, height });
    const { battle: b } = new RoadMotion().update(raw, "cold", width, false, height);
    assert.equal(b.waterwayActions.actors.length, 3);
    assert.equal(b.waterwayActions.props.length, 5);
    for (const h of b.heroes)
      assert.ok(roadY(h.lane, height, width) <= height - 8, `${h.id} clips`);
  }
});

for (const width of [374, 936])
  test(`workshop keeps its table and honey through three encounters and gathering at ${width}`, () => {
    const height = (width * 2) / 3,
      motion = new RoadMotion(),
      props = new Map(),
      scenes = new Set(),
      nodes = new Set();
    let s = act(
        testState(1000, 15, 18, 10000),
        { type: "start", id: "sweet-blockade", readDeparture: true, value: false },
        1000,
      ),
      identity,
      arrival = false;
    for (let i = 0; i < 5000; i++) {
      const before = JSON.stringify(s),
        input = {
          squad: s.squads[0],
          startQuest: "sweet-blockade",
          now: s.updatedAt,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: blockadeAssets.bank,
          questComplete: !!s.done["sweet-blockade"],
        };
      const raw = chapterRoadFrame(input, false, 1400, { width, height });
      identity = roadPaintKey("shop", s.squads[0].run ?? null, raw.look, identity);
      const { battle: b, look } = motion.update(raw, identity.key, width, false, height);
      if (!b.scene)
        for (const enemy of b.enemies) {
          assert.ok(
            roadX(enemy.x, 0, width) + enemyDisplayHeight(enemy, width, height) * 0.6 < width - 4,
            `${enemy.kind} clips on the right`,
          );
        }
      assert.equal(JSON.stringify(s), before);
      assert.equal(b.distance, 0);
      assert.equal(b.stage, "forest");
      assert.equal(b.journeyCart, undefined);
      assert.equal(look.puller, null);
      assert.deepEqual(look.frontCarriers, []);
      nodes.add(look.blockade.node);
      if (b.scene) scenes.add(b.scene);
      assert.equal(b.waterwayActions.props.length, 5);
      for (const p of b.waterwayActions.props) {
        if (props.has(p.id)) assert.deepEqual(p, props.get(p.id));
        else props.set(p.id, p);
      }
      for (const hero of b.heroes)
        assert.ok(
          roadY(hero.lane, height, width) <= height - 8,
          JSON.stringify({ hero, time: s.updatedAt, node: look.blockade.node, crew: b.heroes }),
        );
      for (const shot of b.effects.filter((e) => ["slash", "arrow", "magic"].includes(e.kind)))
        assert.ok(b.enemies.some((e) => e.x === shot.x && e.lane === shot.lane));
      if (!s.squads[0].run) {
        assert.equal(b.waterwayActions.actors.length, 3);
        for (const actor of b.waterwayActions.actors) {
          const kind = actor.id.slice(8),
            foot = blockadeGatheredFoot(kind);
          assert.deepEqual(actor.point, fixedRoadLayout(width, height).world(foot.x, foot.y));
        }
        arrival = true;
        break;
      }
      s = settle(s, s.updatedAt + 50);
    }
    assert.ok(arrival);
    assert.equal(nodes.size, 3);
    assert.deepEqual([...scenes].sort(), ["enter", "escape", "withdraw"]);
  });

test("retreat paths avoid the bench footprint and end at the waiting group", () => {
  for (const kind of ["golem", "puppet", "pumpety"]) {
    const enemy = { kind };
    for (const scene of ["enter", "withdraw", "escape"])
      for (let i = 0; i <= 200; i++) {
        const foot = blockadeSceneFoot(enemy, 0, scene, i / 200);
        assert.ok(
          !(foot.x > 1120 && foot.x < 1360 && foot.y > 640 && foot.y < 690),
          `${kind}:${scene}:${JSON.stringify(foot)}`,
        );
      }
    assert.deepEqual(blockadeSceneFoot(enemy, 0, "escape", 1), blockadeGatheredFoot(kind));
  }
});
