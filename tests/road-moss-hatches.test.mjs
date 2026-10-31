import test from "node:test";
import assert from "node:assert/strict";
import { RoadMossHatches } from "../lib/road-moss-hatches.ts";
import { waterwayLayout } from "../lib/road-waterway-layout.ts";
import {
  keeperPalms,
  keeperLanternPalms,
  mossHatchClosed,
  mossHatchPark,
} from "../lib/road-moss-hatch-layout.ts";
import { waterwayPalm } from "../lib/road-waterway-contacts.ts";
import { roadScale, roadY } from "../lib/road-layout.ts";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { waterwayBackgrounds } from "../lib/road-waterway-layout.ts";
import { mossRemovalAssets as assets } from "../lib/road-moss-removal-layout.ts";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { restorationVisualInput } from "../lib/restoration-visual-input.ts";
import { restorationHandoffState } from "../lib/restoration-handoff.ts";
import { stories } from "../lib/stories.ts";
import { applyMossWorkCaption } from "../lib/road-moss-work-caption.ts";

for (const completed of [false, true])
  test(`cold camp keeps inspection site ${completed ? "finished" : "unstarted"}`, () => {
    const state = testState(0, 8, 40, 10000),
      saved = JSON.stringify(state);
    const view = { width: 374, height: (374 * 2) / 3 },
      motion = new RoadMotion();
    for (let time = 0; time <= 6000; time += 50) {
      const input = storybookAdventureInput({
        squad: state.squads[0],
        startQuest: "tower-moss-removal",
        questComplete: completed,
        now: time,
        ready: true,
        paused: false,
      });
      const frame = chapterRoadFrame(input, false, 1400, view);
      const { battle } = motion.update(frame, "cold-camp", view.width, false, view.height);
      const site = battle.waterwayActions;
      assert.deepEqual(site.holes, []);
      assert.equal(
        site.props.filter((p) => p.id?.startsWith("stored-moss-basket-")).length,
        completed ? 2 : 0,
      );
      assert.equal(site.props.filter((p) => p.id?.startsWith("inspection-lid-")).length, 2);
    }
    assert.equal(JSON.stringify(state), saved);
  });

test("moss removal uses the painted default and preserves explicit comparison choices", () => {
  const input = {
    squad: testState(0, 8, 40, 10000).squads[0],
    startQuest: "tower-moss-removal",
    now: 123,
    ready: true,
    paused: false,
  };
  const painted = storybookAdventureInput(input);
  assert.equal(painted.backgroundOverride, assets.bank);
  assert.equal(painted.storybookHeroes, true);
  assert.equal(painted.squad, input.squad);
  assert.equal(painted.now, 123);
  const off = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(off), off);
  assert.equal(
    storybookAdventureInput({ ...input, backgroundOverride: "/comparison.webp" })
      .backgroundOverride,
    "/comparison.webp",
  );
});

const gap = (a, b, v) =>
  Math.hypot(
    (a.x - b.x) * roadScale(v.width),
    roadY(a.lane, v.height, v.width) - roadY(b.lane, v.height, v.width),
  );
const scene = () => ({ poses: {}, props: [], debrisHidden: true, closeContact: true });
test("keeper and tool-walk atlases share body scale and keep hair, hands and boots inside cells", async () => {
  for (const name of [
    "keeper-hatch-v1",
    "keeper-hatch-walk-v1",
    "keeper-lantern-v1",
    "aria-moss-walk-v2",
  ]) {
    const file = `public/storybook-study/${name}.webp`;
    const metrics = JSON.parse(await readFile(file.replace(".webp", "-metrics.json"), "utf8"));
    assert.equal(new Set(metrics.map((m) => m.scale)).size, 1);
    assert.ok(metrics.every((m) => m.baseline === 176));
    if (name === "keeper-hatch-v1") {
      assert.ok(metrics[1].height < metrics[0].height * 0.8);
      assert.ok(metrics[2].height < metrics[3].height, "rising pose remains lower than standing");
    }
    const { data, info } = await sharp(file)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++)
        if (x % 256 < 2 || x % 256 > 253 || y % 192 < 2 || y % 192 > 189)
          assert.ok(data[(y * info.width + x) * 4 + 3] <= 16);
  }
});
for (const width of [374, 936])
  test(`keeper opens both mouths and closes each cover at ${width}`, () => {
    const view = { width, height: (width * 2) / 3 },
      hatches = new RoadMossHatches(0),
      layout = waterwayLayout(width, (width * 2) / 3);
    const walking = new Set();
    let first = false,
      second = false,
      closedFirstBeforeSecond = false,
      firstLamp,
      lastLamp,
      previousLantern,
      returnedLamp = false,
      last;
    for (let time = 0; time <= 30000; time += 50) {
      const node = time < 6000 ? 2 : time < 19000 ? 9 : 14;
      hatches.update(time, node, false, time >= 19000);
      const s = scene();
      hatches.paint(s, view, time, [false, false]);
      last = s;
      const keeper = s.actors[0],
        lids = s.props.filter((p) => p.id.startsWith("inspection-lid"));
      const lantern = s.props.find((p) => p.id === "moss-inspection-lantern");
      assert.ok(lantern, "the same lantern stays visible before and after inspection");
      if (previousLantern)
        assert.ok(
          gap(lantern.point, previousLantern, view) < Math.max(8, width * 0.016),
          "the lantern stays near its previous position while the keeper moves and turns",
        );
      previousLantern = lantern.point;
      if (hatches.inspecting) {
        firstLamp ??= time;
        lastLamp = time;
        assert.equal(node, 14);
        assert.ok(
          hatches.openHoles().includes(1),
          "the last mouth is still open during inspection",
        );
        assert.equal(keeper.pose.asset, assets.keeperLantern);
        assert.equal(keeper.pose.frame, 0, "the keeper kneels by the open mouth");
        assert.ok(
          gap(lantern.point, waterwayPalm(keeper.point, keeperLanternPalms[0], 1, view), view) <
            0.01,
          "the lantern hangs from the keeper's hand",
        );
      }
      if (hatches.inspecting || hatches.returningLantern) {
        const look = { work: { label: "" } };
        applyMossWorkCaption(look, { enemies: [] }, s, {
          node,
          phase: "shuttle",
          filled: true,
          hatches,
          shuttle: { finished: true, departing: false },
        });
        assert.equal(
          look.work.label,
          hatches.inspecting ? "灯りで点検口の奥を確かめる" : "灯りを元の場所に戻す",
        );
        if (hatches.returningLantern) returnedLamp = true;
      }
      assert.equal(lids.length, 2);
      assert.equal(new Set(lids.map((p) => p.id)).size, 2);
      assert.ok(
        roadY(keeper.point.lane, view.height, width) < view.height - 2,
        "boots stay inside the phone crop",
      );
      if (time < 6000 && hatches.ready()) first = true;
      if (node === 9 && hatches.ready()) {
        second = true;
        assert.ok(!hatches.openHoles().includes(0));
        closedFirstBeforeSecond = true;
      }
      if (keeper.pose.asset === assets.keeper && keeper.pose.frame >= 4) {
        walking.add(keeper.pose.frame);
        const lid = lids.find((p) => p.verticalScale < 1),
          hand = waterwayPalm(keeper.point, keeperPalms[keeper.pose.frame], 1, view);
        const edge = {
          ...lid.point,
          x: lid.point.x + (76 * layout.backdrop.width) / 1536 / roadScale(width),
        };
        assert.ok(gap(edge, hand, view) < 0.01, "held stone edge stays in both palms");
      }
    }
    assert.ok(first && second && closedFirstBeforeSecond);
    assert.ok(
      firstLamp !== undefined && lastLamp - firstLamp >= 1400,
      "the inspection is visible before closing",
    );
    assert.ok(returnedLamp, "the return caption is shown before replacing the lid");
    assert.equal(walking.size, 4);
    assert.deepEqual(hatches.openHoles(), []);
    for (const index of [0, 1]) {
      const p = mossHatchClosed(index),
        lid = last.props.find((p) => p.id === `inspection-lid-${index}`);
      assert.ok(gap(lid.point, layout.world(p.x, p.y), view) < 0.01);
    }
    assert.notDeepEqual(mossHatchPark, mossHatchClosed(0));
  });

for (const width of [374, 936])
  for (const level of [18, 40])
    test(`adventure waits for covers and stays outside open mouths at ${width},Lv${level}`, () => {
      const view = { width, height: (width * 2) / 3 },
        motion = new RoadMotion(),
        layout = waterwayLayout(width, (width * 2) / 3);
      let state = act(
        testState(0, 8, level, 10000),
        { type: "start", id: "tower-moss-removal", readDeparture: true, value: false },
        0,
      );
      let openedFirst = false,
        openedSecond = false,
        closed = false,
        previousSquad = null,
        savedCompletion = null;
      for (let time = 0; time < 150000; time += 50) {
        if (state.squads[0].run) previousSquad = state.squads[0];
        state = settle(state, time);
        const finalizing = !state.squads[0].run;
        if (finalizing && !savedCompletion) savedCompletion = JSON.stringify(state.squads[0]);
        const actual = {
          squad: state.squads[0],
          startQuest: "tower-moss-removal",
          now: time,
          ready: true,
          paused: false,
          storybookHeroes: true,
          backgroundOverride: waterwayBackgrounds.cleared,
        };
        const visual = restorationVisualInput(actual, {
          quest: "tower-moss-removal",
          active: true,
          squad: finalizing ? previousSquad : state.squads[0],
          skipped: false,
        });
        if (finalizing) {
          const ending = stories.find((story) => story.id === "tower-moss-removal-return");
          assert.ok(
            restorationHandoffState({
              enabled: true,
              quest: "tower-moss-removal",
              squad: state.squads[0],
              ending,
              view: "adventure",
              sheet: null,
              ready: true,
              snapshot: previousSquad,
              finished: null,
            }).waiting,
          );
          assert.equal(visual.mossFinalizing, true);
        }
        const frame = chapterRoadFrame(visual, false, 1400, view);
        const { battle, look } = motion.update(frame, "full-hatches", width, false, view.height),
          s = battle.waterwayActions;
        assert.ok(s.actors.some((actor) => actor.id === "tower-keeper"));
        for (const index of s.holes) {
          const center = layout.world(1120 + index * 30, 620 - index * 135),
            sx = layout.backdrop.width / 1536;
          for (const h of battle.heroes) {
            const x = Math.abs(h.x - center.x) * roadScale(width),
              y = Math.abs(
                roadY(h.lane, view.height, width) - roadY(center.lane, view.height, width),
              );
            assert.ok(x >= 120 * sx || y >= 68 * sx, "feet never cross an open mouth");
          }
        }
        if (s.poses.aria?.asset === assets.cycle && s.poses.aria.frame > 0) {
          const index = look.waterway.node >= 9 ? 1 : 0;
          assert.ok(s.holes.includes(index), "scraping starts after opening");
          if (index === 0) openedFirst = true;
          else openedSecond = true;
        }
        if (finalizing && battle.mossVisualComplete) {
          assert.equal(s.holes.length, 0, "both covers finish closing before arrival");
          assert.equal(s.props.filter((p) => p.id?.startsWith("stored-moss-basket-")).length, 2);
          assert.equal(
            JSON.stringify(state.squads[0]),
            savedCompletion,
            "visual wait does not change saved squad",
          );
          closed = true;
          break;
        }
      }
      assert.ok(
        openedFirst && openedSecond && closed,
        JSON.stringify({ openedFirst, openedSecond, closed }),
      );
    });
