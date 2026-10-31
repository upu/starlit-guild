import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { RoadGait } from "../lib/road-gait.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { berneJourneyAssets, berneGateLayout, berneGroundY } from "../lib/road-berne-journey.ts";
import {
  isScrollingStorybookRoad,
  roadForestTileFlip,
  roadSceneBackdrop,
} from "../lib/road-scrolling-background.ts";
import { roadY } from "../lib/road-layout.ts";
import { LUNCH_INTERLUDE } from "../lib/chapter-three.ts";

test("Finn's standing head no longer dwarfs Leon's at the same sprite height", async () => {
  async function headWidth(path, frame = 0) {
    const { data, info } = await sharp(path)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let left = 192,
      right = -1;
    for (let y = 28; y < 65; y++)
      for (let x = 0; x < 192; x++)
        if (data[(y * info.width + frame * 192 + x) * 4 + 3] > 128) {
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
    return right - left + 1;
  }
  const finn = await headWidth("public/storybook-study/finn-conversation-balanced-v3.webp");
  const previous = await headWidth("public/storybook-study/finn-conversation-v2.webp");
  assert.ok(finn < previous * 0.85);
  for (let frame = 0; frame < 4; frame++) {
    const current = await headWidth(
      "public/storybook-study/finn-conversation-balanced-v3.webp",
      frame,
    );
    for (const actor of ["aria", "leon"]) {
      const reference = await headWidth(
        `public/storybook-study/${actor}-conversation-v1.webp`,
        frame,
      );
      assert.ok(Math.abs(current - reference) <= 8, `${actor} and Finn differ in pose ${frame}`);
    }
  }
});

test("Finn's walking heads and baseline stay close to his standing proportions", async () => {
  for (const name of ["finn-walk-balanced-v3", "finn-night-walk-balanced-v2"]) {
    const metrics = JSON.parse(
      await readFile(`public/storybook-study/${name}-metrics.json`, "utf8"),
    );
    const standingName = name.includes("night")
      ? "finn-injury-balanced-v2"
      : "finn-conversation-balanced-v3";
    const standing = JSON.parse(
      await readFile(`public/storybook-study/${standingName}-metrics.json`, "utf8"),
    );
    const standingFrame = name.includes("night") ? 5 : 0;
    const { data, info } = await sharp(`public/storybook-study/${name}.webp`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(metrics.length, 4);
    for (const [frame, metric] of metrics.entries()) {
      assert.equal(metric.top + metric.height, 176);
      assert.ok(Math.abs(metric.height - 148) <= 5);
      assert.ok(Math.abs(metric.headX - metrics[0].headX) <= 1);
      assert.ok(Math.abs(metric.headX - standing[standingFrame].headX) <= 1);
      let left = 192,
        right = -1;
      for (let y = 28; y < 65; y++)
        for (let x = 0; x < 192; x++)
          if (data[(y * info.width + frame * 192 + x) * 4 + 3] > 128) {
            left = Math.min(left, x);
            right = Math.max(right, x);
          }
      assert.ok(right - left + 1 <= 56, `${name} frame ${frame} head too wide`);
    }
  }
});

test("Finn keeps body scale and head alignment across4 carrying strides, and crouches lower", async () => {
  const metrics = JSON.parse(
    await readFile("public/storybook-study/finn-handheld-balanced-v2-metrics.json", "utf8"),
  );
  assert.equal(metrics.length, 8);
  assert.equal(new Set(metrics.slice(0, 4).map((m) => m.scale)).size, 1);
  assert.equal(new Set(metrics.slice(4).map((m) => m.scale)).size, 1);
  assert.ok(metrics.every((m) => m.baseline === 176 && m.top + m.height === 176));
  assert.ok(metrics[1].height < metrics[0].height * 0.85);
  for (const m of metrics.slice(4)) {
    assert.ok(Math.abs(m.height - metrics[0].height) <= 5);
    assert.ok(
      Math.abs(m.headX - metrics[0].headX) < 1,
      "head cannot jump to follow a forward boot",
    );
  }
  const { data, info } = await sharp("public/storybook-study/finn-handheld-balanced-v2.webp")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.deepEqual([info.width, info.height], [768, 384]);
  for (let y = 0; y < 384; y++)
    for (let x = 0; x < 768; x++)
      if (x % 192 < 2 || x % 192 > 189 || y % 192 < 2 || y % 192 > 189)
        assert.equal(
          data[(y * info.width + x) * 4 + 3],
          0,
          "transparent gutter and complete boots",
        );
});

for (const width of [374, 936])
  test(`four-person road retrieves three supplies through five battles at${width}`, () => {
    const height = (width * 2) / 3,
      motion = new RoadMotion(),
      gait = new RoadGait(),
      seen = {},
      cycles = { leon: 0, mira: 0, finn: 0 },
      prior = {},
      strides = new Set(),
      grounds = new Map(),
      nodes = new Set();
    let s = act(
        act(testState(1000, 18, 24, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
        { type: "start", id: "berne-road", readDeparture: true, value: false },
        1000,
      ),
      identity,
      last,
      endLook;
    assert.deepEqual(s.squads[0].members, ["aria", "leon", "mira", "finn"]);
    for (let step = 0; step < 18000; step++) {
      const before = JSON.stringify(s),
        input = {
          squad: s.squads[0],
          startQuest: "berne-road",
          now: s.updatedAt,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: berneJourneyAssets.road,
          questComplete: !!s.done["berne-road"],
        };
      const raw = chapterRoadFrame(input, false, 1400, { width, height });
      identity = roadPaintKey("berne", s.squads[0].run ?? null, raw.look, identity);
      const { battle: b, look } = motion.update(raw, identity.key, width, false, height);
      last = b;
      endLook = look;
      assert.equal(JSON.stringify(s), before);
      assert.equal(b.journeyCart, undefined);
      if (look.work) {
        assert.equal(look.work.cargo, false);
        assert.equal(look.puller, null);
      }
      if (s.squads[0].run) nodes.add(s.squads[0].run.node);
      const backdrop = roadSceneBackdrop({
        width,
        height,
        imageWidth: 1536,
        imageHeight: 1024,
        camera: b.distance,
        stage: b.stage,
        length: look.length,
        scrolling: true,
      });
      const groundY = berneGroundY(backdrop.y, backdrop.height);
      for (const h of b.heroes) {
        assert.ok(roadY(h.lane, height, width) < height - 4, `${h.id} feet clip`);
        const sourceY = (roadY(h.lane, height, width) - groundY) / backdrop.height;
        assert.ok(
          sourceY > 0.3 && sourceY < 0.79,
          `${h.id} stands outside road strip at${sourceY}: time=${b.time},lane=${h.lane},camera=${b.distance},feet=${JSON.stringify(b.heroes.map((h) => [h.id, h.x, h.lane, h.walking]))}`,
        );
      }
      for (const item of b.handheld) {
        (seen[item.hero] ??= new Set()).add(item.phase);
        if (item.phase === "ground") {
          if (grounds.has(item.hero)) assert.deepEqual(item.point, grounds.get(item.hero));
          else grounds.set(item.hero, item.point);
        } else grounds.delete(item.hero);
        if (prior[item.hero] === "lift" && item.phase === "held") cycles[item.hero]++;
        prior[item.hero] = item.phase;
        const hero = b.heroes.find((h) => h.id === item.hero);
        if (item.hero === "finn" && item.phase === "held" && hero.walking)
          strides.add(gait.frame(hero, { width, height, stage: b.stage }));
      }
      if (!s.squads[0].run && b.handheld.every((i) => i.phase === "held")) break;
      s = settle(s, s.updatedAt + 50);
    }
    assert.equal(s.done["berne-road"], 1);
    // Each escort ambush consumes the following battle node in the real engine.
    assert.deepEqual([...nodes], [0, 2, 3, 5, 6, 8, 9, 11, 12, 14]);
    for (const id of ["leon", "mira", "finn"]) {
      assert.deepEqual([...seen[id]].sort(), ["ground", "held", "lift", "lower"]);
      assert.ok(cycles[id] >= 5, `${id} retrieved${cycles[id]} times`);
    }
    assert.equal(strides.size, 4);
    assert.ok(last.handheld.every((i) => i.phase === "held"));
    const arrivalAria = last.heroes.find((h) => h.id === "aria");
    for (let step = 0; step < 40; step++) {
      s = settle(s, s.updatedAt + 50);
      const frame = chapterRoadFrame(
        {
          squad: s.squads[0],
          startQuest: "berne-road",
          now: s.updatedAt,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: berneJourneyAssets.road,
          questComplete: true,
        },
        false,
        1400,
        { width, height },
      );
      const { battle } = motion.update(frame, identity.key, width, false, height);
      const aria = battle.heroes.find((h) => h.id === "aria");
      assert.ok(Math.abs(aria.x - arrivalAria.x) < 8, "Aria stays with the party after arrival");
    }
    assert.equal(
      berneGateLayout({ width, height }, last.distance, endLook.length, last.stage).visible,
      true,
    );
  });

test("Berne road repeats without a gate on each tile; its landmark stays at the destination", () => {
  assert.equal(isScrollingStorybookRoad(berneJourneyAssets.road), true);
  assert.equal(roadForestTileFlip(berneJourneyAssets.road, 0, 374, 380, "forest"), false);
  const a = berneGateLayout({ width: 374, height: 249 }, 0, 6000, "forest"),
    b = berneGateLayout({ width: 374, height: 249 }, 6000, 6000, "forest");
  assert.equal(a.visible, false);
  assert.equal(b.visible, true);
  assert.equal(a.world, b.world);
});
