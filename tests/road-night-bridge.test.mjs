import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { act, settle, testState } from "../lib/game.ts";
import { LUNCH_INTERLUDE } from "../lib/chapter-three.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { nightBridgeAssets, RoadNightBridge } from "../lib/road-night-bridge.ts";
import { nightPortraitBackdrop } from "../lib/road-night-portrait.ts";
import {
  housecallsLayout,
  nightBridgeBackdrop,
  nightBridgeLayout,
} from "../lib/road-housecalls-layout.ts";
import {
  roadDepth,
  roadFigureDepth,
  roadHeroSize,
  roadScale,
  roadX,
  roadY,
} from "../lib/road-layout.ts";
import { nightPushReady } from "../app/sprite-lab/storybook/adventure-review-points.ts";
import {
  chapterThreeBanter,
  nightBridgeBanterContext,
  nightBridgeWheelCue,
} from "../lib/chapter-three-banter.ts";
import { startBanter, switchBanter } from "../lib/banter-exchange.ts";

test("portrait night backgrounds are complete and match their source files", async () => {
  for (const name of ["night-road", "bridge-approach", "bridge-arrival"]) {
    const filename = `${name}-portrait-v1.png`;
    const source = await readFile(`assets/source/storybook/${filename}`);
    const published = await readFile(`public/storybook-study/${filename}`);
    assert.deepEqual(published, source);
    const metadata = await sharp(published).metadata();
    assert.equal(metadata.width, 1024);
    assert.equal(metadata.height, 1536);
  }
});

test("night-road battle dialogue follows living enemies rather than the node number", () => {
  const run = { quest: "keystone-night-road", node: 1, phase: "move", enemies: [] };
  assert.equal(nightBridgeBanterContext(run), "road");
  let exchange = startBanter(chapterThreeBanter(run));
  assert.match(exchange.lines[0].text, /その手/);
  const fight = { ...run, enemies: [{ hp: 1 }] };
  assert.equal(nightBridgeBanterContext(fight), "battle");
  exchange = switchBanter(exchange, chapterThreeBanter(fight));
  assert.match(exchange.lines[0].text, /魔物/);
  const after = { ...fight, enemies: [{ hp: 0 }] };
  assert.equal(nightBridgeBanterContext(after), "road");
  exchange = switchBanter(exchange, chapterThreeBanter(after));
  assert.doesNotMatch(exchange.lines[0].text, /魔物/);
  assert.match(exchange.history[1].text, /魔物/);
  assert.equal(nightBridgeBanterContext({ ...after, node: 6 }), "bridge");
  assert.equal(nightBridgeBanterContext({ ...fight, phase: "rest" }), "rest");
  assert.equal(nightBridgeBanterContext({ ...fight, quest: "berne-road" }), null);
});

for (const width of [374, 936])
  test(`Leon walks toward the wheel only after his matching dialogue at ${width}`, () => {
    const view = { width, height: (width * 2) / 3 },
      motion = new RoadMotion();
    let state = act(
      act(testState(1000, 25, 40, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
      { type: "start", id: "keystone-night-road", readDeparture: true, value: false },
      1000,
    );
    for (
      let i = 0;
      i < 5000 &&
      state.squads[0].run &&
      (state.squads[0].run.node < 7 || state.squads[0].run.enemies?.some((e) => e.hp > 0));
      i++
    )
      state = settle(state, state.updatedAt + 100);
    const run = state.squads[0].run;
    assert.ok(run && run.node >= 7 && !run.enemies?.some((e) => e.hp > 0));
    const bridgeLines = chapterThreeBanter(run);
    assert.equal(nightBridgeWheelCue(bridgeLines[0]), false);
    assert.equal(nightBridgeWheelCue(bridgeLines[1]), true);
    assert.equal(nightBridgeWheelCue({ ...bridgeLines[1], speaker: "aria" }), false);
    const before = JSON.stringify(state);
    let initial,
      last,
      walked = false,
      laneGap;
    for (let i = 0; i < 80; i++) {
      const input = {
        squad: state.squads[0],
        startQuest: run.quest,
        now: state.updatedAt + i * 50,
        ready: true,
        storybookHeroes: true,
        backgroundOverride: nightBridgeAssets.bank,
        nightWheel: i >= 30,
      };
      const drawn = motion.update(
        chapterRoadFrame(input, false, 1400, view),
        "wheel",
        view.width,
        false,
        view.height,
      );
      const leon = drawn.battle.heroes.find((hero) => hero.id === "leon");
      const cart = drawn.battle.waterwayActions.props.find((prop) => prop.id === "night-cart");
      const gap = (cart.point.x - leon.x) * roadScale(view.width);
      if (i === 29) initial = gap;
      if (i >= 30 && leon.walking) walked = true;
      last = gap;
      laneGap = Math.abs(cart.point.lane - leon.lane) * roadDepth(view.width, view.height);
    }
    assert.ok(walked, "Leon uses a walking pose on his way to the wheel");
    assert.ok(
      last < initial - 20 * housecallsLayout(view).scale,
      `wheel gap ${initial} -> ${last}`,
    );
    assert.ok(laneGap < 25 * housecallsLayout(view).scale, `wheel ground gap ${laneGap}`);
    assert.equal(JSON.stringify(state), before, "dialogue changes only the rendered scene");
  });

test("the push review point reaches a real movement phase without changing the save", () => {
  let state = act(
    act(testState(1000, 25, 40, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
    { type: "start", id: "keystone-night-road", readDeparture: true, value: false },
    1000,
  );
  assert.equal(nightPushReady(state), false);
  for (let i = 0; i < 3000 && state.squads[0].run && !nightPushReady(state); i++)
    state = settle(state, state.updatedAt + 100);
  const before = JSON.stringify(state);
  assert.equal(nightPushReady(state), true);
  assert.equal(JSON.stringify(state), before);
});

test("a delayed frame still changes the night-road scene under full black", () => {
  const view = { width: 936, height: 624 };
  const state = act(
    act(testState(1000, 25, 40, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
    { type: "start", id: "keystone-night-road", readDeparture: true, value: false },
    1000,
  );
  const input = {
    squad: state.squads[0],
    startQuest: "keystone-night-road",
    now: 1000,
    ready: true,
    storybookHeroes: true,
    backgroundOverride: nightBridgeAssets.bank,
  };
  const raw = chapterRoadFrame(input, false, 1400, view);
  const motion = new RoadNightBridge();
  const draw = (node, time, completed = false) =>
    motion.prepare(
      {
        battle: { ...raw.battle, time },
        look: { ...raw.look, nightBridge: { ...raw.look.nightBridge, node, completed } },
      },
      "sparse-night-road",
      view,
      false,
    ).look.nightBridge;
  assert.equal(draw(5, 1000).section, 0);
  assert.equal(draw(6, 1100).fade, 0);
  const approach = draw(6, 2000);
  assert.equal(approach.section, 1);
  assert.equal(approach.fade, 1);
  assert.equal(draw(6, 2400).fade, 0);
  assert.equal(draw(14, 2500, true).fade, 0);
  const bridge = draw(14, 3050, true);
  assert.equal(bridge.section, 2);
  assert.equal(bridge.fade, 1);
  assert.equal(draw(14, 3450, true).fade, 0);
});

test("bandaged walk keeps Finn's head aligned and the figure within each cell", async () => {
  const metrics = JSON.parse(
    await readFile("public/storybook-study/finn-night-walk-balanced-v2-metrics.json", "utf8"),
  );
  assert.equal(metrics.length, 4);
  assert.ok(
    Math.max(...metrics.map((m) => m.headX)) - Math.min(...metrics.map((m) => m.headX)) < 1,
  );
  assert.ok(
    Math.max(...metrics.map((m) => m.height)) - Math.min(...metrics.map((m) => m.height)) <= 4,
  );
  assert.ok(metrics.every((m) => m.baseline === 176));
  const { data, info } = await sharp("public/storybook-study/finn-night-walk-balanced-v2.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 768);
  assert.equal(info.height, 192);
  for (let frame = 0; frame < 4; frame++)
    for (let y = 0; y < 192; y++)
      for (let x = 0; x < 192; x++)
        if (x < 3 || x >= 189 || y < 3 || y >= 189)
          assert.equal(data[(y * info.width + frame * 192 + x) * 4 + 3], 0);
});

test("bandaged battle poses retain the standing height and head anchor", async () => {
  const metrics = JSON.parse(
    await readFile("public/storybook-study/finn-night-battle-balanced-v2-metrics.json", "utf8"),
  );
  assert.equal(metrics.length, 4);
  assert.ok(metrics.every((m) => m.height === 148 && m.top + m.height === 176));
  assert.ok(metrics.every((m) => Math.abs(m.headX - 96) < 0.6));
  const { data, info } = await sharp("public/storybook-study/finn-night-battle-balanced-v2.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 1024);
  assert.equal(info.height, 192);
  for (let frame = 0; frame < 4; frame++) {
    let left = 256,
      right = -1;
    for (let y = 28; y < 65; y++)
      for (let x = 0; x < 256; x++)
        if (data[(y * info.width + frame * 256 + x) * 4 + 3] > 128) {
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
    assert.ok(right - left + 1 <= 60, `battle frame ${frame} head is too wide`);
  }
});

test("pushing frames retain the same standing height and aligned head", async () => {
  const metrics = JSON.parse(
    await readFile("public/storybook-study/finn-night-push-balanced-v5-metrics.json", "utf8"),
  );
  assert.equal(metrics.length, 8);
  const poses = metrics.slice(1, 6);
  assert.ok(poses.every((m) => Math.abs(m.height - 145) <= 1 && m.baseline === 176));
  assert.ok(Math.max(...poses.map((m) => m.headX)) - Math.min(...poses.map((m) => m.headX)) < 1);
  assert.ok(poses.every((m) => m.left >= 3 && m.left + m.width <= 189));
  assert.equal(new Set(poses.slice(1).map((m) => m.scale)).size, 1);
});

test("Finn's push keeps a comparable head and a stable bandaged grip across strides", async () => {
  const { data, info } = await sharp("public/storybook-study/finn-night-push-balanced-v5.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const grips = [];
  for (let frame = 1; frame <= 5; frame++) {
    let left = 192,
      right = -1,
      xSum = 0,
      ySum = 0,
      count = 0;
    for (let y = 30; y < 130; y++)
      for (let x = 0; x < 192; x++) {
        const i = ((Math.floor(frame / 4) * 192 + y) * info.width + (frame % 4) * 192 + x) * 4;
        const [r, g, b, a] = data.subarray(i, i + 4);
        if (a <= 128) continue;
        if (y < 66) {
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
        if (y >= 70 && x >= 112 && x < 165 && r > 170 && g > 145 && b > 115 && r - g < 55) {
          xSum += x;
          ySum += y;
          count++;
        }
      }
    assert.ok(right - left + 1 <= 58, `push frame ${frame} head is too wide`);
    assert.ok(count > 50, `push frame ${frame} retains the visible bandage`);
    grips.push({ x: xSum / count, y: ySum / count });
  }
  assert.ok(Math.max(...grips.map((p) => p.x)) - Math.min(...grips.map((p) => p.x)) < 3);
  assert.ok(Math.max(...grips.map((p) => p.y)) - Math.min(...grips.map((p) => p.y)) < 7);
});

test("each pushing stride retains a planted foot at the shared ground line", async () => {
  const { data, info } = await sharp("public/storybook-study/finn-night-push-balanced-v5.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const groundSpans = [];
  for (let frame = 2; frame <= 5; frame++) {
    const foot = [];
    for (let y = 171; y < 176; y++)
      for (let x = 20; x < 172; x++) {
        const alpha =
          ((Math.floor(frame / 4) * 192 + y) * info.width + (frame % 4) * 192 + x) * 4 + 3;
        if (data[alpha] > 128) foot.push(x);
      }
    assert.ok(foot.length > 20, `stride ${frame} reaches the ground line`);
    groundSpans.push({ left: Math.min(...foot), right: Math.max(...foot) });
  }
  assert.ok(groundSpans[1].left > groundSpans[3].left + 15, "the planted foot changes sides");
});

test("repainting an unchanged position does not flash the idle push pose during travel", () => {
  const view = { width: 936, height: 624 },
    motion = new RoadMotion();
  let state = act(
    act(testState(1000, 25, 40, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
    { type: "start", id: "keystone-night-road", readDeparture: true, value: false },
    1000,
  );
  let identity,
    checked = false;
  for (let i = 0; i < 3000 && state.squads[0].run; i++) {
    const input = {
      squad: state.squads[0],
      startQuest: "keystone-night-road",
      now: state.updatedAt,
      ready: true,
      storybookHeroes: true,
      backgroundOverride: nightBridgeAssets.bank,
    };
    const frame = chapterRoadFrame(input, false, 1400, view);
    identity = roadPaintKey("push-repaint", state.squads[0].run, frame.look, identity);
    const drawn = motion.update(frame, identity.key, view.width, false, view.height);
    const pose = drawn.battle.waterwayActions?.poses.finn;
    if (pose?.asset === nightBridgeAssets.push && pose.frame >= 2 && pose.frame <= 5) {
      const sameTime = chapterRoadFrame(input, false, 1400, view);
      const repeated = motion.update(sameTime, identity.key, view.width, false, view.height);
      assert.equal(repeated.battle.waterwayActions.poses.finn.frame, pose.frame);
      checked = true;
      break;
    }
    state = settle(state, state.updatedAt + 50);
  }
  assert.ok(checked, "the cart reached its walking phase");
});

test("portrait camera keeps scenery, figures and cargo together through the bridge arrival", () => {
  const view = { width: 390, height: 741 },
    motion = new RoadMotion();
  const travel = nightBridgeLayout(view),
    arrival = nightBridgeLayout(view, 2);
  assert.equal(travel.scale / housecallsLayout(view).scale, 1.5);
  assert.ok(Math.abs((arrival.figureSize * 1.33) / travel.figureSize - 1.064) < 0.001);
  assert.ok(travel.project(350, 430).x > 0, "the near bridge remains visible");
  const landscape = { width: 936, height: 624 };
  assert.deepEqual(nightBridgeLayout(landscape).backdrop, housecallsLayout(landscape).backdrop);
  const square = nightBridgeLayout({ width: 390, height: 390 });
  const slightlyTaller = nightBridgeLayout({ width: 390, height: 391 });
  assert.ok(slightlyTaller.scale / square.scale < 1.01, "resizing through square does not jump");
  let state = act(
    act(testState(1000, 25, 40, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
    { type: "start", id: "keystone-night-road", readDeparture: true, value: false },
    1000,
  );
  let identity,
    after = 0;
  const sections = new Set();
  for (let i = 0; i < 10000; i++) {
    const input = {
      squad: state.squads[0],
      startQuest: "keystone-night-road",
      now: state.updatedAt + after * 50,
      ready: true,
      storybookHeroes: true,
      backgroundOverride: nightBridgeAssets.bank,
      questComplete: !!state.done["keystone-night-road"],
    };
    const frame = chapterRoadFrame(input, false, 1400, view);
    identity = roadPaintKey("portrait", state.squads[0].run ?? null, frame.look, identity);
    const drawn = motion.update(frame, identity.key, view.width, false, view.height);
    const section = drawn.look.nightBridge.section;
    sections.add(section);
    const size = nightBridgeLayout(view, section).figureSize * (section === 2 ? 1.33 : 1);
    for (const hero of drawn.battle.heroes) {
      const x = roadX(hero.x, drawn.battle.distance, view.width),
        y = roadY(hero.lane, view.height, view.width);
      assert.ok(
        x >= size * 0.25 && x <= view.width - size * 0.25,
        `${hero.id} x=${x} section=${section}`,
      );
      assert.ok(y >= size && y <= view.height, `${hero.id} y=${y} section=${section}`);
      assert.ok(
        roadFigureDepth(hero.lane, view, drawn.look) > 1,
        `${hero.id} must stay in front of the backdrop, section=${section}`,
      );
    }
    const cart = drawn.battle.waterwayActions.props.find((item) => item.id === "night-cart");
    const sizeInPixels = cart.size * roadHeroSize(view.width, view.height);
    assert.ok(Math.abs(sizeInPixels - 288 * nightBridgeLayout(view, section).scale) < 0.001);
    const cartX = roadX(cart.point.x, drawn.battle.distance, view.width);
    assert.ok(cartX - sizeInPixels / 2 >= 0 && cartX + sizeInPixels / 2 <= view.width);
    if (!state.squads[0].run) {
      if (++after > 25) break;
    } else {
      state = settle(state, state.updatedAt + 50);
      if (state.squads[0].run && i % 4 === 0)
        state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
    }
  }
  assert.equal(state.done["keystone-night-road"], 1);
  assert.deepEqual([...sections].sort(), [0, 1, 2]);
});

test("the tall night-road viewport keeps travellers and cargo in front of the backdrop", () => {
  const view = { width: 390, height: 1100 };
  const layout = nightBridgeLayout(view, 1);
  const aria = layout.world(620, 505);
  const cart = layout.world(920, 680);
  const look = { nightBridge: { section: 1 } };
  assert.ok(roadY(aria.lane, view.height, view.width) > 0);
  assert.ok(10 + aria.lane * 10 < 0, "the former lane depth placed Aria behind the background");
  assert.ok(roadFigureDepth(aria.lane, view, look) > 1);
  assert.ok(roadFigureDepth(cart.lane, view, look) > roadFigureDepth(aria.lane, view, look));
});

test("night portrait images fill the viewport while landscape keeps the original art", () => {
  const landscape = { width: 936, height: 624 };
  assert.equal(nightPortraitBackdrop(landscape, 1), null);
  for (const view of [
    { width: 390, height: 391 },
    { width: 390, height: 400 },
    { width: 390, height: 476 },
    { width: 390, height: 486 },
    { width: 390, height: 741 },
    { width: 320, height: 620 },
  ]) {
    const assets = [
      nightBridgeAssets.bankPortrait,
      nightBridgeAssets.approachPortrait,
      nightBridgeAssets.bridgePortrait,
    ];
    for (let section = 0; section < 3; section++) {
      const image = nightPortraitBackdrop(view, section);
      assert.equal(image.asset, assets[section]);
      assert.ok(
        image.x <= 0 && image.x + image.width >= view.width,
        `section ${section} horizontal coverage`,
      );
      assert.ok(
        image.y <= 0 && image.y + image.height >= view.height,
        `section ${section} vertical coverage`,
      );
    }
  }
});

test("wide night-road backgrounds cover the screen", () => {
  const view = { width: 1180, height: 610 };
  for (const section of [0, 1, 2]) {
    const backdrop = nightBridgeBackdrop(view, section);
    assert.ok(backdrop.x <= 0 && backdrop.x + backdrop.width >= view.width);
    assert.ok(backdrop.y <= 0 && backdrop.y + backdrop.height >= view.height);
  }
});

for (const view of [
  { width: 1180, height: 610 },
  { width: 1180, height: 789 },
  { width: 936, height: 624 },
])
  test(`landscape night-road keeps figures above the dialogue at ${view.width}x${view.height}`, () => {
    const state = act(
      act(testState(1000, 25, 40, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
      { type: "start", id: "keystone-night-road", readDeparture: true, value: false },
      1000,
    );
    const run = state.squads[0].run;
    const input = {
      squad: state.squads[0],
      startQuest: run.quest,
      now: state.updatedAt,
      ready: true,
      storybookHeroes: true,
      backgroundOverride: nightBridgeAssets.bank,
    };
    const drawn = new RoadMotion().update(
      chapterRoadFrame(input, false, 1400, view),
      "wide",
      view.width,
      false,
      view.height,
    );
    for (const hero of drawn.battle.heroes) {
      const y = roadY(hero.lane, view.height, view.width);
      // Five dialogue rows begin near 72% of the map in the 1280x900 phone frame.
      const limit = view.width / view.height > 1.5 ? 0.65 : 0.72;
      assert.ok(y < view.height * limit, `${hero.id} stands above the dialogue, y=${y}`);
    }
  });

for (const width of [374, 936])
  test(`night road keeps the recovered cargo during fighting and pushing at ${width}`, () => {
    const view = { width, height: (width * 2) / 3 },
      motion = new RoadMotion();
    let state = act(
      act(testState(1000, 25, 40, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
      { type: "start", id: "keystone-night-road", readDeparture: true, value: false },
      1000,
    );
    let identity,
      previous,
      after = 0,
      fights = 0,
      pushing = 0,
      walking = 0,
      pushStarted,
      longestPush = 0;
    const nodes = new Set(),
      sections = new Set(),
      frames = new Set(),
      pushPositions = new Map();
    for (let i = 0; i < 20000; i++) {
      const before = JSON.stringify(state);
      const input = storybookAdventureInput({
        squad: state.squads[0],
        startQuest: "keystone-night-road",
        now: state.updatedAt + after * 50,
        ready: true,
        storybookHeroes: true,
        backgroundOverride: nightBridgeAssets.bank,
        questComplete: !!state.done["keystone-night-road"],
      });
      const raw = chapterRoadFrame(input, false, 1400, view);
      identity = roadPaintKey("bridge", state.squads[0].run ?? null, raw.look, identity);
      const { battle, look } = motion.update(raw, identity.key, width, false, view.height);
      assert.equal(JSON.stringify(state), before);
      const site = look.nightBridge,
        scene = battle.waterwayActions;
      if (state.squads[0].run && state.squads[0].run.phase !== "rest") {
        const context = nightBridgeBanterContext(state.squads[0].run);
        assert.equal(
          context === "battle",
          battle.enemies.some((enemy) => enemy.hp > 0),
          "the battle exchange is selected only while a living enemy is drawn",
        );
        if (context === "bridge") {
          assert.equal(site.section, 1, "the bridge is visible when Aria mentions it");
          assert.ok(site.fade <= 0.5, "the bridge is not hidden by the transition");
        }
      }
      nodes.add(site.node);
      sections.add(site.section);
      const cart = scene.props.find((p) => p.id === "night-cart"),
        stone = scene.props.find((p) => p.id === "night-stone"),
        pot = scene.props.find((p) => p.id === "night-pot");
      if (site.section !== 2) {
        const layout = housecallsLayout(view);
        const sourceX = ((cart.point.x - layout.world(0, 0).x) * roadScale(width)) / layout.scale;
        assert.ok(sourceX >= 840, `cart remains on the visible road: ${sourceX} node ${site.node}`);
      }
      assert.ok(cart && stone && pot, "the same cart and cargo remain throughout the route");
      for (let a = 0; a < battle.heroes.length; a++)
        for (let b = a + 1; b < battle.heroes.length; b++) {
          const first = battle.heroes[a],
            second = battle.heroes[b],
            size = housecallsLayout(view).figureSize;
          const dx = Math.abs(first.x - second.x) * roadScale(width);
          const dy = Math.abs(first.lane - second.lane) * roadDepth(width, view.height);
          assert.ok(
            dx >= size * 0.35 || dy >= size * 0.9,
            `${first.id}/${second.id} overlap in node ${site.node}`,
          );
        }
      assert.equal(stone.asset, nightBridgeAssets.stone);
      assert.equal(pot.asset, nightBridgeAssets.pot);
      if (battle.enemies.some((e) => e.hp > 0)) {
        fights++;
        if (previous && previous.section === site.section && previous.fighting)
          assert.ok(Math.abs(cart.point.x - previous.x) < 1e-9, "cart stays parked during combat");
        if (scene.poses.finn)
          assert.ok(
            [nightBridgeAssets.battle, nightBridgeAssets.walk].includes(scene.poses.finn.asset),
          );
      }
      const finn = battle.heroes.find((h) => h.id === "finn"),
        pose = scene.poses.finn;
      if (pose?.asset === nightBridgeAssets.walk) {
        assert.ok(finn.walking && pose.frame >= 0 && pose.frame < 4);
        walking++;
      }
      if (pose?.asset === nightBridgeAssets.push && finn.walking) {
        pushing++;
        const sourceX =
          ((cart.point.x - housecallsLayout(view).world(0, 0).x) * roadScale(width)) /
          housecallsLayout(view).scale;
        const range = pushPositions.get(site.node) ?? [sourceX, sourceX];
        range[0] = Math.min(range[0], sourceX);
        range[1] = Math.max(range[1], sourceX);
        pushPositions.set(site.node, range);
        frames.add(pose.frame);
        pushStarted ??= battle.time;
        longestPush = Math.max(longestPush, battle.time - pushStarted);
        const l = housecallsLayout(view);
        assert.ok(Math.abs((finn.x - cart.point.x) * roadScale(width) - 149 * l.scale) < 0.02);
        assert.ok(
          Math.abs((finn.lane - cart.point.lane) * roadDepth(width, view.height) - 23 * l.scale) <
            0.02,
        );
      } else pushStarted = undefined;
      if (previous && previous.section !== site.section) assert.equal(site.fade, 1);
      previous = {
        x: cart.point.x,
        section: site.section,
        fighting: battle.enemies.some((e) => e.hp > 0),
      };
      if (!state.squads[0].run) {
        after++;
        if (after > 25) break;
      } else state = settle(state, state.updatedAt + 50);
    }
    assert.equal(state.done["keystone-night-road"], 1);
    assert.ok(nodes.size >= 10, JSON.stringify([...nodes]));
    assert.ok(
      fights > 5 && pushing > 5 && [2, 3, 4, 5].every((frame) => frames.has(frame)),
      `fights=${fights}, pushing=${pushing}, frames=${[...frames]}`,
    );
    assert.ok(longestPush >= 1200, `the pushing movement is visible: ${longestPush}ms`);
    for (const node of [1, 4, 7, 10, 13]) {
      const range = pushPositions.get(node);
      assert.ok(range && range[1] - range[0] > 10, `node ${node} push range: ${range}`);
    }
    assert.ok(walking > 5, "Finn uses the bandaged walking sheet while moving");
    assert.deepEqual([...sections].sort(), [0, 1, 2]);
  });

test("standalone night-road rendering honors an explicit comparison", () => {
  const squad = testState(1000, 25, 40, 10000).squads[0];
  const input = { squad, startQuest: "keystone-night-road", now: 1000, ready: true };
  assert.equal(storybookAdventureInput(input).backgroundOverride, undefined);
  const legacy = chapterRoadFrame({
    ...input,
    storybookHeroes: false,
    backgroundOverride: nightBridgeAssets.bank,
  });
  assert.equal(legacy.look.nightBridge, undefined);
  const custom = chapterRoadFrame({
    ...input,
    storybookHeroes: true,
    backgroundOverride: "/custom.png",
  });
  assert.equal(custom.look.nightBridge, undefined);
});

for (const reduced of [false, true])
  test(`night-road completion survives repeated help, reduced=${reduced}`, () => {
    const view = { width: 374, height: (374 * 2) / 3 },
      motion = new RoadMotion();
    let state = act(
        act(testState(1000, 25, 100, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
        { type: "start", id: "keystone-night-road", readDeparture: true, value: false },
        1000,
      ),
      identity;
    let after = 0,
      last;
    for (let i = 0; i < 12000; i++) {
      const input = {
        squad: state.squads[0],
        startQuest: "keystone-night-road",
        now: state.updatedAt + after * 50,
        ready: true,
        storybookHeroes: true,
        backgroundOverride: nightBridgeAssets.bank,
        questComplete: !!state.done["keystone-night-road"],
      };
      const raw = chapterRoadFrame(input, reduced, 1400, view);
      identity = roadPaintKey("bridge-help", state.squads[0].run ?? null, raw.look, identity);
      last = motion.update(raw, identity.key, view.width, reduced, view.height);
      if (nightBridgeBanterContext(state.squads[0].run) === "bridge") {
        assert.equal(last.look.nightBridge.section, 1);
        assert.ok(last.look.nightBridge.fade <= 0.5);
      }
      if (!state.squads[0].run) {
        if (++after > 25) break;
      } else {
        state = settle(state, state.updatedAt + 50);
        if (state.squads[0].run && i % 4 === 0)
          state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
      }
    }
    assert.equal(state.done["keystone-night-road"], 1);
    assert.equal(last.look.nightBridge.section, 2);
    assert.equal(last.look.nightBridge.fade, 0);
    assert.ok(last.battle.waterwayActions.props.some((p) => p.id === "night-stone"));
  });
