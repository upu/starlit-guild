import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { RPG_CAMERA_SCALE } from "../lib/rpg-camera.ts";
import { mossBedsLayout } from "../lib/road-moss-beds-layout.ts";
import { roadX, roadY } from "../lib/road-layout.ts";
import { seedlingBattleAssets, seedlingMerrillHeight } from "../lib/road-seedling-battle.ts";
import { fixedFigureScale } from "../lib/road-fixed-figure-scale.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { RoadSeedlingMelee } from "../lib/road-seedling-melee.ts";
import sharp from "sharp";

const quest = "merrill-seedlings";
function start() {
  let state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === quest),
    25,
    10000,
  );
  state = act(
    state,
    { type: "start", id: quest, readDeparture: true, value: false },
    state.updatedAt,
  );
  assert.equal(state.squads[0].run?.nodes, 1);
  return state;
}
function atSummon() {
  let state = start();
  for (let i = 0; i < 600; i++) {
    if (state.squads[0].run?.enemies?.[0]?.cue === "summon") return state;
    state = settle(state, state.updatedAt + 100);
  }
  assert.fail("Merrill did not summon the mushrooms");
}
const inputFor = (state) => ({
  squad: state.squads[0],
  now: state.updatedAt,
  startQuest: quest,
  ready: true,
});
const screen = (point, view) => ({
  x: roadX(point.x, 0, view.width),
  y: roadY(point.lane, view.height, view.width),
});

test("the encounter uses the same yard and places the baskets at the return scene's locations", () => {
  const state = atSummon(),
    input = storybookAdventureInput(inputFor(state));
  const view = { width: 936, height: 624 },
    layout = mossBedsLayout(view);
  const { battle, look } = chapterRoadFrame(input, false, 1400, view);
  const cue = studyCue("merrill-seedlings-return", 0, true);
  assert.equal(look.background, seedlingBattleAssets.yard);
  assert.equal(look.mossBeds.seedlings, true);
  for (const actor of cue.actors) {
    const hero = battle.heroes.find((value) => value.id === actor.id);
    assert.ok(hero, actor.id);
    const x = (0.5 * (1 - RPG_CAMERA_SCALE) + (RPG_CAMERA_SCALE * actor.x) / 100) * 1536;
    const y =
      (0.75 * (1 - RPG_CAMERA_SCALE) - 0.12 + RPG_CAMERA_SCALE * (1 - (actor.bottom ?? 14) / 100)) *
      1024;
    const expected = layout.project(x, y),
      actual = screen(hero, view);
    assert.ok(Math.abs(expected.x - actual.x) < 4 && Math.abs(expected.y - actual.y) < 4, actor.id);
  }
  const visitor = cue.extras.find((value) => value.id === "merrill");
  const merrill = battle.enemies.find((value) => value.kind === "merrill");
  const visitorX = (0.5 * (1 - RPG_CAMERA_SCALE) + (RPG_CAMERA_SCALE * visitor.x) / 100) * 1536;
  const visitorY =
    (0.75 * (1 - RPG_CAMERA_SCALE) - 0.12 + RPG_CAMERA_SCALE * (1 - visitor.bottom / 100)) * 1024;
  assert.ok(Math.abs(screen(merrill, view).x - layout.project(visitorX, visitorY).x) < 4);
  assert.ok(Math.abs(screen(merrill, view).y - layout.project(visitorX, visitorY).y) < 4);
  for (const id of ["covered-seedlings", "open-seedlings", "loading-reflector"]) {
    const item = cue.items.find((value) => value.id === id);
    const prop = battle.waterwayActions.props.find((value) => value.id === id);
    assert.ok(item && prop, id);
    const storyX = (0.5 * (1 - RPG_CAMERA_SCALE) + (RPG_CAMERA_SCALE * item.x) / 100) * 1536;
    const storyY =
      (0.75 * (1 - RPG_CAMERA_SCALE) - 0.12 + RPG_CAMERA_SCALE * (1 - item.bottom / 100)) * 1024;
    const expected = layout.project(storyX, storyY),
      actual = screen(prop.point, view);
    assert.ok(Math.abs(expected.x - actual.x) < 4, `${id} x`);
    assert.ok(Math.abs(expected.y - actual.y) < 4, `${id} y`);
  }
  const mushrooms = battle.enemies.filter((value) => value.kind === "mushroom");
  assert.equal(mushrooms.length, 4);
  for (const [index, enemy] of mushrooms.entries()) {
    const item = cue.items.find((value) => value.id === `korotake-${index}`);
    const x = (0.5 * (1 - RPG_CAMERA_SCALE) + (RPG_CAMERA_SCALE * item.x) / 100) * 1536;
    const y =
      (0.75 * (1 - RPG_CAMERA_SCALE) - 0.12 + RPG_CAMERA_SCALE * (1 - item.bottom / 100)) * 1024;
    const expected = layout.project(x, y),
      actual = screen(enemy, view);
    assert.ok(Math.abs(expected.x - actual.x) < 1 && Math.abs(expected.y - actual.y) < 1, item.id);
  }
});

test("the party and Merrill use the same cell scale in adventure and the return scene", () => {
  const state = atSummon();
  const cue = studyCue("merrill-seedlings-return", 0, true);
  for (const view of [
    { width: 936, height: 624 },
    { width: 390, height: 740 },
  ]) {
    const { look } = chapterRoadFrame(storybookAdventureInput(inputFor(state)), false, 1400, view);
    const layout = mossBedsLayout(view);
    const partyCell = 192 * 0.9 * layout.scale * fixedFigureScale(look, view);
    const expected = (cue.cell / 100) * RPG_CAMERA_SCALE;
    assert.ok(Math.abs(partyCell / layout.backdrop.width - expected) < 0.001);
    assert.ok(Math.abs(seedlingMerrillHeight(view) / partyCell - 84 / 128) < 1e-9);
  }
});

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 740 },
]) {
  test(`summoned mushrooms and effects keep separate destinations at ${view.width}px`, () => {
    const state = atSummon(),
      original = JSON.stringify(state);
    const input = storybookAdventureInput(inputFor(state));
    const { battle, look } = chapterRoadFrame(input, false, 1400, view);
    const merrill = battle.enemies.find((enemy) => enemy.kind === "merrill");
    const mushrooms = battle.enemies.filter((enemy) => enemy.kind === "mushroom");
    const throws = battle.effects.filter((effect) => effect.kind === "mushroomThrow");
    assert.equal(look.mossBeds.seedlings, true);
    assert.equal(battle.heroes.length, 5);
    assert.equal(mushrooms.length, 4);
    assert.equal(throws.length, 4);
    assert.equal(new Set(mushrooms.map((enemy) => `${enemy.x},${enemy.lane}`)).size, 4);
    for (const effect of throws) {
      assert.equal(effect.fromX, merrill.x);
      assert.equal(effect.fromLane, merrill.lane);
      assert.ok(mushrooms.some((enemy) => enemy.x === effect.x && enemy.lane === effect.lane));
    }
    for (const actor of [...battle.heroes, ...battle.enemies]) {
      const point = screen(actor, view);
      assert.ok(point.x > 0 && point.x < view.width, `${actor.id} x`);
      assert.ok(point.y > 0 && point.y < view.height, `${actor.id} y`);
    }
    assert.equal(JSON.stringify(state), original);
  });
}

test("explicit art comparisons retain precedence", () => {
  const state = start(),
    input = inputFor(state);
  assert.equal(
    storybookAdventureInput({ ...input, backgroundOverride: "/custom.png" }).backgroundOverride,
    "/custom.png",
  );
  const disabled = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(disabled), disabled);
});

test("the visible song extends Merrill's playing pose without changing saved battle state", () => {
  const state = atSummon(),
    original = JSON.stringify(state);
  const input = storybookAdventureInput(inputFor(state));
  const view = { width: 936, height: 624 };
  const render = (merrillSinging) =>
    chapterRoadFrame({ ...input, merrillSinging }, false, 1400, view);
  assert.equal(
    render(false).battle.enemies.find((enemy) => enemy.kind === "merrill").action,
    "summon",
  );
  assert.equal(
    render(true).battle.enemies.find((enemy) => enemy.kind === "merrill").action,
    "song",
  );
  assert.equal(JSON.stringify(state), original);
  state.squads[0].run.enemies[0].hp = 0;
  assert.notEqual(
    render(true).battle.enemies.find((enemy) => enemy.kind === "merrill").action,
    "song",
  );
});

test("each song effect retains its target after the fixed scene is laid out", () => {
  let state = atSummon();
  for (let i = 0; i < 200 && state.squads[0].run?.enemies?.[0]?.cue !== "song"; i++)
    state = settle(state, state.updatedAt + 100);
  assert.equal(state.squads[0].run?.enemies?.[0]?.cue, "song");
  for (const view of [
    { width: 936, height: 624 },
    { width: 390, height: 740 },
  ]) {
    const { battle } = chapterRoadFrame(
      storybookAdventureInput(inputFor(state)),
      false,
      1400,
      view,
    );
    const songs = battle.effects.filter((effect) => effect.kind === "song");
    assert.equal(songs.length, 5);
    for (const enemy of battle.enemies) {
      assert.equal(
        songs.filter((effect) => effect.x === enemy.x && effect.lane === enemy.lane).length,
        1,
      );
    }
  }
});

test("a delayed melee hit changes the drawn health and fallen pose at the visible strike", () => {
  const state = atSummon();
  const view = { width: 936, height: 624 },
    controller = new RoadSeedlingMelee();
  const base = chapterRoadFrame(storybookAdventureInput(inputFor(state)), false, 1400, view);
  const target = base.battle.enemies.find((enemy) => enemy.kind === "mushroom");
  const hero = base.battle.heroes.find((item) => item.id === "finn");
  const frameAt = (time, health) => ({
    ...base,
    look: { ...base.look, mossBeds: { ...base.look.mossBeds } },
    battle: {
      ...base.battle,
      time,
      enemies: base.battle.enemies.map((enemy) =>
        enemy.id === target.id
          ? { ...enemy, hp: health, pose: health ? undefined : "fallen" }
          : { ...enemy },
      ),
      effects: [
        {
          id: 1837,
          at: 5000,
          kind: "slash",
          hero: "finn",
          amount: 15,
          x: target.x,
          lane: target.lane,
          fromX: hero.x,
          fromLane: hero.lane,
        },
      ],
    },
  });
  for (const health of [20, 0]) {
    const key = `health-${health}`;
    const initial = frameAt(5000, health),
      original = JSON.stringify(initial);
    const pre = controller.prepare(initial, key, view);
    assert.equal(pre.battle.enemies.find((enemy) => enemy.id === target.id).hp, health + 15);
    assert.equal(pre.battle.enemies.find((enemy) => enemy.id === target.id).pose, undefined);
    controller.finish(pre.battle, pre.look, view);
    if (health) {
      const otherHit = controller.prepare(frameAt(5100, 10), key, view);
      assert.equal(otherHit.battle.enemies.find((enemy) => enemy.id === target.id).hp, 25);
      const healing = controller.prepare(frameAt(5120, target.maxHp - 5), key, view);
      assert.equal(healing.battle.enemies.find((enemy) => enemy.id === target.id).hp, target.maxHp);
    }
    const beforeImpact = controller.prepare(frameAt(5149, health), key, view);
    assert.equal(
      beforeImpact.battle.enemies.find((enemy) => enemy.id === target.id).hp,
      health + 15,
    );
    const impact = controller.prepare(frameAt(5150, health), key, view);
    const drawn = impact.battle.enemies.find((enemy) => enemy.id === target.id);
    assert.equal(drawn.hp, health);
    assert.equal(drawn.pose, health ? undefined : "fallen");
    assert.equal(JSON.stringify(initial), original);
  }
});

test("queued consecutive strikes release only their own displayed damage", () => {
  const state = atSummon(),
    view = { width: 936, height: 624 };
  const base = chapterRoadFrame(storybookAdventureInput(inputFor(state)), false, 1400, view);
  const target = base.battle.enemies.find((enemy) => enemy.kind === "mushroom");
  const hero = base.battle.heroes.find((item) => item.id === "finn");
  const controller = new RoadSeedlingMelee();
  const frameAt = (time) => ({
    ...base,
    look: { ...base.look, mossBeds: { ...base.look.mossBeds } },
    battle: {
      ...base.battle,
      time,
      enemies: base.battle.enemies.map((enemy) =>
        enemy.id === target.id ? { ...enemy, hp: 20 } : { ...enemy },
      ),
      effects: [15, 7].map((amount, index) => ({
        id: 2000 + index,
        at: 5000 + index,
        kind: "slash",
        hero: "finn",
        amount,
        x: target.x,
        lane: target.lane,
        fromX: hero.x,
        fromLane: hero.lane,
      })),
    },
  });
  const draw = (time) => controller.prepare(frameAt(time), "two-strikes", view);
  const first = draw(5000);
  assert.equal(first.battle.enemies.find((enemy) => enemy.id === target.id).hp, 42);
  controller.finish(first.battle, first.look, view);
  assert.equal(draw(5150).battle.enemies.find((enemy) => enemy.id === target.id).hp, 27);
  const second = draw(5600);
  controller.finish(second.battle, second.look, view);
  assert.equal(draw(5749).battle.enemies.find((enemy) => enemy.id === target.id).hp, 27);
  assert.equal(draw(5750).battle.enemies.find((enemy) => enemy.id === target.id).hp, 20);
});

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 740 },
]) {
  test(`melee approaches its target before the strike and returns after the fight at ${view.width}px`, () => {
    let state = start();
    const motion = new RoadMotion(),
      key = "seedling-melee";
    const render = (now, closing = false) => {
      const input = storybookAdventureInput({ ...inputFor(state), now, seedlingsClosing: closing });
      return motion.update(
        chapterRoadFrame(input, false, 1400, view),
        key,
        view.width,
        false,
        view.height,
      );
    };
    const initial = render(state.updatedAt);
    const before = JSON.stringify(state);
    let strikes = 0,
      walked = false;
    for (let now = state.updatedAt + 50; now <= 14000; now += 50) {
      if (now - state.updatedAt >= 100) state = settle(state, now);
      const { battle } = render(now);
      if (battle.heroes.some((hero) => ["leon", "finn"].includes(hero.id) && hero.walking))
        walked = true;
      if (now >= 4000) {
        const leon = screen(
          battle.heroes.find((hero) => hero.id === "leon"),
          view,
        );
        const lico = screen(
          battle.heroes.find((hero) => hero.id === "lico"),
          view,
        );
        const finn = screen(
          battle.heroes.find((hero) => hero.id === "finn"),
          view,
        );
        const figure = mossBedsLayout(view).figureSize * fixedFigureScale(initial.look, view);
        assert.ok(
          Math.abs(leon.x - finn.x) >= figure * 0.35 || Math.abs(leon.y - finn.y) >= figure * 0.8,
          `Leon and Finn overlap at ${now}: ${JSON.stringify({ leon, finn, figure })}`,
        );
        assert.ok(Math.abs(leon.x - lico.x) > 55 * mossBedsLayout(view).scale);
      }
      for (const effect of battle.effects.filter(
        (item) => item.kind === "slash" && ["leon", "finn"].includes(item.hero),
      )) {
        const hero = battle.heroes.find((item) => item.id === effect.hero);
        const enemy = battle.enemies.find(
          (item) => item.x === effect.x && item.lane === effect.lane,
        );
        assert.ok(hero && enemy && !hero.walking);
        const a = screen(hero, view),
          b = screen(enemy, view);
        assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 175 * mossBedsLayout(view).scale);
        strikes++;
      }
    }
    assert.ok(walked && strikes > 0);
    const serialized = JSON.stringify(state);
    let closing;
    const facesReturn = new Set();
    for (let now = 14050; now < 21000; now += 50) {
      closing = render(now, true);
      const leon = screen(
        closing.battle.heroes.find((hero) => hero.id === "leon"),
        view,
      );
      const lico = screen(
        closing.battle.heroes.find((hero) => hero.id === "lico"),
        view,
      );
      const figure = mossBedsLayout(view).figureSize * fixedFigureScale(closing.look, view);
      assert.ok(
        Math.abs(leon.x - lico.x) >= figure * 0.4 || Math.abs(leon.y - lico.y) >= figure * 0.8,
        `Leon and Lico must not overlap while returning: ${now}, ${JSON.stringify({ leon, lico, figure })}`,
      );
      for (const hero of closing.battle.heroes)
        if (
          hero.walking &&
          ((["leon", "finn"].includes(hero.id) && hero.facing === -1) ||
            (hero.id === "lico" && hero.facing === 1))
        )
          facesReturn.add(hero.id);
      if (closing.look.mossBeds.visualComplete) break;
    }
    assert.equal(closing.look.mossBeds.visualComplete, true);
    assert.deepEqual([...facesReturn].sort(), ["finn", "leon", "lico"]);
    for (const id of ["leon", "finn", "lico"]) {
      const home = screen(
        initial.battle.heroes.find((hero) => hero.id === id),
        view,
      );
      const returned = screen(
        closing.battle.heroes.find((hero) => hero.id === id),
        view,
      );
      assert.ok(Math.hypot(home.x - returned.x, home.y - returned.y) < 10);
    }
    assert.equal(JSON.stringify(state), serialized, "the visual return does not mutate the save");
    assert.notEqual(serialized, before, "the test really advanced combat");
  });
}

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 740 },
])
  for (const disabled of ["leon", "lico"]) {
    test(`the other character can return when ${disabled} is incapacitated at ${view.width}px`, () => {
      const state = atSummon();
      state.squads[0].run.health[disabled].hp = 0;
      const original = JSON.stringify(state);
      const motion = new RoadMotion();
      const base = storybookAdventureInput(inputFor(state));
      const draw = (time, closing = false) =>
        motion.update(
          chapterRoadFrame({ ...base, now: time, seedlingsClosing: closing }, false, 1400, view),
          "disabled-seedling-return",
          view.width,
          false,
          view.height,
        );
      for (let i = 0; i < 120; i++) draw(state.updatedAt + i * 50);
      let last;
      for (let i = 120; i < 260; i++) {
        last = draw(state.updatedAt + i * 50, true);
        if (last.look.mossBeds.visualComplete) break;
      }
      assert.equal(last.look.mossBeds.visualComplete, true);
      const other = disabled === "leon" ? "lico" : "leon";
      const raw = chapterRoadFrame({ ...base, seedlingsClosing: true }, false, 1400, view);
      const target = screen(
        raw.battle.heroes.find((hero) => hero.id === other),
        view,
      );
      const actual = screen(
        last.battle.heroes.find((hero) => hero.id === other),
        view,
      );
      assert.ok(
        Math.hypot(actual.x - target.x, actual.y - target.y) < 10,
        `${other} did not return`,
      );
      assert.equal(JSON.stringify(state), original);
    });
  }

test("defeated mushrooms remain visible in their battle positions and return as resting figures", async () => {
  const state = atSummon(),
    run = state.squads[0].run;
  run.enemies[1].hp = 0;
  const view = { width: 936, height: 624 };
  const before = JSON.stringify(state);
  const { battle } = chapterRoadFrame(storybookAdventureInput(inputFor(state)), false, 1400, view);
  const mushroom = battle.enemies.find((enemy) => enemy.id === 2);
  assert.equal(mushroom.pose, "fallen");
  assert.equal(mushroom.hp, 0);
  assert.equal(
    battle.enemies.filter((enemy) => enemy.kind === "mushroom" && !enemy.pose).length,
    3,
  );
  const cue = studyCue("merrill-seedlings-return", 0, true);
  assert.equal(cue.items.filter((item) => item.art === "korotake-rest").length, 4);
  const { data, info } = await sharp(`public${seedlingBattleAssets.korotakeRest}`)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 256);
  assert.equal(info.height, 256);
  assert.equal(data[3], 0, "no opaque background");
  assert.equal(JSON.stringify(state), before);
});

test("Merrill remains at the yard after her own HP is exhausted while mushrooms are active", () => {
  const state = atSummon();
  state.squads[0].run.enemies[0].hp = 0;
  const original = JSON.stringify(state),
    view = { width: 936, height: 624 };
  const { battle } = chapterRoadFrame(storybookAdventureInput(inputFor(state)), false, 1400, view);
  const merrill = battle.enemies.find((enemy) => enemy.kind === "merrill");
  assert.equal(merrill.hp, 0);
  assert.equal(
    merrill.pose,
    "retreat",
    "the renderer keeps the figure visible without a living HP bar",
  );
  assert.equal(merrill.action, undefined);
  assert.equal(
    battle.enemies.filter((enemy) => enemy.kind === "mushroom" && enemy.hp > 0).length,
    4,
  );
  assert.equal(JSON.stringify(state), original);
});
