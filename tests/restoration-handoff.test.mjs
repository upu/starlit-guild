import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { LUNCH_INTERLUDE } from "../lib/chapter-three.ts";
import { storyStages } from "../lib/prologue.ts";
import { stories } from "../lib/stories.ts";
import { restorationHandoffState } from "../lib/restoration-handoff.ts";
import { restorationVisualInput } from "../lib/restoration-visual-input.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { restorationAssets } from "../lib/road-berne-restoration.ts";
import { nightBridgeAssets } from "../lib/road-night-bridge.ts";
import { lindeDeliveryAssets } from "../lib/road-linde-delivery.ts";
import { roadPaintKey } from "../lib/road-paint-key.ts";
import { pendingInterlude } from "../lib/interludes.ts";

test("the final town delivery stays visible until its receipt is received", () => {
  for (const view of [
    { width: 374, height: 249 },
    { width: 936, height: 624 },
  ]) {
    let state = act(
      testState(1000, 2, 40, 10000),
      { type: "start", id: "town-deliveries", readDeparture: true, value: false },
      1000,
    );
    const motion = new RoadMotion();
    let previous,
      wasHandoff = false,
      handoffs = 0;
    for (let step = 0; step < 3000 && state.squads[0].run; step++) {
      previous = state.squads[0];
      state = settle(state, state.updatedAt + 50);
      if (!state.squads[0].run) break;
      const input = {
        squad: state.squads[0],
        startQuest: "town-deliveries",
        now: state.updatedAt,
        ready: true,
        paused: false,
        storybookHeroes: true,
      };
      const frame = motion.update(
        chapterRoadFrame(input, false, 1400, view),
        "town",
        view.width,
        false,
        view.height,
      );
      const active = !!frame.battle.townParcelHandoff;
      if (active && !wasHandoff) handoffs++;
      wasHandoff = active;
    }
    assert.ok(state.done["town-deliveries"] && !state.squads[0].run && previous?.run);
    assert.equal(handoffs, 5);
    const saved = JSON.stringify(state);
    const ending = stories.find(
      (story) => story.quest === "town-deliveries" && story.id.endsWith("-return"),
    );
    const handoff = restorationHandoffState({
      enabled: true,
      quest: "town-deliveries",
      squad: state.squads[0],
      ending,
      view: "adventure",
      sheet: null,
      ready: true,
      snapshot: previous,
      finished: null,
    });
    assert.equal(handoff.waiting, true);
    let receipt = false,
      complete = false;
    for (let elapsed = 0; elapsed <= 6000; elapsed += 50) {
      const actual = {
        squad: state.squads[0],
        startQuest: "town-deliveries",
        now: state.updatedAt + elapsed,
        ready: true,
        paused: false,
      };
      const input = restorationVisualInput(actual, {
        quest: "town-deliveries",
        active: true,
        squad: previous,
        skipped: false,
      });
      const frame = motion.update(
        chapterRoadFrame(input, false, 1400, view),
        "town",
        view.width,
        false,
        view.height,
      );
      receipt ||= !!frame.battle.waterwayActions?.props.some((p) => p.id === "town-receipt");
      if (frame.battle.townVisualComplete) {
        complete = true;
        break;
      }
    }
    assert.ok(receipt && complete);
    assert.equal(JSON.stringify(state), saved);
    assert.equal(
      restorationHandoffState({
        enabled: true,
        quest: "town-deliveries",
        squad: state.squads[0],
        ending,
        view: "adventure",
        sheet: null,
        ready: true,
        snapshot: previous,
        finished: handoff.key,
      }).waiting,
      false,
    );
    assert.equal(
      restorationHandoffState({
        enabled: true,
        quest: "town-deliveries",
        squad: state.squads[0],
        ending,
        view: "adventure",
        sheet: null,
        ready: true,
        snapshot: null,
        finished: null,
      }).waiting,
      false,
    );
  }
});
import { lanternRoadAssets } from "../lib/road-lantern-layout.ts";
import {
  berneRestorationHandoff,
  chapterThreeHandoffs,
  chapterFourHandoff,
  handoffQuest,
  seedlingHandoffNotice,
  waitsForScene,
} from "../app/phone-restoration-mode.ts";

test("the seedling handoff keeps an appropriate notice through the completion sheet", () => {
  assert.equal(
    seedlingHandoffNotice("merrill-seedlings", true, true, false),
    "みんなが集まっている。",
  );
  assert.equal(
    seedlingHandoffNotice("merrill-seedlings", true, false, false),
    "みんなが集まった。",
  );
  assert.equal(seedlingHandoffNotice("merrill-seedlings", true, false, true), undefined);
  assert.equal(seedlingHandoffNotice("merrill-seedlings", false, false, false), undefined);
  assert.equal(seedlingHandoffNotice("lico-records", true, true, false), undefined);
});

test("phone enables restoration for the active or ending 3-9 quest without overriding studies", () => {
  const base = {
    squad: { run: { quest: "berne-restoration" } },
    ending: null,
    quest: { id: "linde-requests" },
  };
  const mode = (model, ...flags) => berneRestorationHandoff(model, ...flags);
  assert.equal(mode(base, false, false), true);
  assert.equal(mode(base, false, true), false);
  const ended = { ...base, squad: { run: null }, ending: { quest: "berne-restoration" } };
  assert.equal(mode(ended, false, false), true);
  const other = { ...base, squad: { run: { quest: "lantern-detour" } } };
  assert.equal(mode(other, false, false), false);
  assert.equal(mode(other, true, false), true);
});

test("phone enables the night bridge for the current or ending 3-8 quest", () => {
  const model = {
    squad: { run: { quest: "keystone-night-road" } },
    ending: null,
    quest: { id: "berne-restoration" },
  };
  assert.deepEqual(chapterThreeHandoffs(model, false, false, false), {
    berne: false,
    night: true,
    foundation: false,
  });
  assert.deepEqual(chapterThreeHandoffs(model, false, false, true), {
    berne: false,
    night: false,
    foundation: false,
  });
  assert.deepEqual(chapterThreeHandoffs(model, true, false, false), {
    berne: true,
    night: false,
    foundation: false,
  });
  const ended = { ...model, squad: { run: null }, ending: { quest: "keystone-night-road" } };
  assert.equal(chapterThreeHandoffs(ended, false, false, false).night, true);
  const other = { ...model, squad: { run: { quest: "lantern-detour" } } };
  assert.equal(chapterThreeHandoffs(other, false, false, false).night, false);
});

test("foundation, night and restoration dialogue wait for their scene, but not for an error", () => {
  for (const quest of ["berne-restoration", "keystone-night-road", "missing-keystone"]) {
    assert.equal(waitsForScene(quest, true, "loading"), true);
    assert.equal(waitsForScene(quest, true, "ready"), false);
    assert.equal(waitsForScene(quest, true, "error"), false);
    assert.equal(waitsForScene(quest, false, "loading"), false);
  }
  assert.equal(waitsForScene("lantern-detour", true, "loading"), false);
});

test("foundation handoff is selected for its active and just-completed quest", () => {
  const model = {
    squad: { run: { quest: "missing-keystone" } },
    ending: null,
    quest: { id: "riverside-manor" },
  };
  assert.equal(chapterThreeHandoffs(model, false, false, false).foundation, true);
  assert.equal(chapterThreeHandoffs(model, false, false, true).foundation, false);
  const ended = { ...model, squad: { run: null }, ending: { quest: "missing-keystone" } };
  assert.equal(chapterThreeHandoffs(ended, false, false, false).foundation, true);
});

test("phone selects the active or ending chapter four scene before the selected destination", () => {
  const model = {
    squad: { run: { quest: "lantern-detour" } },
    ending: { quest: "linde-requests" },
    quest: { id: "linde-requests" },
  };
  const mode = (value, ...flags) => chapterFourHandoff(value, ...flags);
  assert.deepEqual(mode(model, false, false, false, false), {
    linde: false,
    lantern: true,
    brekka: false,
    trail: false,
    secondDay: false,
    records: false,
    seedlings: false,
    founding: false,
  });
  const ended = { ...model, squad: { run: null }, ending: { quest: "lantern-detour" } };
  assert.deepEqual(mode(ended, false, false, false, false), {
    linde: false,
    lantern: true,
    brekka: false,
    trail: false,
    secondDay: false,
    records: false,
    seedlings: false,
    founding: false,
  });
  assert.deepEqual(mode(model, true, false, false, false), {
    linde: false,
    lantern: false,
    brekka: false,
    trail: false,
    secondDay: false,
    records: false,
    seedlings: false,
    founding: false,
  });
  assert.deepEqual(mode(model, false, false, true, false), {
    linde: true,
    lantern: false,
    brekka: false,
    trail: false,
    secondDay: false,
    records: false,
    seedlings: false,
    founding: false,
  });
  assert.equal(handoffQuest(false, true, false), "lantern-detour");
  const brekka = { ...model, squad: { run: { quest: "brekka-arrival" } } };
  assert.deepEqual(mode(brekka, false, false, false, false), {
    linde: false,
    lantern: false,
    brekka: true,
    trail: false,
    secondDay: false,
    records: false,
    seedlings: false,
    founding: false,
  });
  assert.equal(handoffQuest(false, false, false, true), "brekka-arrival");
  const trail = { ...model, squad: { run: { quest: "glowing-moss-trail" } } };
  assert.equal(mode(trail, false, false, false, false).trail, true);
  assert.equal(handoffQuest(false, false, false, false, true), "glowing-moss-trail");
  const second = { ...model, squad: { run: { quest: "glowing-moss-trail-next-day" } } };
  assert.equal(mode(second, false, false, false, false).secondDay, true);
  assert.equal(
    handoffQuest(false, false, false, false, false, true),
    "glowing-moss-trail-next-day",
  );
  const records = { ...model, squad: { run: { quest: "lico-records" } } };
  assert.equal(mode(records, false, false, false, false).records, true);
  assert.equal(handoffQuest(false, false, false, false, false, false, true), "lico-records");
  const seedlings = { ...model, squad: { run: { quest: "merrill-seedlings" } } };
  assert.equal(mode(seedlings, false, false, false, false).seedlings, true);
  assert.equal(
    handoffQuest(false, false, false, false, false, false, false, true),
    "merrill-seedlings",
  );
  const founding = { ...model, squad: { run: { quest: "starlit-guild-founding" } } };
  assert.equal(mode(founding, false, false, false, false).founding, true);
  assert.equal(
    handoffQuest(false, false, false, false, false, false, false, false, true),
    "starlit-guild-founding",
  );
});

test("records completion keeps the observed encounter only while its dialogue is being read", () => {
  const quest = "lico-records";
  const run = { quest, started: 42, node: 13, enemies: [{ trick: "lico", hp: 10 }] };
  const snapshot = { id: "party", members: ["aria", "leon", "mira", "finn"], run };
  const base = {
    enabled: true,
    quest,
    squad: snapshot,
    snapshot: null,
    ending: null,
    view: "adventure",
    sheet: null,
    ready: true,
    finished: null,
  };
  assert.equal(restorationHandoffState(base).capture, true);
  const defeated = { ...snapshot, run: { ...run, enemies: [{ trick: "lico", hp: 0 }] } };
  const holding = restorationHandoffState({ ...base, squad: defeated, snapshot });
  assert.equal(holding.capture, false);
  assert.equal(holding.recordsSquad, snapshot);
  const replay = { ...base, squad: { ...snapshot, run: null }, snapshot, ending: { quest } };
  const handoff = restorationHandoffState(replay);
  assert.equal(handoff.waiting, true);
  const input = { squad: replay.squad, startQuest: quest, now: 100, ready: true, paused: false };
  const stillRunning = restorationVisualInput(
    { ...input, squad: defeated },
    {
      ...holding,
      quest,
      squad: holding.candidate,
      skipped: false,
      dialogue: "pending",
    },
  );
  assert.equal(stillRunning.squad.run, run, "the apparatus does not pop back up at completion");
  const before = JSON.stringify(input);
  const visual = restorationVisualInput(input, {
    ...handoff,
    quest,
    squad: handoff.candidate,
    skipped: false,
    dialogue: "pending",
  });
  assert.equal(visual.squad.run, run);
  assert.equal(JSON.stringify(input), before, "the saved squad is not modified");
  const done = restorationHandoffState({ ...replay, finished: handoff.key });
  assert.equal(done.waiting, false);
  const seated = restorationVisualInput(input, {
    ...done,
    quest,
    squad: done.candidate,
    skipped: false,
    dialogue: "pending",
    recordsClosing: true,
  });
  assert.equal(seated.squad.run, run, "retain the seated scene below the completion sheet");
  assert.equal(seated.recordsClosing, true);
  assert.equal(
    restorationVisualInput(input, {
      ...done,
      quest,
      squad: done.candidate,
      skipped: false,
      dialogue: "pending",
    }).squad.run,
    null,
  );
  assert.equal(restorationHandoffState({ ...replay, snapshot: null }).waiting, false);
  const nextRun = { ...snapshot, run: { ...run, started: 43, enemies: [] } };
  assert.equal(restorationHandoffState({ ...base, squad: nextRun, snapshot }).capture, true);
  const otherSquad = { ...defeated, id: "other-party" };
  assert.equal(restorationHandoffState({ ...base, squad: otherSquad, snapshot }).capture, true);
});

test("seedling completion keeps the encounter for the visual return, without changing the save", () => {
  const quest = "merrill-seedlings";
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
  const snapshot = state.squads[0];
  const ended = { ...snapshot, run: null };
  const ending = stories.find((story) => story.id === `${quest}-return`);
  const base = {
    enabled: true,
    quest,
    squad: ended,
    snapshot,
    ending,
    view: "adventure",
    sheet: null,
    ready: true,
    finished: null,
  };
  const handoff = restorationHandoffState(base);
  assert.equal(handoff.waiting, true);
  const before = JSON.stringify(ended);
  const input = { squad: ended, startQuest: quest, now: 2000, ready: true };
  const visual = restorationVisualInput(input, {
    ...handoff,
    quest,
    squad: handoff.candidate,
    skipped: false,
    dialogue: "pending",
  });
  assert.equal(visual.squad, snapshot);
  assert.equal(visual.seedlingsClosing, true);
  assert.equal(JSON.stringify(ended), before);
  assert.equal(restorationHandoffState({ ...base, finished: handoff.key }).waiting, false);
  assert.equal(restorationHandoffState({ ...base, snapshot: null }).waiting, false);
  assert.equal(restorationHandoffState({ ...base, view: "characters" }).waiting, false);
});

test("lantern-road phone handoff waits for the final work and releases on completion", () => {
  const quest = "lantern-detour",
    view = { width: 390, height: 700 };
  let state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === quest),
    40,
    10000,
  );
  const interlude = pendingInterlude(state);
  if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
  state = act(
    state,
    { type: "start", id: quest, readDeparture: true, value: false },
    state.updatedAt,
  );
  let snapshot = state.squads[0],
    identity,
    last,
    after = 0,
    waited = false;
  const motion = new RoadMotion();
  const ending = stories.find((story) => story.id === `${quest}-return`);
  for (let i = 0; i < 6000; i++) {
    if (state.squads[0].run) snapshot = state.squads[0];
    const handoff = restorationHandoffState({
      enabled: true,
      quest,
      squad: state.squads[0],
      snapshot,
      ending: state.done[quest] ? ending : null,
      view: "adventure",
      sheet: null,
      ready: true,
      finished: null,
    });
    const visual = restorationVisualInput(
      { squad: state.squads[0], startQuest: quest, now: state.updatedAt + after * 50, ready: true },
      { ...handoff, quest, squad: handoff.candidate, skipped: false, dialogue: "pending" },
    );
    const before = JSON.stringify(state);
    const frame = chapterRoadFrame(visual, false, 1400, view);
    identity = roadPaintKey(snapshot.id, visual.squad.run ?? null, frame.look, identity);
    last = motion.update(frame, identity.key, view.width, false, view.height);
    assert.equal(JSON.stringify(state), before);
    if (state.done[quest]) {
      assert.ok(handoff.waiting);
      assert.equal(visual.backgroundOverride, lanternRoadAssets.bank);
      if (!last.look.lanternRoad.visualComplete) waited = true;
      else break;
      after++;
    } else {
      state = settle(state, state.updatedAt + 50);
      if (state.squads[0].run)
        state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
    }
  }
  assert.ok(waited && state.done[quest] && last.look.lanternRoad.visualComplete);
  const settled = restorationHandoffState({
    enabled: true,
    quest,
    squad: state.squads[0],
    snapshot,
    ending,
    view: "adventure",
    sheet: null,
    ready: true,
    finished: `${snapshot.id}:${String(snapshot.run.started)}`,
  });
  assert.equal(settled.waiting, false);
});

test("Linde phone preview holds completion until the reply reaches the party", () => {
  const quest = "linde-requests",
    view = { width: 390, height: 700 };
  let state = testState(
    1000,
    storyStages.findIndex((s) => s.quest === quest),
    40,
    10000,
  );
  const interlude = pendingInterlude(state);
  if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
  state = act(
    state,
    { type: "start", id: quest, readDeparture: true, value: false },
    state.updatedAt,
  );
  let snapshot = state.squads[0],
    identity,
    last,
    after = 0;
  const motion = new RoadMotion();
  for (let i = 0; i < 10000; i++) {
    if (state.squads[0].run) snapshot = state.squads[0];
    const handoff = restorationHandoffState({
      enabled: true,
      quest,
      squad: state.squads[0],
      snapshot,
      ending: state.done[quest] ? stories.find((s) => s.id === `${quest}-return`) : null,
      view: "adventure",
      sheet: null,
      ready: true,
      finished: null,
    });
    const visual = restorationVisualInput(
      {
        squad: state.squads[0],
        startQuest: quest,
        now: state.updatedAt + after * 50,
        ready: true,
      },
      { ...handoff, quest, squad: handoff.candidate, skipped: false, dialogue: "pending" },
    );
    const before = JSON.stringify(state);
    const frame = chapterRoadFrame(visual, false, 1400, view);
    identity = roadPaintKey(snapshot.id, visual.squad.run ?? null, frame.look, identity);
    last = motion.update(frame, identity.key, view.width, false, view.height);
    assert.equal(JSON.stringify(state), before);
    if (state.done[quest]) {
      assert.ok(handoff.waiting);
      assert.equal(visual.backgroundOverride, lindeDeliveryAssets.bank);
      if (last.look.lindeDelivery.visualComplete) break;
      after++;
    } else {
      state = settle(state, state.updatedAt + 50);
      if (state.squads[0].run && i % 4 === 0)
        state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
    }
  }
  assert.equal(state.done[quest], 1);
  assert.equal(last.look.lindeDelivery.visualComplete, true);
  assert.equal(last.battle.heroes.find((h) => h.id === "leon").walking, false);
});

test("restoration handoff waits only for a live visual run and releases on skip, reload or navigation", () => {
  const quest = "berne-restoration";
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
  const snapshot = state.squads[0];
  const ending = stories.find((s) => s.id === `${quest}-return`);
  const input = {
    enabled: true,
    squad: snapshot,
    snapshot: null,
    ending: null,
    view: "adventure",
    sheet: null,
    ready: true,
    finished: null,
  };
  const running = restorationHandoffState(input);
  assert.ok(running.active && running.capture);
  while (state.squads[0].run) {
    state = settle(state, state.updatedAt + 100);
    if (state.squads[0].run)
      state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
  }
  const completed = { ...input, squad: state.squads[0], snapshot, ending };
  const before = JSON.stringify(state);
  const held = restorationHandoffState(completed);
  assert.ok(held.waiting && held.active && held.candidate === snapshot);
  assert.equal(JSON.stringify(state), before);
  assert.equal(restorationHandoffState({ ...completed, finished: held.key }).waiting, false);
  assert.equal(
    restorationHandoffState({ ...completed, finished: held.key }).active,
    true,
    "keep the restored scenery behind the ending dialog",
  );
  assert.equal(restorationHandoffState({ ...completed, snapshot: null }).waiting, false);
  assert.equal(restorationHandoffState({ ...completed, enabled: false }).waiting, false);
  assert.equal(restorationHandoffState({ ...completed, view: "companions" }).waiting, false);
  assert.equal(restorationHandoffState({ ...completed, sheet: "bag" }).waiting, false);
  assert.equal(restorationHandoffState({ ...completed, ready: false }).waiting, false);
  const freshSquad = { ...snapshot, run: { ...snapshot.run, started: snapshot.run.started + 1 } };
  const newRun = restorationHandoffState({
    ...completed,
    squad: freshSquad,
    finished: held.key,
    ending: null,
  });
  assert.ok(newRun.active && newRun.capture);
  assert.notEqual(newRun.key, held.key, "a prior run cannot mark a new run's visuals complete");
  const actual = {
    squad: state.squads[0],
    startQuest: quest,
    now: state.updatedAt,
    ready: true,
    paused: false,
  };
  const skipped = restorationVisualInput(actual, {
    active: true,
    squad: snapshot,
    skipped: true,
    dialogue: "root",
  });
  assert.equal(skipped.squad.run, null);
  assert.equal(skipped.questComplete, true);
  assert.equal(snapshot.run.quest, quest, "skipping does not mutate the remembered run");
  const frame = chapterRoadFrame(skipped, false, 1400, { width: 936, height: 624 });
  const visual = new RoadMotion().update(frame, "skipped", 936, false, 624);
  assert.equal(visual.look.background, restorationAssets.repaired);
  assert.equal(JSON.stringify(state), before);
});

test("night bridge waits for the arrival view without changing the completed save", () => {
  const quest = "keystone-night-road",
    view = { width: 936, height: 624 };
  let state = act(
    act(testState(1000, 25, 40, 10000), { type: "readStory", id: LUNCH_INTERLUDE }, 1000),
    { type: "start", id: quest, readDeparture: true, value: false },
    1000,
  );
  while (state.squads[0].run?.node < 13) state = settle(state, state.updatedAt + 100);
  let snapshot = state.squads[0];
  const motion = new RoadMotion();
  let identity;
  for (let i = 0; i < 3000 && state.squads[0].run; i++) {
    snapshot = state.squads[0];
    const input = {
      squad: snapshot,
      startQuest: quest,
      now: state.updatedAt,
      ready: true,
      paused: false,
      storybookHeroes: true,
      backgroundOverride: nightBridgeAssets.bank,
    };
    const frame = chapterRoadFrame(input, false, 1400, view);
    identity = roadPaintKey(snapshot.id, snapshot.run, frame.look, identity);
    motion.update(frame, identity.key, view.width, false, view.height);
    state = settle(state, state.updatedAt + 50);
    if (state.squads[0].run)
      state = act(state, { type: "assist", mode: "strike" }, state.updatedAt);
  }
  assert.equal(state.done[quest], 1);
  const before = JSON.stringify(state);
  const ending = stories.find((item) => item.id === `${quest}-return`);
  const completed = {
    enabled: true,
    quest,
    squad: state.squads[0],
    snapshot,
    ending,
    view: "adventure",
    sheet: null,
    ready: true,
    finished: null,
  };
  const handoff = restorationHandoffState(completed);
  assert.ok(handoff.waiting && handoff.active);
  assert.equal(restorationHandoffState({ ...completed, snapshot: null }).waiting, false);
  assert.equal(restorationHandoffState({ ...completed, enabled: false }).waiting, false);
  assert.equal(restorationHandoffState({ ...completed, view: "companions" }).waiting, false);
  assert.equal(restorationHandoffState({ ...completed, sheet: "bag" }).waiting, false);
  assert.equal(restorationHandoffState({ ...completed, ready: false }).waiting, false);
  const finished = restorationHandoffState({ ...completed, finished: handoff.key });
  assert.ok(finished.active && !finished.waiting);
  const visual = restorationVisualInput(
    {
      squad: state.squads[0],
      startQuest: quest,
      now: state.updatedAt,
      ready: true,
      paused: false,
      questComplete: true,
    },
    { active: true, quest, squad: snapshot, skipped: false },
  );
  assert.equal(visual.squad.run, null);
  assert.equal(visual.backgroundOverride, nightBridgeAssets.bank);
  const skipMotion = new RoadMotion();
  const lastRunning = chapterRoadFrame(
    {
      squad: snapshot,
      startQuest: quest,
      now: state.updatedAt,
      ready: true,
      paused: false,
      storybookHeroes: true,
      backgroundOverride: nightBridgeAssets.bank,
    },
    false,
    1400,
    view,
  );
  skipMotion.update(lastRunning, identity.key, view.width, false, view.height);
  const stages = [];
  for (let elapsed = 0; elapsed <= 900; elapsed += 50) {
    const frame = chapterRoadFrame(
      { ...visual, now: state.updatedAt + elapsed },
      false,
      1400,
      view,
    );
    identity = roadPaintKey(snapshot.id, null, frame.look, identity);
    stages.push(
      motion.update(frame, identity.key, view.width, false, view.height).look.nightBridge,
    );
  }
  assert.equal(stages[0].section, 1);
  assert.ok(stages.some((stage) => stage.fade > 0));
  assert.equal(stages.at(-1).section, 2);
  assert.equal(stages.at(-1).fade, 0);
  const skip = restorationVisualInput(visual, {
    active: true,
    quest,
    squad: snapshot,
    skipped: true,
  });
  const frame = chapterRoadFrame(skip, false, 1400, view);
  const jumped = skipMotion.update(frame, identity.key, view.width, false, view.height);
  assert.equal(jumped.look.nightBridge.section, 2);
  assert.equal(jumped.look.nightBridge.fade, 0);
  assert.equal(JSON.stringify(state), before);
});
