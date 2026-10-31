import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { golemDefenseAssets as assets } from "../lib/road-golem-defense.ts";
import { roadX, roadY } from "../lib/road-layout.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";

test("golem defence default uses the reviewed ground and retains explicit overrides", () => {
  const input = { squad: { run: { quest: "begging-golem" } }, now: 1000 };
  assert.equal(storybookAdventureInput(input).backgroundOverride, assets.bank);
  assert.equal(storybookAdventureInput(input).squad, input.squad);
  const off = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(off), off);
  assert.equal(
    storybookAdventureInput({ ...input, backgroundOverride: "/custom.png" }).backgroundOverride,
    "/custom.png",
  );
});

test("replaying 2-6 after chapter four still starts its authored three-person crew", () => {
  const state = act(
    testState(1000, 37, 18, 10000),
    { type: "start", id: "begging-golem", readDeparture: true, value: false },
    1000,
  );
  assert.deepEqual(state.squads[0].members, ["aria", "leon", "mira"]);
  assert.deepEqual(
    state.squads[0].run.actors.map((a) => a.hero),
    ["aria", "leon", "mira"],
  );
});

for (const width of [374, 936])
  test(`three defence encounters share fixed parcels, depth and impact contacts at ${width}`, () => {
    const height = (width * 2) / 3,
      motion = new RoadMotion(),
      bags = new Map(),
      nodes = new Set();
    let s = act(
      testState(1000, 14, 18, 10000),
      { type: "start", id: "begging-golem", readDeparture: true, value: false },
      1000,
    );
    let both = false,
      impact = false,
      arrived = false;
    for (let i = 0; i < 10000; i++) {
      const before = JSON.stringify(s);
      const raw = chapterRoadFrame(
        {
          squad: s.squads[0],
          startQuest: "begging-golem",
          now: s.updatedAt,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: assets.bank,
        },
        false,
        1400,
        { width, height },
      );
      const { battle: b, look } = motion.update(raw, "defense", width, false, height);
      assert.equal(JSON.stringify(s), before);
      assert.equal(b.stage, "forest");
      assert.equal(b.distance, 0);
      assert.equal(look.puller, null);
      assert.deepEqual(look.frontCarriers, []);
      assert.equal(b.journeyCart, undefined);
      for (const hero of b.heroes) {
        assert.ok(roadY(hero.lane, height, width) <= height - 8, `${hero.id} clips during combat`);
      }
      nodes.add(look.defense.node);
      for (const p of b.waterwayActions.props) {
        assert.ok(roadY(p.point.lane, height, width) <= height - 7, `${p.id} clips at the bottom`);
        if (bags.has(p.id)) assert.deepEqual(p, bags.get(p.id));
        else bags.set(p.id, p);
      }
      assert.equal(bags.size, 3);
      const golem = b.enemies.find((e) => e.kind === "golem"),
        puppet = b.enemies.find((e) => e.kind === "puppet");
      if (golem && puppet) {
        assert.ok(golem.lane < puppet.lane);
        both = true;
      }
      for (const shot of b.effects.filter((e) => ["slash", "arrow", "magic"].includes(e.kind))) {
        assert.ok(b.enemies.some((e) => e.x === shot.x && e.lane === shot.lane));
        impact = true;
      }
      if (s.done["begging-golem"]) {
        arrived = true;
        break;
      }
      s = settle(s, s.updatedAt + 50);
    }
    assert.ok(arrived);
    assert.equal(nodes.size, 3);
    assert.ok(both);
    assert.ok(impact);
  });

test("five-person revisit feet and luggage keep a bottom margin on both widths", () => {
  const state = testState(1000, 37, 18, 10000);
  for (const width of [374, 936]) {
    const height = (width * 2) / 3;
    const raw = chapterRoadFrame(
      {
        squad: state.squads[0],
        startQuest: "begging-golem",
        now: 1000,
        ready: true,
        storybookHeroes: true,
        backgroundOverride: assets.bank,
      },
      false,
      1400,
      { width, height },
    );
    const { battle: b } = new RoadMotion().update(raw, "five", width, false, height);
    assert.equal(b.heroes.length, 5);
    for (const h of b.heroes) {
      assert.ok(roadY(h.lane, height, width) <= height - 8, `${h.id} clips`);
      assert.ok(roadX(h.x, 0, width) >= 20);
    }
  }
});

test("comparison and other locations do not acquire fixed defence props", () => {
  const state = testState(1000, 14, 18, 10000);
  for (const input of [
    { storybookHeroes: false, backgroundOverride: assets.bank },
    { storybookHeroes: true, backgroundOverride: "/custom.png" },
  ]) {
    const frame = chapterRoadFrame({
      squad: state.squads[0],
      startQuest: "begging-golem",
      now: 1000,
      ready: true,
      ...input,
    });
    assert.equal(frame.look.defense, undefined);
  }
});
