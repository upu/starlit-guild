import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { signpostAssets as assets, signpostBase } from "../lib/road-signpost.ts";
import { fixedRoadLayout } from "../lib/road-fixed-layout.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { roadY } from "../lib/road-layout.ts";

test("fork default keeps comparison OFF, custom backgrounds and a cold completed sign", () => {
  const s = testState(1000, 37, 18, 10000);
  const input = {
    squad: s.squads[0],
    startQuest: "spinning-signpost",
    now: 1000,
    ready: true,
    questComplete: true,
  };
  const painted = storybookAdventureInput(input);
  assert.equal(painted.backgroundOverride, assets.bank);
  assert.equal(painted.squad, input.squad);
  const off = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(off), off);
  const custom = storybookAdventureInput({ ...input, backgroundOverride: "/custom.png" });
  assert.equal(custom.backgroundOverride, "/custom.png");
  for (const width of [374, 936]) {
    const height = (width * 2) / 3;
    const raw = chapterRoadFrame(painted, false, 1400, { width, height });
    const frame = new RoadMotion().update(raw, "completed-fork", width, false, height);
    assert.equal(frame.battle.heroes.length, 5);
    for (const hero of frame.battle.heroes) {
      assert.ok(Number.isFinite(hero.x) && Number.isFinite(hero.lane));
      assert.ok(roadY(hero.lane, height, width) <= height - 8, `${hero.id} clips`);
    }
    const props = frame.battle.waterwayActions.props;
    assert.equal(props.length, 4);
    const sign = props.find((p) => p.id === "fork-signpost");
    assert.equal(sign.origin, undefined);
    assert.deepEqual(
      sign.point,
      fixedRoadLayout(width, height).world(signpostBase.x, signpostBase.y),
    );
    assert.equal(frame.battle.waterwayActions.actors, undefined);
  }
});

for (const width of [374, 936])
  test(`fixed fork keeps three parcels and one sign through all nine points at ${width}`, () => {
    const height = (width * 2) / 3,
      view = { width, height },
      motion = new RoadMotion();
    let s = act(
        testState(1000, 13, 18, 10000),
        { type: "start", id: "spinning-signpost", readDeparture: true, value: false },
        1000,
      ),
      identity;
    const seen = new Set(),
      walk = new Set(),
      turn = new Set(),
      bags = new Map();
    let planted = 0,
      wasHeld = false,
      last,
      completed = false;
    for (let i = 0; i < 20000; i++) {
      const saved = JSON.stringify(s),
        input = {
          squad: s.squads[0],
          startQuest: "spinning-signpost",
          now: s.updatedAt,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: assets.bank,
          questComplete: !!s.done["spinning-signpost"],
        };
      const raw = chapterRoadFrame(input, false, 1400, view);
      identity = roadPaintKey("fork", s.squads[0].run ?? null, raw.look, identity);
      const { battle: b, look } = motion.update(raw, identity.key, width, false, height);
      assert.equal(JSON.stringify(s), saved);
      assert.equal(b.stage, "forest");
      assert.equal(b.distance, 0);
      assert.equal(look.puller, null);
      assert.deepEqual(look.frontCarriers, []);
      assert.equal(b.journeyCart, undefined);
      const props = b.waterwayActions.props;
      assert.equal(props.length, 4);
      const sign = props.find((p) => p.id === "fork-signpost");
      assert.ok(sign);
      for (const bag of props.filter((p) => p.id !== "fork-signpost")) {
        if (bags.has(bag.id)) assert.deepEqual(bag.point, bags.get(bag.id));
        else bags.set(bag.id, { ...bag.point });
      }
      seen.add(look.signpost.node);
      const pose = b.waterwayActions.poses.leon;
      if (pose?.asset === assets.walk) walk.add(pose.frame);
      if (pose?.asset === assets.turn) turn.add(pose.frame);
      const held = look.signpost.node % 3 === 2 && sign.origin;
      if (wasHeld && !held) {
        planted++;
        assert.deepEqual(
          sign.point,
          fixedRoadLayout(width, height).world(signpostBase.x, signpostBase.y),
        );
      }
      wasHeld = held;
      last = { battle: b, look };
      if (s.done["spinning-signpost"] && planted === 3) {
        completed = true;
        break;
      }
      s = settle(s, s.updatedAt + 50);
    }
    assert.ok(
      completed,
      JSON.stringify({
        node: s.squads[0].run?.node,
        seen: [...seen],
        walk: [...walk],
        turn: [...turn],
        planted,
        last,
      }),
    );
    assert.equal(seen.size, 9, JSON.stringify([...seen]));
    assert.equal(walk.size, 4);
    assert.equal(turn.size, 4);
    assert.equal(bags.size, 3);
  });

test("fixed fork projects attacks to the moved enemy instead of saved road coordinates", () => {
  let s = act(
      testState(1000, 13, 18, 10000),
      { type: "start", id: "spinning-signpost", readDeparture: true, value: false },
      1000,
    ),
    checked = false;
  for (let i = 0; i < 10000; i++) {
    const { battle } = chapterRoadFrame(
      {
        squad: s.squads[0],
        startQuest: "spinning-signpost",
        now: s.updatedAt,
        ready: true,
        storybookHeroes: true,
        backgroundOverride: assets.bank,
      },
      false,
      1400,
      { width: 936, height: 624 },
    );
    const shot = battle.effects.find((e) => ["arrow", "slash", "magic"].includes(e.kind));
    if (shot) {
      assert.ok(battle.enemies.some((e) => e.x === shot.x && e.lane === shot.lane));
      checked = true;
      break;
    }
    s = settle(s, s.updatedAt + 50);
  }
  assert.ok(checked);
});
