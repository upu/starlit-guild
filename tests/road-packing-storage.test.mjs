import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { medicinePackingAssets as assets } from "../lib/road-medicine-packing.ts";
import { packingCarryPalms, packingTurnPalms, packingBags } from "../lib/road-packing-contacts.ts";
import { waterwayPalm } from "../lib/road-waterway-contacts.ts";
import { fixedRoadLayout } from "../lib/road-fixed-layout.ts";
import { packingBagAsset } from "../lib/road-packing-finish.ts";
import { roadScale, roadY } from "../lib/road-layout.ts";

const gap = (a, b, v) =>
  Math.hypot(
    (a.x - b.x) * roadScale(v.width),
    roadY(a.lane, v.height, v.width) - roadY(b.lane, v.height, v.width),
  );
for (const width of [374, 936])
  for (const completed of [false, true])
    test(`cold packing camp stays ${completed ? "filled" : "unstarted"} at ${width}`, () => {
      const state = testState(0, 11, 40, 10000),
        saved = JSON.stringify(state),
        motion = new RoadMotion(),
        view = { width, height: (width * 2) / 3 };
      let bottle;
      for (let time = 0; time < 6000; time += 50) {
        const frame = chapterRoadFrame(
          {
            squad: state.squads[0],
            startQuest: "medicine-packing",
            questComplete: completed,
            now: time,
            ready: true,
            paused: false,
            storybookHeroes: true,
            backgroundOverride: assets.bank,
          },
          false,
          1400,
          view,
        );
        const { battle } = motion.update(frame, "cold-packing", width, false, view.height),
          scene = battle.waterwayActions;
        assert.equal(
          scene.props.filter((p) => p.id?.startsWith("packing-stored-")).length,
          completed ? 10 : 0,
        );
        assert.ok(!scene.props.some((p) => p.id?.startsWith("packing-carried-")));
        const current = scene.props.find((p) => p.id === "packing-wrapped-medicine");
        assert.equal(!!current, !completed);
        if (current) {
          bottle ??= { ...current.point };
          assert.ok(gap(current.point, bottle, view) < 0.01);
        }
        assert.deepEqual(scene.poses, {});
      }
      assert.equal(JSON.stringify(state), saved);
    });
for (const width of [374, 936])
  for (const level of [18, 40])
    test(`five separated packet pairs stay in bags at ${width},Lv${level}`, () => {
      const view = { width, height: (width * 2) / 3 },
        motion = new RoadMotion(),
        layout = fixedRoadLayout(width, (width * 2) / 3);
      let state = act(
          testState(0, 11, level, 10000),
          { type: "start", id: "medicine-packing", readDeparture: true, value: false },
          0,
        ),
        identity;
      const stored = new Map(),
        steps = { aria: new Set(), leon: new Set() },
        turns = { aria: new Set(), leon: new Set() };
      let complete = false;
      for (let time = 0; time < 240000; time += 50) {
        state = settle(state, time);
        const saved = JSON.stringify(state);
        const frame = chapterRoadFrame(
          {
            squad: state.squads[0],
            startQuest: "medicine-packing",
            questComplete: !!state.done["medicine-packing"],
            now: time,
            ready: true,
            paused: false,
            storybookHeroes: true,
            backgroundOverride: assets.bank,
          },
          false,
          1400,
          view,
        );
        identity = roadPaintKey("a", state.squads[0].run, frame.look, identity);
        const { battle } = motion.update(frame, identity.key, width, false, view.height),
          scene = battle.waterwayActions;
        assert.equal(JSON.stringify(state), saved);
        for (const prop of scene.props.filter((p) => p.id?.startsWith("packing-stored-"))) {
          if (stored.has(prop.id)) assert.ok(gap(prop.point, stored.get(prop.id), view) < 0.01);
          else stored.set(prop.id, { ...prop.point });
        }
        for (const id of ["aria", "leon"]) {
          const hero = battle.heroes.find((h) => h.id === id),
            pose = scene.poses[id],
            parcel = scene.props.find((p) => p.id === `packing-carried-${id}`);
          const wrapped = scene.props.find(
            (p) => p.id === (id === "aria" ? "packing-wrapped-medicine" : "packing-wrapped-honey"),
          );
          assert.ok(!(parcel && wrapped), "one packet cannot remain on table while carried");
          const turnAsset = id === "aria" ? assets.ariaTurn : assets.leonTurn;
          if (parcel && pose?.asset === turnAsset) {
            turns[id].add(pose.frame);
            assert.equal(hero.walking, false);
            assert.ok(
              gap(
                parcel.point,
                waterwayPalm(hero, packingTurnPalms[id][pose.frame], 1, view),
                view,
              ) < 0.01,
            );
          }
          const walking =
            parcel &&
            (pose?.asset === assets.leonCarryWalk ||
              (pose?.asset === assets.ariaCarry && pose.frame >= 4));
          if (walking) {
            const stride = id === "aria" ? pose.frame - 4 : pose.frame;
            steps[id].add(stride);
            assert.ok(
              gap(
                parcel.point,
                waterwayPalm(hero, packingCarryPalms[id][1 + stride], hero.facing, view),
                view,
              ) < 0.01,
            );
          }
          const foot = {
            x: (hero.x - layout.world(0, 0).x) / (layout.world(1, 0).x - layout.world(0, 0).x),
            y:
              (hero.lane - layout.world(0, 0).lane) /
              (layout.world(0, 1).lane - layout.world(0, 0).lane),
          };
          assert.ok(
            !(foot.x > 825 && foot.x < 1075 && foot.y > 700 && foot.y < 760),
            "feet stay outside table legs",
          );
          for (const bag of Object.values(packingBags))
            assert.ok(
              Math.abs(foot.x - bag.x) > 30 || Math.abs(foot.y - bag.y) > 14,
              "feet do not step on bags",
            );
        }
        if (!state.squads[0].run) {
          assert.equal(stored.size, 10, "both bags are filled before engine arrival");
          for (const id of ["aria", "leon"])
            assert.equal(
              scene.props.find((p) => p.id === `packing-bag-${id}`).asset,
              packingBagAsset(3),
              "both flaps finish closing before arrival",
            );
          complete = true;
          break;
        }
      }
      assert.ok(complete);
      for (const id of ["aria", "leon"]) {
        assert.equal(steps[id].size, 4, `${id} walking frames ${[...steps[id]]}`);
        assert.equal(turns[id].size, 4);
      }
    });
