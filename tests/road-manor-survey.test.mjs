import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { LUNCH_INTERLUDE, chapterThreeWork } from "../lib/chapter-three.ts";
import { chapterThreeBanter } from "../lib/chapter-three-banter.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { manorSurveyAssets } from "../lib/road-manor-survey.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";

for (const width of [374, 936])
  test(`survey transports pots and reaches the conversation tableau at ${width}`, () => {
    const view = { width, height: (width * 2) / 3 },
      motion = new RoadMotion();
    let state = act(
        act(testState(1000, 23, 40, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
        { type: "start", id: "manor-survey", readDeparture: true, value: false },
        1000,
      ),
      identity,
      previousActive,
      wasGathering = false;
    const nodes = new Set(),
      poses = new Set(),
      delivered = new Set();
    for (let i = 0; i < 4000; i++) {
      const before = JSON.stringify(state);
      const raw = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: "manor-survey",
          now: state.updatedAt,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: manorSurveyAssets.bank,
          questComplete: !!state.done["manor-survey"],
        },
        false,
        1400,
        view,
      );
      identity = roadPaintKey("survey", state.squads[0].run ?? null, raw.look, identity);
      const { battle, look } = motion.update(raw, identity.key, width, false, view.height);
      assert.equal(JSON.stringify(state), before);
      assert.equal(look.background, manorSurveyAssets.bank);
      assert.equal(battle.enemies.length, 0);
      const site = look.manorSurvey,
        scene = battle.waterwayActions;
      nodes.add(site.node);
      if (state.squads[0].run) assert.equal(site.node, state.squads[0].run.node);
      if (look.work)
        assert.equal(look.work.label, chapterThreeWork("manor-survey", site.node).name);
      assert.equal(scene.actors[0].id, "survey-gardener");
      const gathering = !!site.gathering;
      if (gathering !== wasGathering) assert.equal(site.fade, 1);
      wasGathering = gathering;
      if (gathering) {
        assert.equal(scene.actors[0].pose.frame, 6);
        assert.equal(scene.poses.finn.asset, manorSurveyAssets.gloves);
        assert.ok(scene.props.some((p) => p.id === "survey-return-pot"));
        assert.ok(scene.props.some((p) => p.id === "survey-rucksack"));
      } else {
        const active = scene.props.find((p) => p.id === "survey-active");
        if (previousActive && !active) {
          const placed = scene.props.find(
            (p) => p.id === `survey-pot-${Math.floor(previousActive.node / 3)}`,
          );
          assert.ok(placed, "carried pot stays visible after being put down");
          assert.ok(Math.abs(placed.point.x - previousActive.point.x) < 0.01);
          assert.ok(Math.abs(placed.point.lane - previousActive.point.lane) < 0.01);
        }
        previousActive = active ? { ...active, node: site.node } : undefined;
        for (const p of scene.props.filter((p) => p.id?.startsWith("survey-pot-")))
          delivered.add(p.id);
        for (const [id, pose] of Object.entries(scene.poses)) poses.add(`${id}:${pose.asset}`);
      }
      if (!state.squads[0].run) {
        assert.ok(gathering);
        assert.equal(site.fade, 0);
        break;
      }
      state = settle(state, state.updatedAt + 50);
    }
    assert.equal(state.done["manor-survey"], 1);
    assert.equal(nodes.size, 15);
    assert.equal(delivered.size, 5);
    assert.ok(poses.has(`mira:${manorSurveyAssets.miraWork}`));
    assert.ok(poses.has(`leon:${manorSurveyAssets.leonNotes}`));
  });

test("survey defaults to the courtyard only for painted mode", () => {
  const state = testState(1000, 23, 40, 10000);
  const input = { squad: state.squads[0], startQuest: "manor-survey", now: 1000, ready: true };
  assert.equal(storybookAdventureInput(input).backgroundOverride, manorSurveyAssets.bank);
  const legacy = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(legacy), legacy);
  assert.equal(
    storybookAdventureInput({ ...input, backgroundOverride: "/custom.png" }).backgroundOverride,
    "/custom.png",
  );
});

test("survey dialogue refers to garden work after the kitchen pot is returned", () => {
  const lines = chapterThreeBanter({ quest: "manor-survey", node: 0, phase: "move" });
  assert.match(lines.map((line) => line.text).join(" "), /鉢/);
  assert.doesNotMatch(lines.map((line) => line.text).join(" "), /鍋/);
  assert.ok(lines.every((line) => line.expression));
});

for (const reduced of [false, true])
  test(`survey arrives before completion with repeated help, reduced=${String(reduced)}`, () => {
    const view = { width: 374, height: (374 * 2) / 3 },
      motion = new RoadMotion();
    let state = act(
        act(testState(1000, 23, 100, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
        { type: "start", id: "manor-survey", readDeparture: true, value: false },
        1000,
      ),
      identity;
    for (let i = 0; i < 4000; i++) {
      const raw = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: "manor-survey",
          now: state.updatedAt,
          ready: true,
          storybookHeroes: true,
          backgroundOverride: manorSurveyAssets.bank,
          questComplete: !!state.done["manor-survey"],
        },
        reduced,
        1400,
        view,
      );
      identity = roadPaintKey("survey-assisted", state.squads[0].run ?? null, raw.look, identity);
      const { look } = motion.update(raw, identity.key, view.width, reduced, view.height);
      if (!state.squads[0].run) {
        assert.equal(look.manorSurvey.gathering, true);
        assert.equal(look.manorSurvey.fade, 0);
        break;
      }
      state = settle(state, state.updatedAt + 50);
      if (state.squads[0].run && i % 4 === 0)
        state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
    }
    assert.equal(state.done["manor-survey"], 1);
  });
