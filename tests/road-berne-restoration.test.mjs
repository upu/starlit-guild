import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { LUNCH_INTERLUDE } from "../lib/chapter-three.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { restorationAssets } from "../lib/road-berne-restoration.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { storyStages } from "../lib/prologue.ts";
import { restorationPlacement, restorationStoneTurn } from "../lib/road-restoration-placement.ts";
import { roadDepth, roadFigureDepth, roadScale, roadX, roadY } from "../lib/road-layout.ts";
import { housecallsLayout } from "../lib/road-housecalls-layout.ts";
import { restorationSiteLayout, restorationTarget } from "../lib/road-restoration-layout.ts";
import { readFile } from "node:fs/promises";
import { chapterThreeBanter, restorationBanterCue } from "../lib/chapter-three-banter.ts";
import { journeyBanter } from "../lib/stories.ts";
import { startBanter, retainBanter, nextBanter, hasNextBanter } from "../lib/banter-exchange.ts";
import {
  restorationPreviewState,
  updateStudySnapshot,
} from "../app/sprite-lab/storybook/restoration-preview-state.ts";

test("portrait restoration keeps the hole and all workers visible above the backdrop", () => {
  for (const view of [
    { width: 390, height: 750 },
    { width: 320, height: 610 },
  ]) {
    const layout = restorationSiteLayout(view);
    assert.ok(layout.backdrop.x <= 0 && layout.backdrop.x + layout.backdrop.width >= view.width);
    assert.ok(layout.backdrop.y <= 0 && layout.backdrop.y + layout.backdrop.height >= view.height);
    const hole = layout.project(722, 650);
    assert.ok(hole.x > 0 && hole.x < view.width && hole.y > 0 && hole.y < view.height);
    const people = [
      ...["aria", "leon", "mira", "finn"].map((id) => restorationTarget(id, 1, false, true)),
      [870, 650],
      [1100, 430],
    ];
    for (const [x, y] of people) {
      const point = layout.world(x, y);
      const screenX = roadX(point.x, 0, view.width);
      const screenY = roadY(point.lane, view.height, view.width);
      assert.ok(screenX > layout.figureSize / 4 && screenX < view.width - layout.figureSize / 4);
      assert.ok(screenY > layout.figureSize && screenY < view.height);
      assert.ok(roadFigureDepth(point.lane, view, { restoration: {} }) > 1);
    }
  }
});

test("portrait restoration completes the root work and returns the stone to the painted hole", () => {
  const quest = "berne-restoration",
    view = { width: 390, height: 750 },
    motion = new RoadMotion();
  let state = act(
    act(
      testState(
        1000,
        storyStages.findIndex((s) => s.quest === quest),
        40,
        10000,
      ),
      { type: "readStory", id: LUNCH_INTERLUDE },
      1000,
    ),
    { type: "start", id: quest, readDeparture: true, value: false },
    1000,
  );
  let identity,
    sawRoot = false,
    sawStoneAtHole = false,
    installed = false;
  for (let i = 0; i < 3000 && state.squads[0].run; i++) {
    const input = {
      squad: state.squads[0],
      startQuest: quest,
      now: state.updatedAt,
      ready: true,
      paused: false,
      storybookHeroes: true,
      backgroundOverride: restorationAssets.bank,
    };
    const raw = chapterRoadFrame(input, false, 1400, view);
    identity = roadPaintKey("portrait-restoration", state.squads[0].run, raw.look, identity);
    const { battle, look } = motion.update(raw, identity.key, view.width, false, view.height);
    const scene = battle.waterwayActions;
    sawRoot ||= !!scene.props.find((prop) => prop.id === "restoration-root");
    const stone = scene.props.find((prop) => prop.id === "restoration-stone");
    const side = scene.props.find((prop) => prop.id === "restoration-stone-side");
    if (side) assert.equal(side.angle, stone.angle);
    if (stone && (look.restoration.installAge ?? 0) >= 3700) {
      const hole = restorationSiteLayout(view).world(722, 650);
      assert.ok(Math.abs(stone.point.x - hole.x) * roadScale(view.width) < 1);
      assert.ok(Math.abs(stone.point.lane - hole.lane) * roadDepth(view.width, view.height) < 1);
      assert.equal(stone.angle, 50);
      sawStoneAtHole = true;
    }
    for (const actor of scene.actors) assert.ok(roadFigureDepth(actor.point.lane, view, look) > 1);
    installed ||= !!look.restoration.installed;
    state = settle(state, state.updatedAt + 100);
  }
  assert.ok(state.done[quest] && sawRoot && sawStoneAtHole && installed);
});

test("lifting frames keep the mason's scale and grow from a low crouch", async () => {
  const lift = JSON.parse(
    await readFile("public/storybook-study/mason-lift-stone-v1-metrics.json", "utf8"),
  );
  const carry = JSON.parse(
    await readFile("public/storybook-study/mason-carry-stone-v2-metrics.json", "utf8"),
  );
  assert.equal(lift.length, 4);
  assert.equal(new Set(lift.map((frame) => frame.scale)).size, 1);
  assert.equal(carry.length, 4);
  assert.equal(new Set(carry.map((frame) => frame.scale)).size, 1);
  assert.ok(carry.every((frame) => frame.height === lift[3].height && frame.baseline === 120));
  assert.ok(carry.every((frame) => Math.abs(frame.headX - lift[3].headX) < 1));
  assert.ok(lift.every((frame) => frame.baseline === 120 && frame.top + frame.height === 120));
  assert.ok(lift.every((frame, index) => index === 0 || frame.height > lift[index - 1].height));
  assert.ok(lift.every((frame) => Math.abs(frame.headX - carry[0].headX) < 1));
});

test("displayed restoration dialogue identifies the matching visual cue", () => {
  const state = act(
    act(
      testState(
        1000,
        storyStages.findIndex((s) => s.quest === "berne-restoration"),
        40,
        10000,
      ),
      { type: "readStory", id: LUNCH_INTERLUDE },
      1000,
    ),
    { type: "start", id: "berne-restoration", readDeparture: true, value: false },
    1000,
  );
  const run = state.squads[0].run;
  const guide = chapterThreeBanter({ ...run, node: 0 });
  const roots = chapterThreeBanter({ ...run, node: 3 });
  assert.deepEqual(guide.map(restorationBanterCue), ["guide", "guide", "guide"]);
  assert.deepEqual(roots.map(restorationBanterCue), ["root", "plan"]);
  assert.equal(restorationBanterCue(undefined), "other");
});

test("Finn can gesture immediately when the first guidance line becomes visible", () => {
  const quest = "berne-restoration";
  const state = act(
    act(
      testState(
        1000,
        storyStages.findIndex((s) => s.quest === quest),
        40,
        10000,
      ),
      { type: "readStory", id: LUNCH_INTERLUDE },
      1000,
    ),
    { type: "start", id: quest, readDeparture: true, value: false },
    1000,
  );
  for (const view of [
    { width: 936, height: 624 },
    { width: 390, height: 750 },
  ]) {
    const motion = new RoadMotion();
    const render = (time, dialogue) => {
      const input = {
        squad: state.squads[0],
        startQuest: quest,
        now: time,
        ready: true,
        paused: false,
        storybookHeroes: true,
        backgroundOverride: restorationAssets.bank,
        restorationDialogue: dialogue,
      };
      return motion.update(
        chapterRoadFrame(input, false, 1400, view),
        "guide",
        view.width,
        false,
        view.height,
      );
    };
    const pending = render(1000, "pending");
    const speaking = render(1100, "guide");
    const before = pending.battle.heroes.find((hero) => hero.id === "finn");
    const finn = speaking.battle.heroes.find((hero) => hero.id === "finn");
    const pose = speaking.battle.waterwayActions.poses.finn;
    assert.deepEqual({ x: finn.x, lane: finn.lane }, { x: before.x, lane: before.lane });
    assert.equal(finn.walking, false);
    assert.equal(pose.asset, restorationAssets.finn);
    assert.ok([6, 7].includes(pose.frame));
  }
});

test("roots remain until their dialogue, then Aria removes them even after the node changes", () => {
  const width = 936,
    height = (width * 2) / 3,
    view = { width, height },
    motion = new RoadMotion();
  let state = act(
    act(
      testState(
        1000,
        storyStages.findIndex((s) => s.quest === "berne-restoration"),
        40,
        10000,
      ),
      { type: "readStory", id: LUNCH_INTERLUDE },
      1000,
    ),
    { type: "start", id: "berne-restoration", readDeparture: true, value: false },
    1000,
  );
  let identity,
    requested = false,
    faded = false,
    removed = false;
  for (let i = 0; i < 2000 && state.squads[0].run && !removed; i++) {
    const node = state.squads[0].run.node;
    if (node >= 4) requested = true;
    const raw = chapterRoadFrame(
      {
        squad: state.squads[0],
        startQuest: "berne-restoration",
        now: state.updatedAt,
        ready: true,
        paused: false,
        storybookHeroes: true,
        backgroundOverride: restorationAssets.bank,
        restorationDialogue: requested ? "root" : "guide",
      },
      false,
      1400,
      view,
    );
    identity = roadPaintKey("dialogue-study", state.squads[0].run, raw.look, identity);
    const { battle } = motion.update(raw, identity.key, width, false, height);
    const root = battle.waterwayActions.props.find((p) => p.id === "restoration-root");
    if (!requested) assert.equal(root?.alpha, 1, "the roots must still be present before the line");
    else if (root && root.alpha < 1) {
      faded = true;
      assert.equal(battle.waterwayActions.poses.aria?.asset, restorationAssets.aria);
    } else if (!root) removed = true;
    state = settle(state, state.updatedAt + 100);
  }
  assert.ok(
    requested && faded && removed,
    "the displayed root line triggers and completes the work",
  );
});

test("the stone turns from its grooved underside to its plain face while lowering", () => {
  assert.deepEqual(restorationStoneTurn(3000), { upperFace: false, faceAlpha: 1, sideAlpha: 0 });
  assert.deepEqual(restorationStoneTurn(3300), { upperFace: true, faceAlpha: 0, sideAlpha: 1 });
  assert.deepEqual(restorationStoneTurn(3600), { upperFace: true, faceAlpha: 1, sideAlpha: 0 });
  for (let age = 3000; age <= 3600; age += 20)
    assert.equal(restorationStoneTurn(age).faceAlpha + restorationStoneTurn(age).sideAlpha, 1);
});

test("late playback waits for the root line to finish before moving the stone", () => {
  const view = { width: 936, height: 624 },
    motion = new RoadMotion();
  let state = act(
    act(
      testState(
        1000,
        storyStages.findIndex((s) => s.quest === "berne-restoration"),
        40,
        10000,
      ),
      { type: "readStory", id: LUNCH_INTERLUDE },
      1000,
    ),
    { type: "start", id: "berne-restoration", readDeparture: true, value: false },
    1000,
  );
  while (state.squads[0].run && state.squads[0].run.node < 13)
    state = settle(state, state.updatedAt + 100);
  let identity,
    removed = false,
    started = false;
  for (let i = 0; i < 70 && state.squads[0].run; i++) {
    const cue = i < 40 ? "root" : "plan";
    const raw = chapterRoadFrame(
      {
        squad: state.squads[0],
        startQuest: "berne-restoration",
        now: state.updatedAt,
        ready: true,
        paused: false,
        storybookHeroes: true,
        backgroundOverride: restorationAssets.bank,
        restorationDialogue: cue,
      },
      false,
      1400,
      view,
    );
    identity = roadPaintKey("late-dialogue", state.squads[0].run, raw.look, identity);
    const { battle, look } = motion.update(raw, identity.key, view.width, false, view.height);
    removed ||= !battle.waterwayActions.props.some((prop) => prop.id === "restoration-root");
    if (cue === "root")
      assert.equal(
        look.restoration.installAge,
        undefined,
        "the stone stays until the line changes",
      );
    else started ||= look.restoration.installAge !== undefined;
    state = settle(state, state.updatedAt + 100);
  }
  assert.ok(removed, "Aria has finished the root work");
  assert.ok(started, "stone placement begins after the root line");
});

test("rapid help completes the save while the preview finishes its queued dialogue and restoration", () => {
  const quest = "berne-restoration",
    view = { width: 936, height: 624 },
    motion = new RoadMotion();
  let state = act(
    act(
      testState(
        1000,
        storyStages.findIndex((s) => s.quest === quest),
        40,
        10000,
      ),
      { type: "readStory", id: LUNCH_INTERLUDE },
      1000,
    ),
    { type: "start", id: quest, readDeparture: true, value: false },
    1000,
  );
  let snapshot = updateStudySnapshot({ state: null, lastRun: null }, state),
    exchange = startBanter(journeyBanter(state, state.squads[0], state.updatedAt)),
    nextLine = 3500,
    identity,
    finished = false,
    completedAt,
    sawRoot = false,
    sawInstall = false;
  for (let t = 0; t < 45000 && !finished; t += 50) {
    const shown = restorationPreviewState(quest, snapshot, finished);
    assert.ok(shown.squads[0].run, "preview keeps the last running view until its work finishes");
    const lines = journeyBanter(shown, shown.squads[0], shown.updatedAt);
    exchange = retainBanter(exchange, lines);
    if (t >= nextLine && hasNextBanter(exchange, lines)) {
      exchange = nextBanter(exchange, lines);
      nextLine = t + Math.max(3500, exchange.lines[exchange.index].text.length * 100);
    }
    const dialogue = restorationBanterCue(exchange.lines[exchange.index]);
    sawRoot ||= dialogue === "root";
    const input = {
      squad: shown.squads[0],
      startQuest: quest,
      now: shown.updatedAt,
      ready: true,
      paused: false,
      questComplete: !!state.done[quest],
      storybookHeroes: true,
      backgroundOverride: restorationAssets.bank,
      restorationDialogue: dialogue,
    };
    const raw = chapterRoadFrame(input, false, 1400, view);
    identity = roadPaintKey("rapid-dialogue", shown.squads[0].run, raw.look, identity);
    const { look } = motion.update(raw, identity.key, view.width, false, view.height);
    if (look.restoration.installAge !== undefined) {
      assert.ok(sawRoot, "installation cannot precede the root dialogue");
      sawInstall = true;
    }
    finished = !!look.restoration.visualComplete;
    if (!state.squads[0].run && completedAt === undefined) completedAt = t;
    state = settle(state, state.updatedAt + 50);
    if (state.squads[0].run)
      state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
    snapshot = updateStudySnapshot(snapshot, state);
  }
  assert.ok(completedAt !== undefined && state.done[quest], "game completion is never delayed");
  assert.ok(sawRoot && sawInstall && finished, "the visual sequence finishes after rapid help");
  assert.equal(
    restorationPreviewState(quest, snapshot, true),
    state,
    "finished preview returns the actual state",
  );
  assert.equal(state.squads[0].run, null);
});

test("the mason and stone move together to the original hole", () => {
  const start = restorationPlacement(0, false),
    lift = restorationPlacement(2000, false);
  const end = restorationPlacement(3700, false);
  assert.deepEqual(start.stone, { x: 822, y: 675 });
  assert.deepEqual(end.stone, { x: 722, y: 650 });
  assert.deepEqual(end.mason, { x: 770, y: 625 });
  const steppedBack = restorationPlacement(5400, false);
  assert.deepEqual(steppedBack.mason, { x: 812, y: 580 });
  assert.deepEqual(steppedBack.pose, { type: "walk", frame: 0, facing: -1 });
  assert.equal(restorationPlacement(4100, false).pose.type, "lift");
  assert.equal(restorationPlacement(4700, false).pose.type, "walk");
  assert.equal(restorationPlacement(1500, false).pose.frame, 0);
  assert.equal(restorationPlacement(1999, false).pose.frame, 3);
  assert.deepEqual(
    [1500, 1625, 1750, 1875].map((t) => restorationPlacement(t, false).pose.frame),
    [0, 1, 2, 3],
  );
  assert.deepEqual(
    [3200, 3325, 3450, 3575].map((t) => restorationPlacement(t, false).pose.frame),
    [3, 2, 1, 0],
  );
  assert.deepEqual(
    [2000, 2250, 2500, 2750, 3000, 3199].map(
      (time) => restorationPlacement(time, false).pose.frame,
    ),
    [0, 1, 2, 3, 2, 2],
    "the raised foot returns to the ground before the mason lowers the stone",
  );
  assert.deepEqual(
    restorationPlacement(3000, false).mason,
    restorationPlacement(3199, false).mason,
  );
  assert.deepEqual(
    restorationPlacement(3000, false).stone,
    restorationPlacement(3199, false).stone,
  );
  assert.equal(restorationPlacement(3000, true).pose.frame, 2);
  for (let time = 2000; time <= 3200; time += 100) {
    const p = restorationPlacement(time, false);
    assert.equal(p.pose.type, time === 3200 ? "lift" : "carry");
    assert.equal(p.mason.x - p.stone.x, lift.mason.x - lift.stone.x);
  }
  let previous = restorationPlacement(0, false);
  for (let time = 50; time <= 5400; time += 50) {
    const next = restorationPlacement(time, false);
    assert.ok(Math.hypot(next.stone.x - previous.stone.x, next.stone.y - previous.stone.y) <= 7);
    assert.ok(Math.hypot(next.mason.x - previous.mason.x, next.mason.y - previous.mason.y) <= 7);
    previous = next;
  }
});

for (const width of [374, 936])
  for (const reduced of [false, true])
    for (const assist of [false, true])
      test(`restoration study preserves the work site at ${width}, reduced=${reduced}, assist=${assist}`, () => {
        const view = { width, height: (width * 2) / 3 },
          motion = new RoadMotion();
        let state = act(
          act(
            testState(
              1000,
              storyStages.findIndex((s) => s.quest === "berne-restoration"),
              40,
              10000,
            ),
            { type: "readStory", id: LUNCH_INTERLUDE },
            1000,
          ),
          { type: "start", id: "berne-restoration", readDeparture: true, value: false },
          1000,
        );
        let identity,
          sawInstalled = false,
          sawFade = false,
          sawRootFade = false,
          sawGuidance = false,
          sawPlan = false,
          sawStoneSide = false,
          previousRootAlpha = 1,
          sawRootRemoved = false;
        const nodes = new Set();
        let lastMason;
        for (let i = 0; i < 12000 && state.squads[0].run; i++) {
          const before = JSON.stringify(state);
          const input = {
            squad: state.squads[0],
            startQuest: "berne-restoration",
            now: state.updatedAt,
            ready: true,
            storybookHeroes: true,
            backgroundOverride: restorationAssets.bank,
          };
          const raw = chapterRoadFrame(input, reduced, 1400, view);
          identity = roadPaintKey("restoration-study", state.squads[0].run, raw.look, identity);
          const { battle, look } = motion.update(raw, identity.key, width, reduced, view.height);
          assert.equal(JSON.stringify(state), before);
          assert.equal(
            look.background,
            look.restoration.installed ? restorationAssets.repaired : restorationAssets.bank,
          );
          nodes.add(look.restoration.node);
          sawInstalled ||= !!look.restoration.installed;
          sawFade ||= (look.restoration.fade ?? 0) > 0.9;
          const scene = battle.waterwayActions;
          const finn = scene.poses.finn;
          if (finn?.asset === restorationAssets.finn && [6, 7].includes(finn.frame)) {
            assert.ok([0, 1, 2, 9, 10, 11].includes(look.restoration.node));
            assert.equal(battle.phase, "journey");
            const hero = battle.heroes.find((h) => h.id === "finn");
            const fence = scene.props.find((p) => p.id === "restoration-fence");
            const layout = housecallsLayout(view);
            assert.ok(
              (hero.x - fence.point.x) * roadScale(width) >= 110 * layout.scale,
              "guiding Finn clears the fence",
            );
            const sourceX = ((hero.x - layout.world(0, 0).x) * roadScale(width)) / layout.scale;
            assert.ok(sourceX < 1440, "guiding Finn remains inside the scene");
            sawGuidance = true;
          }
          const root = scene.props.find((p) => p.id === "restoration-root");
          if (scene.poses.leon?.asset === restorationAssets.leon) {
            const mason = scene.actors.find((a) => a.id === "restoration-mason");
            const stone = scene.props.find((p) => p.id === "restoration-stone");
            const leon = battle.heroes.find((h) => h.id === "leon");
            const layout = housecallsLayout(view);
            assert.equal(look.restoration.node % 3, 1);
            assert.ok(mason.pose.frame >= 5 && mason.pose.frame <= 7);
            assert.ok(
              Math.abs(mason.point.x - stone.point.x) * roadScale(width) < 60 * layout.scale,
            );
            assert.ok(Math.abs(leon.x - stone.point.x) * roadScale(width) > 85 * layout.scale);
            sawPlan = true;
          }
          if (root && root.alpha > 0 && root.alpha < previousRootAlpha) {
            sawRootFade = true;
            assert.equal(scene.poses.aria?.asset, restorationAssets.aria);
            const aria = battle.heroes.find((h) => h.id === "aria");
            const layout = housecallsLayout(view);
            const tip = [0, 145, 157, 148][scene.poses.aria.frame];
            const tipX = (tip - 96) * 0.9 * layout.scale * aria.facing;
            const tipY = (172 - 176) * 0.9 * layout.scale;
            const rootX = (root.point.x - aria.x) * roadScale(width);
            const rootBottom = (root.point.lane - aria.lane) * roadDepth(width, view.height);
            assert.ok(
              Math.abs(tipX - rootX) <= 26 * layout.scale,
              "tool reaches the root horizontally",
            );
            assert.ok(
              tipY >= rootBottom - 52 * layout.scale && tipY <= rootBottom,
              "tool reaches the root vertically",
            );
          }
          if (root) previousRootAlpha = root.alpha;
          else if (previousRootAlpha > 0) {
            assert.equal(
              scene.poses.aria?.asset,
              restorationAssets.aria,
              "root disappears during the work pose",
            );
            previousRootAlpha = 0;
            sawRootRemoved = true;
          }
          assert.ok(scene.props.some((p) => p.id === "restoration-fence"));
          const stoneSide = scene.props.find((p) => p.id === "restoration-stone-side");
          if (stoneSide) {
            const stone = scene.props.find((p) => p.id === "restoration-stone");
            assert.equal(stoneSide.asset, restorationAssets.stoneSide);
            assert.deepEqual(stoneSide.point, stone.point);
            assert.equal(stoneSide.size, stone.size);
            assert.equal(stoneSide.verticalScale, undefined);
            sawStoneSide = true;
          }
          assert.equal(
            scene.props.some((p) => p.id === "restoration-stone"),
            !look.restoration.installed,
          );
          if (look.restoration.installAge !== undefined)
            assert.ok(!root, "root work is finished before the stone is placed");
          assert.deepEqual(scene.actors.map((p) => p.id).sort(), [
            "restoration-keeper",
            "restoration-mason",
          ]);
          const currentMason = scene.actors.find((a) => a.id === "restoration-mason").point;
          if (!reduced && lastMason) {
            const layout = housecallsLayout(view);
            const dx = ((currentMason.x - lastMason.point.x) * roadScale(width)) / layout.scale;
            const dy =
              ((currentMason.lane - lastMason.point.lane) * roadDepth(width, view.height)) /
              layout.scale;
            assert.ok(
              Math.hypot(dx, dy) <= (200 * (battle.time - lastMason.time)) / 1000 + 3,
              "mason walks between the inspection and stone placement",
            );
          }
          lastMason = { point: currentMason, time: battle.time };
          if ((look.restoration.installAge ?? 0) >= 900) {
            const mason = scene.actors.find((a) => a.id === "restoration-mason");
            const leon = battle.heroes.find((h) => h.id === "leon");
            const size = housecallsLayout(view).figureSize;
            const dx = Math.abs(mason.point.x - leon.x) * roadScale(width);
            const dy = Math.abs(mason.point.lane - leon.lane) * roadDepth(width, view.height);
            assert.ok(
              dx >= size * 0.45 || dy >= size * 0.9,
              `mason and Leon overlap at ${look.restoration.installAge}`,
            );
          }
          assert.ok(
            !battle.handheld?.some((item) => item.hero === "finn"),
            "injured Finn does not lift the stone",
          );
          state = settle(state, state.updatedAt + (assist ? 50 : 100));
          if (assist && state.squads[0].run)
            state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
        }
        assert.equal(state.done["berne-restoration"], 1);
        assert.ok(nodes.size >= 12);
        assert.ok(sawInstalled, "the repaired stone is visible before the run ends");
        assert.ok(sawGuidance, "Finn guides traffic while keeping his bandaged hand free");
        assert.ok(sawPlan, "Leon and the mason inspect the stone and plan together");
        assert.ok(sawRootRemoved, "root is removed by Aria before the stone is placed");
        if (reduced) {
          assert.equal(sawFade, false);
          assert.equal(sawRootFade, false);
        } else {
          assert.ok(sawFade, "the background changes behind a fade");
          assert.ok(sawRootFade, "root fades while Aria is working at it");
          assert.ok(sawStoneSide, "stone turns through the thick side view");
        }
      });

test("standalone rendering does not override an explicit comparison background", () => {
  const squad = testState(1000, 25, 40, 10000).squads[0];
  const input = {
    squad,
    startQuest: "berne-restoration",
    now: 1000,
    ready: true,
    storybookHeroes: true,
  };
  assert.equal(storybookAdventureInput(input).backgroundOverride, undefined);
  assert.equal(
    chapterRoadFrame({ ...input, backgroundOverride: "/custom.png" }).look.restoration,
    undefined,
  );
});
