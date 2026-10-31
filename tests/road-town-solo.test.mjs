import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadDepth, roadHeroSize, roadX } from "../lib/road-layout.ts";
import { waterwayPalm } from "../lib/road-waterway-contacts.ts";
import { TownSoloDelivery } from "../lib/road-town-solo.ts";
import { townVisualActivity, townActivitySquad } from "../lib/road-town-activity.ts";
import { journeyBanter } from "../lib/stories.ts";

function start(last = true) {
  let state = act(
    testState(1000, 2, 40, 10000),
    { type: "start", id: "town-deliveries", readDeparture: true, value: false },
    1000,
  );
  for (let i = 0; i < 3000; i++) {
    const run = state.squads[0].run;
    if (run?.node === (last ? 13 : 1) && run.phase === "work" && run.target / run.targetMax < 0.6)
      return state;
    state = settle(state, state.updatedAt + 100);
  }
  throw Error("Final delivery was not reached");
}

test("an earlier solo delivery fades back to the next warehouse", () => {
  const view = { width: 936, height: 624 };
  let state = start(false),
    interrupted = false,
    sawReceipt = false,
    sawFade = false,
    warehouse;
  const motion = new RoadMotion();
  for (let i = 0; i < 600 && state.squads[0].run; i++) {
    state = settle(state, state.updatedAt + 50);
    if (!state.squads[0].run) break;
    const raw = chapterRoadFrame(
      {
        squad: state.squads[0],
        now: state.updatedAt,
        ready: true,
        paused: false,
        storybookHeroes: true,
      },
      false,
      1400,
      view,
    );
    const frame = motion.update(raw, "town", view.width, false, view.height);
    if (!interrupted && frame.battle.townParcelLift === 1) {
      state = structuredClone(state);
      state.squads[0].run.health.leon.hp = 0;
      interrupted = true;
    }
    if (!frame.battle.townSoloCarrier) continue;
    assert.equal(townVisualActivity(frame.look, frame.battle), frame.look.work.label);
    sawReceipt ||= !!frame.battle.waterwayActions?.props.some((p) => p.id === "town-receipt");
    if (frame.battle.townNextWarehouseX !== undefined) warehouse = frame.battle.townNextWarehouseX;
    if (frame.battle.townTransitionFade > 0) {
      assert.ok(sawReceipt && warehouse !== undefined);
      sawFade = true;
      break;
    }
  }
  assert.ok(interrupted && sawReceipt && sawFade);
});

test("visual town activity is limited to a visible handoff and clears during rest", () => {
  const look = {
    quest: "town-deliveries",
    storybookHeroes: true,
    work: { label: "品を渡して控えを受け取る" },
  };
  const battle = { phase: "journey", townParcelHandoff: true };
  assert.equal(townVisualActivity(look, battle), look.work.label);
  assert.equal(townVisualActivity(look, { ...battle, phase: "rest" }), null);
  assert.equal(townVisualActivity(look, { ...battle, townParcelHandoff: false }), null);
  assert.equal(townVisualActivity({ ...look, quest: "village-trade" }, battle), null);
  assert.equal(townVisualActivity({ ...look, storybookHeroes: false }, battle), null);
});

test("the visible delivery selects matching banter without changing the real run", () => {
  const state = start(false),
    squad = state.squads[0],
    run = squad.run;
  const original = JSON.stringify(state);
  const carry = townActivitySquad(squad, { started: run.started, label: "商店へ荷物を運ぶ" });
  const handoff = townActivitySquad(squad, {
    started: run.started,
    label: "品を渡して控えを受け取る",
  });
  assert.equal(carry.run.node, 1);
  assert.equal(handoff.run.node, 2);
  assert.match(journeyBanter(state, carry, state.updatedAt)[0].text, /角の店/);
  assert.match(journeyBanter(state, handoff, state.updatedAt)[0].text, /控え/);
  assert.equal(
    townActivitySquad(squad, { started: run.started - 1, label: "商店へ荷物を運ぶ" }),
    undefined,
  );
  assert.equal(townActivitySquad(squad, { started: run.started, label: null }), undefined);
  assert.equal(JSON.stringify(state), original);
});

test("a second interruption keeps the box in place and changes the carrier", () => {
  const view = { width: 374, height: 249 };
  const parcel = new TownSoloDelivery();
  const makeBattle = (time) => ({
    time,
    stage: "forest",
    phase: "journey",
    distance: 0,
    gathering: { task: "carry", kind: "cargo", x: 35, lane: 0.82, remaining: 10, total: 24 },
    heroes: [
      { id: "aria", hp: 10, x: 60, lane: 0.82 },
      { id: "leon", hp: 0, x: 140, lane: 0.82 },
    ],
  });
  const makeLook = () => ({ work: { label: "商店へ荷物を運ぶ" }, workers: [] });
  assert.ok(parcel.begin(makeBattle(0), 100, 140, 1));
  let last;
  for (let i = 0; i < 30; i++) {
    last = makeBattle(i * 50);
    parcel.update(last, makeLook(), view, 0.05, false);
  }
  const next = makeBattle(1500);
  next.heroes[0].hp = 0;
  next.heroes[1].hp = 10;
  parcel.update(next, makeLook(), view, 0.05, false);
  assert.equal(next.townSoloCarrier, "leon");
  assert.equal(next.gathering.x, last.gathering.x);
  assert.equal(next.gathering.lane, last.gathering.lane);
  assert.equal(next.heroes[0].hp, 0);
});

test("reduced motion finishes the delivery without waiting for animation", () => {
  const view = { width: 374, height: 249 };
  const parcel = new TownSoloDelivery();
  const battle = {
    time: 0,
    stage: "forest",
    phase: "journey",
    distance: 0,
    gathering: { task: "carry", kind: "cargo", x: 35, remaining: 10, total: 24 },
    heroes: [
      { id: "aria", hp: 10, x: 60, lane: 0.82 },
      { id: "leon", hp: 0, x: 140, lane: 0.82 },
    ],
  };
  const look = { work: { label: "品を渡して控えを受け取る" }, workers: [], townFinalizing: true };
  parcel.begin(battle, 100, 140, 1);
  parcel.update(battle, look, view, 0, true);
  assert.equal(battle.gathering.x + 65, 140);
  assert.equal(battle.townParcelLift, 0);
  assert.ok(battle.waterwayActions.props.some((prop) => prop.id === "town-receipt"));
  assert.equal(battle.townVisualComplete, true);
});

for (const view of [
  { width: 374, height: 249 },
  { width: 936, height: 624 },
]) {
  for (const down of ["aria", "leon"]) {
    test(`${down} unavailable during delivery: survivor delivers the box (${view.width})`, () => {
      let state = start(),
        snapshot,
        interrupted = false,
        lifted = false,
        receipt = false,
        finished = false;
      const motion = new RoadMotion();
      const survivor = down === "aria" ? "leon" : "aria";
      for (let i = 0; i < 1000; i++) {
        const previous = state;
        state = settle(state, state.updatedAt + 50);
        if (state.squads[0].run) snapshot = state.squads[0];
        const squad = state.squads[0].run ? state.squads[0] : snapshot;
        if (!squad?.run) break;
        const saved = JSON.stringify(state);
        const raw = chapterRoadFrame(
          {
            squad,
            now: state.updatedAt,
            ready: true,
            paused: false,
            storybookHeroes: true,
            townFinalizing: !state.squads[0].run,
          },
          false,
          1400,
          view,
        );
        const frame = motion.update(raw, "town", view.width, false, view.height);
        assert.equal(JSON.stringify(state), saved);
        if (!interrupted && frame.battle.townParcelLift === 1 && state.squads[0].run) {
          state = structuredClone(state);
          state.squads[0].run.health[down].hp = 0;
          interrupted = true;
        } else if (interrupted && frame.battle.townSoloCarrier) {
          assert.equal(frame.battle.townSoloCarrier, survivor);
          const injured = frame.battle.heroes.find((h) => h.id === down);
          assert.equal(injured.hp, squad.run.health[down].hp);
          const boxX = roadX(
            frame.battle.gathering.x + 65,
            frame.battle.distance,
            view.width,
            frame.battle.stage,
          );
          assert.ok(boxX > 0 && boxX < view.width, `box is offscreen: ${boxX}`);
          const pose = frame.battle.waterwayActions?.poses[survivor];
          if (pose?.asset.includes("paper-walk") && frame.battle.townParcelLift === 1) {
            const worker = frame.battle.heroes.find((h) => h.id === survivor);
            const hand = waterwayPalm(
              worker,
              survivor === "aria" ? [125, 110] : [130, 106],
              1,
              view,
            );
            const side =
              frame.battle.gathering.lane -
              (45 * roadHeroSize(view.width, view.height) * 0.9) /
                144 /
                roadDepth(view.width, view.height);
            assert.ok(Math.abs(hand.x - (frame.battle.gathering.x + 65)) < 1e-8);
            assert.ok(Math.abs(hand.lane - side) < 1e-8);
          }
          lifted ||= frame.battle.townParcelLift === 1;
          receipt ||= frame.battle.waterwayActions?.props.some((p) => p.id === "town-receipt");
        }
        if (interrupted && frame.battle.townVisualComplete) {
          assert.equal(
            frame.battle.townSoloCarrier,
            survivor,
            "must not replay the two-person handoff",
          );
          finished = true;
          break;
        }
        if (!state.squads[0].run && previous === state) break;
      }
      assert.ok(
        interrupted && lifted && receipt && finished,
        JSON.stringify({ interrupted, lifted, receipt, finished }),
      );
    });
  }
}
