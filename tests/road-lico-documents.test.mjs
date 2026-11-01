import test from "node:test";
import assert from "node:assert/strict";
import { act, settle, testState } from "../lib/game.ts";
import { storyStages } from "../lib/prologue.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { storybookAdventureInput } from "../lib/storybook/adventure.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { roadX, roadY, roadHeroSize } from "../lib/road-layout.ts";
import { handheldPalm, handheldWidth } from "../lib/road-handheld.ts";
import { mossBedsLayout, fieldCastScale } from "../lib/road-moss-beds-layout.ts";
import sharp from "sharp";
import { waterwayAt } from "../lib/road-waterway-contacts.ts";
import { recordsPoint } from "../lib/road-lico-positions.ts";

const boardPixels = await sharp("public/storybook-study/field-lap-board-v1.webp")
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

function clearOfBoard(drawn, hero, view, ms) {
  const board = drawn.battle.waterwayActions.props.find((prop) => prop.id === "lap-board");
  const width = board.size * roadHeroSize(view.width, view.height);
  const height = (width * boardPixels.info.height) / boardPixels.info.width;
  const left = roadX(board.point.x, 0, view.width) - width / 2;
  const top = roadY(board.point.lane, view.height, view.width) - height;
  const layout = mossBedsLayout(view),
    pixel = layout.scale * fieldCastScale(layout.portrait) * 0.9;
  for (const offset of [-12, 0, 12]) {
    const x = Math.floor(
      ((roadX(hero.x, 0, view.width) + offset * pixel - left) / width) * boardPixels.info.width,
    );
    const y = Math.floor(
      ((roadY(hero.lane, view.height, view.width) - top) / height) * boardPixels.info.height,
    );
    if (x < 0 || y < 0 || x >= boardPixels.info.width || y >= boardPixels.info.height) continue;
    assert.ok(
      boardPixels.data[(y * boardPixels.info.width + x) * 4 + 3] < 32,
      `feet on record board at ${ms}ms`,
    );
  }
}

function atNode(node) {
  const quest = "lico-records";
  let state = testState(
    1000,
    storyStages.findIndex((stage) => stage.quest === quest),
    25,
    10000,
  );
  const interlude = pendingInterlude(state);
  if (interlude) state = act(state, { type: "readStory", id: interlude.id }, state.updatedAt);
  state = act(
    state,
    { type: "start", id: quest, readDeparture: true, value: false },
    state.updatedAt,
  );
  for (let i = 0; i < 10000 && state.squads[0].run?.node < node; i++)
    state = settle(state, state.updatedAt + 100);
  assert.equal(state.squads[0].run.node, node);
  return state;
}

function frame(state, view, motion, ms, reduced = false) {
  return motion.update(
    chapterRoadFrame(
      storybookAdventureInput({
        squad: state.squads[0],
        startQuest: "lico-records",
        now: state.updatedAt + ms,
        ready: true,
      }),
      false,
      1400,
      view,
    ),
    "documents",
    view.width,
    reduced,
    view.height,
  );
}

function atEncounter() {
  let state = atNode(13);
  for (let i = 0; i < 10000; i++) {
    if (state.squads[0].run?.enemies?.some((enemy) => enemy.trick === "lico")) return state;
    state = settle(state, state.updatedAt + 1);
  }
  assert.fail("Lico confrontation did not appear");
}

for (const view of [
  { width: 936, height: 624 },
  { width: 390, height: 740 },
  { width: 388, height: 740 },
]) {
  test(`Finn walks with the record and only offers it after reaching Leon at ${view.width}px`, () => {
    const state = atNode(1),
      before = JSON.stringify(state),
      motion = new RoadMotion();
    frame(atNode(0), view, motion, 0);
    let walked = false,
      offered = false,
      released = false,
      returned = false;
    let last;
    for (let ms = 0; ms <= 20000; ms += 50) {
      const drawn = frame(state, view, motion, ms);
      last = drawn;
      const finn = drawn.battle.heroes.find((hero) => hero.id === "finn");
      clearOfBoard(drawn, finn, view, ms);
      const paper = drawn.battle.handheld.find((item) => item.hero === "finn");
      assert.equal(paper.kind, "field-paper");
      assert.equal(paper.phase, "held");
      const presented = drawn.battle.waterwayActions.props.find(
        (prop) => prop.id === "keeper-record-copy",
      );
      if (finn.walking) {
        walked = true;
        if (!offered) assert.equal(presented, undefined);
      }
      if (offered && finn.walking) returned = true;
      if (!presented) {
        continue;
      }
      offered = true;
      const giving = drawn.battle.waterwayActions.poses.finn?.frame === 2;
      assert.equal(drawn.battle.waterwayActions.poses.leon.frame, giving ? 2 : 0);
      released ||= !giving;
      if (giving) assert.equal(finn.facing, 1);
      const layout = mossBedsLayout(view);
      const pixel = layout.scale * fieldCastScale(layout.portrait) * 0.9;
      const finnHand = {
        x: roadX(finn.x, 0, view.width) + (59 - 96) * pixel,
        y: roadY(finn.lane, view.height, view.width) + (100 - 176) * pixel,
      };
      // The common arrival tolerance can leave a small gap between the palms;
      // both still touch the lower edge of the paper they are sharing.
      if (giving)
        assert.ok(
          Math.hypot(
            roadX(presented.point.x, 0, view.width) - finnHand.x,
            roadY(presented.point.lane, view.height, view.width) - finnHand.y,
          ) <
            handheldWidth(paper.kind, view, paper.sizeScale) * 0.15,
          JSON.stringify({ ms, finn, presented, finnHand }),
        );
      else {
        const leon = drawn.battle.heroes.find((hero) => hero.id === "leon");
        const palm = handheldPalm("leon", 0);
        assert.equal(
          drawn.battle.waterwayActions.poses.leon.asset,
          "/storybook-study/leon-handheld-v1.webp",
        );
        assert.ok(
          Math.abs(
            roadX(presented.point.x, 0, view.width) -
              roadX(leon.x, 0, view.width) -
              (palm[0] - 96) * pixel,
          ) < 0.001,
        );
        assert.ok(
          Math.abs(
            roadY(presented.point.lane, view.height, view.width) -
              roadY(leon.lane, view.height, view.width) -
              (palm[1] - 176) * pixel,
          ) < 0.001,
        );
      }
      assert.ok(
        Math.abs(
          presented.size * roadHeroSize(view.width, view.height) -
            handheldWidth(paper.kind, view, paper.sizeScale),
        ) < 0.001,
      );
    }
    assert.ok(walked && offered && released && returned);
    assert.ok(
      waterwayAt(
        last.battle.heroes.find((hero) => hero.id === "finn"),
        mossBedsLayout(view).world(...recordsPoint("finn", view.height > view.width)),
        view,
      ),
    );
    assert.equal(JSON.stringify(state), before);
    // Leon keeps the copy he said he would keep; Finn returns with his other papers.
    const next = frame(atNode(2), view, motion, 0);
    assert.ok(next.battle.waterwayActions.props.some((prop) => prop.id === "keeper-record-copy"));
    const encounter = frame(atEncounter(), view, motion, 0);
    assert.ok(encounter.battle.enemies.some((enemy) => enemy.kind === "lico"));
    assert.equal(
      encounter.battle.waterwayActions.props.some((prop) => prop.id === "keeper-record-copy"),
      false,
    );
  });

  test(`the copy is visible in the stable contact pose with reduced motion at ${view.width}px`, () => {
    const state = atNode(1);
    const drawn = frame(state, view, new RoadMotion(), 0, true);
    assert.ok(drawn.battle.waterwayActions.props.some((prop) => prop.id === "keeper-record-copy"));
  });
}
