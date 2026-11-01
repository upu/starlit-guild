import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadX, roadY } from "../lib/road-layout.ts";
import { handheldFrame, handheldPoint, handheldWidth } from "../lib/road-handheld.ts";
import { mossBedsAssets } from "../lib/road-moss-beds.ts";
import { mossBedsLayout } from "../lib/road-moss-beds-layout.ts";
import { presentLicoRecords, prepareLicoRecords, recordsPoint } from "../lib/road-lico-records.ts";
import { recordsContactTarget } from "../lib/road-lico-contacts.ts";
import {
  licoRecordsBanterCue,
  licoRecordsPatientBanter,
  licoRecordsBanterContext,
  licoRecordsEncounterStopped,
  licoRecordsRetainedBanter,
} from "../lib/chapter-four-battle-banter.ts";
import { startBanter, switchBanter, retainBanter } from "../lib/banter-exchange.ts";
import { journeyBanter } from "../lib/stories.ts";
import { waterwayAt } from "../lib/road-waterway-contacts.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { RPG_CAMERA_SCALE } from "../lib/rpg-camera.ts";
import { fixedFigureScale } from "../lib/road-fixed-figure-scale.ts";

const quest = "lico-records";
test("the last observed smoke exchange survives an immediately finished encounter", () => {
  const state = stateAtBattle();
  const run = state.squads[0].run;
  const enemy = run.enemies.find((value) => value.trick === "lico");
  enemy.actions = 1;
  const lines = licoRecordsRetainedBanter(run, "aria");
  assert.match(lines[0].text, /しびれるだけ/);
  assert.ok(lines.some((line) => line.speaker === "mira" && /支える/.test(line.text)));
  const withMiraAffected = licoRecordsRetainedBanter(run, "mira");
  assert.ok(
    withMiraAffected.some((line) => line.speaker === "mira" && /足がしびれて/.test(line.text)),
  );
  enemy.hp = 0;
  assert.deepEqual(licoRecordsRetainedBanter(run), []);
});
test("the confrontation replaces earlier route dialogue and does not queue it again after defeat", () => {
  const state = stateAtBattle();
  const run = state.squads[0].run;
  const bossLines = journeyBanter(state, state.squads[0], state.updatedAt);
  const oldRoute = [{ speaker: "leon", text: "古い道中の会話" }];
  const encounter = switchBanter(startBanter(oldRoute), bossLines);
  assert.equal(licoRecordsBanterContext(run), "lico-records-confrontation");
  assert.equal(licoRecordsEncounterStopped(run), false);
  assert.equal(encounter.lines[0].speaker, "lico");
  run.enemies.forEach((enemy) => {
    enemy.hp = 0;
  });
  assert.equal(licoRecordsEncounterStopped(run), true);
  // The stopped encounter supplies no newly generated route lines to the queue.
  const held = retainBanter(
    encounter,
    licoRecordsEncounterStopped(run) ? [] : journeyBanter(state, state.squads[0], state.updatedAt),
  );
  assert.deepEqual(held.pending, []);
  assert.equal(held.history[0].text, oldRoute[0].text);
});
test("the reflector and sample dish stay at their return-story locations on the shared painting", () => {
  const cue = studyCue("lico-records-return", 0, true);
  for (const id of ["reflector", "samples"]) {
    const item = cue.items.find((value) => value.id === id);
    const storyX = (0.5 * (1 - RPG_CAMERA_SCALE) + (RPG_CAMERA_SCALE * item.x) / 100) * 1536;
    // The story world's transform origin is 50% 75%, with a 12% upward translation.
    const storyY =
      (0.75 * (1 - RPG_CAMERA_SCALE) - 0.12 + RPG_CAMERA_SCALE * (1 - item.bottom / 100)) * 1024;
    const [x, y] = recordsPoint(id, false);
    assert.ok(Math.abs(x - storyX) < 4, `${id} x`);
    assert.ok(Math.abs(y - storyY) < 4, `${id} y`);
  }
});

test("the cast keeps the return scene's figure-to-background scale", () => {
  const cue = studyCue("lico-records-return", 0, true);
  const expected = (cue.cell / 100) * RPG_CAMERA_SCALE;
  const state = stateAtBattle();
  for (const view of [
    { width: 936, height: 624 },
    { width: 390, height: 740 },
  ]) {
    const raw = chapterRoadFrame(
      storybookAdventureInput({
        squad: state.squads[0],
        now: state.updatedAt,
        startQuest: quest,
        ready: true,
      }),
      false,
      1400,
      view,
    );
    const layout = mossBedsLayout(view);
    const imageWidth = layout.portrait ? 1024 : 1536;
    const spriteCell = 192 * 0.9 * layout.scale * fixedFigureScale(raw.look, view);
    assert.ok(Math.abs(spriteCell / layout.backdrop.width - expected) < 0.001);
    assert.equal(layout.backdrop.width, (imageWidth * layout.scale) / (layout.portrait ? 0.78 : 1));
    const drawn = new RoadMotion().update(raw, "records-scale", view.width, true, view.height);
    const lico = drawn.battle.waterwayActions.actors.find((actor) => actor.id === "lico-at-beds");
    assert.ok(Math.abs(lico.size - layout.figureRatio * fixedFigureScale(raw.look, view)) < 1e-9);
    for (const item of drawn.battle.handheld)
      assert.ok(Math.abs(item.sizeScale - lico.size) < 1e-9);
  }
});

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 740 },
]) {
  test(`the 4-7 handoff returns Lico to the stool before completion at ${view.width}px`, () => {
    const state = stateAtBattle(),
      before = JSON.stringify(state),
      motion = new RoadMotion();
    const input = storybookAdventureInput({
      squad: state.squads[0],
      now: state.updatedAt,
      startQuest: quest,
      ready: true,
    });
    const draw = (elapsed, closing, reduced = false) =>
      motion.update(
        chapterRoadFrame(
          { ...input, recordsClosing: closing, now: state.updatedAt + elapsed },
          reduced,
          1400,
          view,
        ),
        "records-transition",
        view.width,
        reduced,
        view.height,
      );
    const running = draw(0, false);
    const actor = (frame, id) =>
      frame.battle.waterwayActions.actors.find((value) => value.id === id);
    assert.ok(actor(running, "keeper-at-beds"));
    for (const id of ["lico-stool", "lap-board", "reflector-cover", "records", "lico-book"])
      assert.ok(
        running.battle.waterwayActions.props.some((item) => item.id === id),
        id,
      );
    const steps = [];
    for (let elapsed = 50; elapsed <= 2200; elapsed += 50) steps.push(draw(elapsed, true));
    assert.equal(steps[0].battle.enemies.length, 0);
    assert.equal(steps[0].look.mossBeds.visualComplete, false);
    assert.equal(
      actor(steps[0], "lico-at-beds").pose.asset,
      "/storybook-study/lico-walk-ponytail-v2.webp",
    );
    assert.ok(
      steps.some(
        (step) =>
          actor(step, "lico-at-beds").pose.asset ===
          "/storybook-study/lico-records-sit-transition-v1.webp",
      ),
    );
    const last = steps.at(-1);
    assert.equal(actor(last, "lico-at-beds").pose.frame, 4);
    assert.equal(
      actor(last, "lico-at-beds").pose.asset,
      "/storybook-study/lico-field-records-ponytail-v1.webp",
    );
    assert.equal(last.look.mossBeds.visualComplete, true);
    const reduced = new RoadMotion().update(
      chapterRoadFrame({ ...input, recordsClosing: true }, true, 1400, view),
      "reduced-records-transition",
      view.width,
      true,
      view.height,
    );
    assert.equal(reduced.look.mossBeds.visualComplete, true);
    assert.equal(
      actor(reduced, "lico-at-beds").pose.asset,
      "/storybook-study/lico-field-records-ponytail-v1.webp",
    );
    assert.equal(JSON.stringify(state), before);
  });
}

for (const view of [
  { width: 388, height: 740 },
  { width: 936, height: 624 },
])
  for (const patient of ["aria", "leon", "finn"])
    test(`after helping ${patient} the party retrieves its belongings at ${view.width}px`, () => {
      const state = stateAtBattle(),
        motion = new RoadMotion();
      const input = storybookAdventureInput({
        squad: state.squads[0],
        now: state.updatedAt,
        startQuest: quest,
        ready: true,
      });
      let frame;
      for (let ms = 0; ms <= 40000; ms += 50) {
        const cue = ms < 2000 ? "other" : ms < 10000 ? "support" : ms < 15000 ? "bottle" : "other";
        frame = motion.update(
          chapterRoadFrame(
            {
              ...input,
              now: state.updatedAt + ms,
              recordsClosing: ms >= 15000,
              recordsDialogue: { cue, patient },
            },
            false,
            1400,
            view,
          ),
          "contact-belongings",
          view.width,
          false,
          view.height,
        );
        if (ms >= 15000 && frame.look.mossBeds.visualComplete) break;
      }
      assert.equal(
        frame.look.mossBeds.visualComplete,
        true,
        JSON.stringify({
          items: frame.battle.handheld,
          heroes: frame.battle.heroes.map(({ id, x, lane, walking }) => ({ id, x, lane, walking })),
        }),
      );
      for (const item of frame.battle.handheld) assert.equal(item.phase, "held", item.hero);
    });

for (const view of [
  { width: 936, height: 624 },
  { width: 388, height: 740 },
])
  for (const id of ["aria", "leon", "mira", "finn"])
    test(`an incapacitated ${id} rests, rises and recovers belongings before completion at ${view.width}px`, () => {
      const state = stateAtBattle(),
        motion = new RoadMotion();
      state.squads[0].run.health[id].hp = 0;
      const before = JSON.stringify(state);
      const input = storybookAdventureInput({
        squad: state.squads[0],
        now: state.updatedAt,
        startQuest: quest,
        ready: true,
      });
      let frame;
      const seen = new Set();
      for (let ms = 0; ms <= 30000; ms += 50) {
        frame = motion.update(
          chapterRoadFrame(
            { ...input, now: state.updatedAt + ms, recordsClosing: ms >= 2000 },
            false,
            1400,
            view,
          ),
          "injured-carrier",
          view.width,
          false,
          view.height,
        );
        const hero = frame.battle.heroes.find((value) => value.id === id);
        if (hero.recordsRecovery) seen.add(hero.recordsRecovery);
        assert.equal(hero.hp, 0, "the health display retains the real battle result");
        if (hero.recordsRecovery && hero.recordsRecovery !== "ready")
          assert.equal(frame.look.mossBeds.visualComplete, false);
        if (ms >= 2000 && frame.look.mossBeds.visualComplete) break;
      }
      assert.equal(frame.look.mossBeds.visualComplete, true);
      assert.deepEqual([...seen], ["resting", "rising-low", "rising-high", "ready"]);
      const item = frame.battle.handheld.find((value) => value.hero === id);
      if (item) assert.equal(item.phase, "held");
      assert.equal(
        JSON.stringify(state),
        before,
        "presentation must not alter the saved health or status",
      );
    });

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 740 },
])
  for (const id of ["aria", "mira", "finn"])
    test(`a temporarily paralyzed ${id} collects their item before completion at ${view.width}px`, () => {
      const state = stateAtBattle(),
        motion = new RoadMotion(),
        start = state.updatedAt;
      state.squads[0].run.actors.find((actor) => actor.hero === id).paralyzedUntil = start + 5000;
      const before = JSON.stringify(state);
      const input = storybookAdventureInput({
        squad: state.squads[0],
        now: start,
        startQuest: quest,
        ready: true,
      });
      let frame,
        waited = false;
      for (let ms = 0; ms <= 20000; ms += 50) {
        frame = motion.update(
          chapterRoadFrame(
            { ...input, now: start + ms, recordsClosing: ms >= 2000 },
            false,
            1400,
            view,
          ),
          "paralyzed-carrier",
          view.width,
          false,
          view.height,
        );
        if (ms >= 3900 && ms < 5000) {
          const carrier = frame.battle.heroes.find((hero) => hero.id === id);
          assert.equal(carrier.paralyzed, true);
          assert.equal(frame.battle.handheld.find((item) => item.hero === id).phase, "ground");
          assert.equal(frame.look.mossBeds.visualComplete, false);
          waited = true;
        }
        if (ms >= 5000 && frame.look.mossBeds.visualComplete) break;
      }
      assert.ok(waited);
      assert.equal(frame.look.mossBeds.visualComplete, true);
      assert.equal(frame.battle.handheld.find((item) => item.hero === id).phase, "held");
      assert.equal(
        JSON.stringify(state),
        before,
        "presentation must not alter the saved health or status",
      );
    });

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 740 },
]) {
  test(`the three belongings are put down and retrieved before the 4-7 return at ${view.width}px`, () => {
    const state = stateAtBattle(),
      motion = new RoadMotion(),
      original = JSON.stringify(state);
    const input = storybookAdventureInput({
      squad: state.squads[0],
      now: state.updatedAt,
      startQuest: quest,
      ready: true,
    });
    const seen = new Map(["aria", "mira", "finn"].map((id) => [id, new Set()]));
    let last;
    for (let ms = 0; ms <= 12000; ms += 50) {
      const closing = ms >= 3000;
      const frame = chapterRoadFrame(
        { ...input, recordsClosing: closing, now: state.updatedAt + ms },
        false,
        1400,
        view,
      );
      last = motion.update(frame, "belongings", view.width, false, view.height);
      for (const item of last.battle.handheld ?? []) seen.get(item.hero)?.add(item.phase);
      if (closing && last.look.mossBeds.visualComplete) break;
    }
    for (const id of ["aria", "mira", "finn"]) {
      assert.deepEqual(
        [...seen.get(id)].sort(),
        ["ground", "held", "lift", "lower"],
        `${id} puts down and picks up`,
      );
      assert.equal(last.battle.handheld.find((item) => item.hero === id).phase, "held");
    }
    assert.equal(last.look.mossBeds.visualComplete, true, "the completion screen must not hang");
    assert.equal(last.battle.distance, 0, "the camera remains on the shared garden");
    assert.equal(JSON.stringify(state), original, "presentation must not modify the save");
  });
}
test("two defeated carriers both recover and retrieve their items before completion", () => {
  const state = stateAtBattle(),
    motion = new RoadMotion();
  state.squads[0].run.health.aria.hp = 0;
  state.squads[0].run.health.mira.hp = 0;
  const before = JSON.stringify(state);
  const view = { width: 390, height: 740 };
  const input = storybookAdventureInput({
    squad: state.squads[0],
    now: state.updatedAt,
    startQuest: quest,
    ready: true,
  });
  let frame;
  for (let ms = 0; ms <= 30000; ms += 50) {
    frame = motion.update(
      chapterRoadFrame(
        { ...input, now: state.updatedAt + ms, recordsClosing: ms >= 2000 },
        false,
        1400,
        view,
      ),
      "two-recoveries",
      view.width,
      false,
      view.height,
    );
    if (ms >= 2000 && frame.look.mossBeds.visualComplete) break;
  }
  assert.equal(frame.look.mossBeds.visualComplete, true);
  for (const id of ["aria", "mira"]) {
    assert.equal(frame.battle.heroes.find((hero) => hero.id === id).recordsRecovery, "ready");
    assert.equal(frame.battle.handheld.find((item) => item.hero === id).phase, "held");
  }
  assert.equal(JSON.stringify(state), before);
});

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 740 },
]) {
  test(`Finn's paper meets his low hand when he picks it up at ${view.width}px`, () => {
    const state = stateAtBattle(),
      motion = new RoadMotion();
    state.squads[0].run.health.finn.hp = 0;
    const input = storybookAdventureInput({
      squad: state.squads[0],
      now: state.updatedAt,
      startQuest: quest,
      ready: true,
    });
    let contact;
    for (let ms = 0; ms <= 30000; ms += 50) {
      const frame = motion.update(
        chapterRoadFrame(
          { ...input, now: state.updatedAt + ms, recordsClosing: ms >= 2000 },
          false,
          1400,
          view,
        ),
        "finn-paper-contact",
        view.width,
        false,
        view.height,
      );
      const item = frame.battle.handheld.find((value) => value.hero === "finn");
      if (item?.phase !== "lift") continue;
      const hero = frame.battle.heroes.find((value) => value.id === "finn");
      const hand = handheldPoint(
        item,
        hero,
        handheldFrame(item, hero, frame.battle.time),
        view,
        frame.battle.stage,
      );
      contact = Math.hypot(
        roadX(hand.x, frame.battle.distance, view.width) -
          roadX(item.point.x, frame.battle.distance, view.width),
        roadY(hand.lane, view.height, view.width) - roadY(item.point.lane, view.height, view.width),
      );
      break;
    }
    assert.ok(contact !== undefined && contact < 4, `pickup contact differs by ${contact}px`);
  });
}

test("reduced motion still finishes the defeated carrier's recovery without changing HP", () => {
  const state = stateAtBattle(),
    motion = new RoadMotion();
  state.squads[0].run.health.aria.hp = 0;
  const before = JSON.stringify(state);
  const view = { width: 390, height: 740 };
  const input = storybookAdventureInput({
    squad: state.squads[0],
    now: state.updatedAt,
    startQuest: quest,
    ready: true,
  });
  let frame;
  for (let ms = 0; ms <= 12000; ms += 50) {
    frame = motion.update(
      chapterRoadFrame(
        { ...input, now: state.updatedAt + ms, recordsClosing: ms >= 2000 },
        true,
        1400,
        view,
      ),
      "reduced-recovery",
      view.width,
      true,
      view.height,
    );
    if (ms >= 2000 && frame.look.mossBeds.visualComplete) break;
  }
  assert.equal(frame.look.mossBeds.visualComplete, true);
  assert.equal(frame.battle.heroes.find((hero) => hero.id === "aria").recordsRecovery, "ready");
  assert.equal(frame.battle.handheld.find((item) => item.hero === "aria").phase, "held");
  assert.equal(JSON.stringify(state), before);
});

function stateAtBattle() {
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
  for (let i = 0; i < 20000 && state.squads[0].run; i++) {
    const run = state.squads[0].run;
    if (run.enemies?.some((enemy) => enemy.trick === "lico")) return state;
    state = settle(state, state.updatedAt + (run.node >= 13 ? 1 : 100));
  }
  assert.fail("Lico confrontation did not appear");
}

test("4-7 uses the garden without changing the saved battle or explicit comparison settings", () => {
  const state = stateAtBattle();
  const input = { squad: state.squads[0], now: state.updatedAt, startQuest: quest, ready: true };
  const before = JSON.stringify(state);
  assert.equal(storybookAdventureInput(input).backgroundOverride, mossBedsAssets.bank);
  assert.equal(
    storybookAdventureInput({ ...input, backgroundOverride: "/custom.png" }).backgroundOverride,
    "/custom.png",
  );
  const disabled = { ...input, storybookHeroes: false };
  assert.equal(storybookAdventureInput(disabled), disabled);
  chapterRoadFrame(storybookAdventureInput(input), false, 1400, { width: 390, height: 740 });
  assert.equal(JSON.stringify(state), before);
});

test("the cue follows only the currently displayed support and bottle lines", () => {
  assert.equal(
    licoRecordsBanterCue({ speaker: "mira", text: "無理に動かさないで。私が支えるわ。" }),
    "support",
  );
  assert.equal(
    licoRecordsBanterCue({ speaker: "finn", text: "動ける方で栓を閉めよう。こっちの瓶もかい？" }),
    "bottle",
  );
  assert.equal(
    licoRecordsBanterCue({ speaker: "lico", text: "あ、それは比較用。混ぜないで。" }),
    "other",
  );
});

test("Mira does not offer to hold another person when she is the affected person", () => {
  const lines = [
    { speaker: "mira", expression: "serious", text: "無理に動かさないで。私が支えるわ。" },
  ];
  assert.equal(licoRecordsPatientBanter(lines, "aria"), lines);
  const revised = licoRecordsPatientBanter(lines, "mira");
  assert.match(revised[0].text, /足がしびれて/);
  assert.equal(revised[0].expression, "serious");
  assert.equal(licoRecordsBanterCue(revised[0]), "other");
  assert.match(lines[0].text, /私が支える/);
});

test("a disabled or absent helper does not perform an invented contact", () => {
  const state = stateAtBattle();
  const frame = chapterRoadFrame(
    { squad: state.squads[0], now: state.updatedAt, startQuest: quest, ready: true },
    false,
    1400,
    { width: 936, height: 624 },
  );
  const mira = frame.battle.heroes.find((hero) => hero.id === "mira");
  const finn = frame.battle.heroes.find((hero) => hero.id === "finn");
  mira.paralyzed = true;
  finn.paralyzed = true;
  assert.equal(
    recordsContactTarget("mira", frame.battle, { cue: "support", patient: "aria" }, false),
    undefined,
  );
  assert.equal(recordsContactTarget("finn", frame.battle, { cue: "bottle" }, false), undefined);
  mira.paralyzed = false;
  assert.equal(
    recordsContactTarget("mira", frame.battle, { cue: "support", patient: "mira" }, false),
    undefined,
  );
  assert.equal(recordsContactTarget("mira", frame.battle, { cue: "support" }, false), undefined);
});

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 740 },
]) {
  test(`Finn reaches the bottle after Mira supports Aria at ${view.width}px`, () => {
    const state = stateAtBattle(),
      motion = new RoadMotion();
    const base = storybookAdventureInput({
      squad: state.squads[0],
      now: state.updatedAt,
      startQuest: quest,
      ready: true,
    });
    let frame;
    for (let i = 0; i < 340; i++) {
      const cue = i < 20 ? "other" : i < 180 ? "support" : "bottle";
      frame = motion.update(
        chapterRoadFrame(
          { ...base, now: state.updatedAt + i * 50, recordsDialogue: { cue, patient: "aria" } },
          false,
          1400,
          view,
        ),
        "sequence",
        view.width,
        false,
        view.height,
      );
    }
    assert.ok([4, 6].includes(frame.battle.waterwayActions.poses.finn?.frame));
  });
  for (const patient of ["aria", "leon", "finn"]) {
    test(`Mira reaches ${patient} for the visible support line at ${view.width}px`, () => {
      const state = stateAtBattle(),
        motion = new RoadMotion();
      const base = storybookAdventureInput({
        squad: state.squads[0],
        now: state.updatedAt,
        startQuest: quest,
        ready: true,
      });
      let frame;
      for (let i = 0; i < 160; i++) {
        const input = {
          ...base,
          now: state.updatedAt + i * 50,
          recordsDialogue: { cue: i < 20 ? "other" : "support", patient },
        };
        frame = motion.update(
          chapterRoadFrame(input, false, 1400, view),
          "contact",
          view.width,
          false,
          view.height,
        );
      }
      const mira = frame.battle.heroes.find((hero) => hero.id === "mira");
      const target = recordsContactTarget(
        "mira",
        frame.battle,
        { cue: "support", patient },
        view.height > view.width,
      );
      assert.ok(waterwayAt(mira, mossBedsLayout(view).world(...target), view));
      assert.equal(frame.battle.waterwayActions.poses.mira?.frame, 3);
    });
  }
  test(`Finn reaches the apparatus bottle for the visible line at ${view.width}px`, () => {
    const state = stateAtBattle(),
      motion = new RoadMotion();
    const base = storybookAdventureInput({
      squad: state.squads[0],
      now: state.updatedAt,
      startQuest: quest,
      ready: true,
    });
    let frame;
    for (let i = 0; i < 160; i++) {
      const input = {
        ...base,
        now: state.updatedAt + i * 50,
        recordsDialogue: { cue: i < 20 ? "other" : "bottle" },
      };
      frame = motion.update(
        chapterRoadFrame(input, false, 1400, view),
        "contact",
        view.width,
        false,
        view.height,
      );
    }
    const finn = frame.battle.heroes.find((hero) => hero.id === "finn");
    const basket = frame.battle.handheld.find((item) => item.kind === "field-basket");
    const dx = Math.abs(roadX(finn.x, 0, view.width) - roadX(basket.point.x, 0, view.width));
    const dy = Math.abs(
      roadY(finn.lane, view.height, view.width) - roadY(basket.point.lane, view.height, view.width),
    );
    const basketWidth = handheldWidth(basket.kind, view, basket.sizeScale);
    assert.ok(
      dx >= basketWidth * 0.55 || dy >= basketWidth * 0.25,
      `feet on basket: ${dx}, ${dy}, ${basketWidth}`,
    );
    const target = recordsContactTarget(
      "finn",
      frame.battle,
      { cue: "bottle" },
      view.height > view.width,
    );
    assert.ok(waterwayAt(finn, mossBedsLayout(view).world(...target), view));
    assert.ok([4, 6].includes(frame.battle.waterwayActions.poses.finn?.frame));
    const reduced = new RoadMotion().update(
      chapterRoadFrame(
        { ...base, now: state.updatedAt + 1000, recordsDialogue: { cue: "bottle" } },
        true,
        1400,
        view,
      ),
      "reduced",
      view.width,
      true,
      view.height,
    );
    assert.equal(reduced.battle.waterwayActions.poses.finn?.frame, 4);
  });
}

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 740 },
]) {
  test(`the device and Lico occupy distinct positions at ${view.width}px`, () => {
    const state = stateAtBattle(),
      layout = mossBedsLayout(view);
    const input = storybookAdventureInput({
      squad: state.squads[0],
      now: state.updatedAt,
      startQuest: quest,
      ready: true,
    });
    const frame = chapterRoadFrame(input, false, 1400, view);
    const drawn = new RoadMotion().update(frame, "records", view.width, true, view.height);
    const enemy = drawn.battle.enemies.find((item) => item.kind === "lico");
    const lico = drawn.battle.waterwayActions.actors.find((actor) => actor.id === "lico-at-beds");
    assert.ok(enemy && lico);
    assert.deepEqual(
      { x: enemy.x, lane: enemy.lane },
      layout.world(...recordsPoint("reflector", layout.portrait)),
    );
    assert.deepEqual(lico.point, layout.world(...recordsPoint("lico", layout.portrait)));
    assert.notDeepEqual(lico.point, { x: enemy.x, lane: enemy.lane });
    assert.equal(
      drawn.battle.waterwayActions.props.filter((prop) => prop.id === "reflector").length,
      0,
    );
    assert.equal(
      drawn.battle.waterwayActions.props.filter((prop) => prop.id === "samples").length,
      1,
    );
    assert.equal(
      drawn.battle.waterwayActions.props.filter((prop) => prop.id === "low-smoke").length,
      1,
    );
    for (const hero of drawn.battle.heroes) {
      const x = roadX(hero.x, drawn.battle.distance, view.width),
        y = roadY(hero.lane, view.height, view.width);
      assert.ok(x > 0 && x < view.width && y > 0 && y < view.height, `${hero.id} stays on screen`);
    }
  });
}

test("the action moves its hero and directs the effect to the apparatus without moving Lico", () => {
  const view = { width: 936, height: 624 },
    state = stateAtBattle();
  const raw = chapterRoadFrame(
    { squad: state.squads[0], now: state.updatedAt, startQuest: quest, ready: true },
    false,
    1400,
    view,
  );
  const hero = raw.battle.heroes.find((h) => h.id === "aria"),
    enemy = raw.battle.enemies.find((e) => e.kind === "lico");
  raw.battle.effects = [
    {
      id: 900,
      kind: "magic",
      hero: "aria",
      at: raw.battle.time,
      amount: 1,
      x: enemy.x,
      lane: enemy.lane,
      fromX: hero.x,
      fromLane: hero.lane,
    },
  ];
  raw.look.quest = quest;
  raw.look.storybookHeroes = true;
  presentLicoRecords(
    raw,
    {
      squad: state.squads[0],
      now: state.updatedAt,
      ready: true,
      startQuest: quest,
      backgroundOverride: mossBedsAssets.bank,
    },
    view,
    mossBedsAssets.bank,
  );
  const layout = mossBedsLayout(view),
    before = layout.world(...recordsPoint("aria", false)),
    device = layout.world(...recordsPoint("reflector", false)),
    movedHero = raw.battle.heroes.find((h) => h.id === "aria"),
    moved = { x: movedHero.x, lane: movedHero.lane };
  assert.ok(Math.abs(moved.x - device.x) < Math.abs(before.x - device.x));
  assert.ok(Math.abs(moved.lane - device.lane) < Math.abs(before.lane - device.lane));
  assert.deepEqual({ x: raw.battle.effects[0].x, lane: raw.battle.effects[0].lane }, device);
  assert.deepEqual({ x: raw.battle.effects[0].fromX, lane: raw.battle.effects[0].fromLane }, moved);
  const prepared = prepareLicoRecords(raw, view);
  assert.deepEqual(
    prepared.battle.waterwayActions.actors[0].point,
    layout.world(...recordsPoint("lico", false)),
  );
  const initialSmoke = prepared.battle.waterwayActions.props.find(
    (p) => p.id === "low-smoke",
  ).alpha;
  raw.battle.enemies[0].action = "paralyze";
  const activeSmoke = prepareLicoRecords(raw, view).battle.waterwayActions.props.find(
    (p) => p.id === "low-smoke",
  ).alpha;
  assert.ok(activeSmoke > initialSmoke);
  raw.battle.enemies[0].hp = 0;
  const disabled = prepareLicoRecords(raw, view).battle.waterwayActions.props;
  assert.ok(disabled.some((p) => p.id === "reflector" && p.asset === mossBedsAssets.reflectorDown));
  assert.ok(!disabled.some((p) => p.id === "low-smoke"));
});
