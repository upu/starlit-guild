import test from "node:test";
import assert from "node:assert/strict";
import { FoundingDrop, leonRecoveryPalms, finnRecoveryPalms } from "../lib/road-founding-drop.ts";
import { act, settle, testState } from "../lib/game.ts";
import { pendingInterlude } from "../lib/interludes.ts";
import { storyStages } from "../lib/prologue.ts";
import { chapterRoadFrame } from "../lib/chapter-road-presentation.ts";
import { RoadMotion } from "../lib/road-motion.ts";
import { foundingRoadBackground } from "../lib/road-journey-cart.ts";
import { handheldPalm } from "../lib/road-handheld.ts";
import { lindeCouriers } from "../lib/road-linde-couriers.ts";
import { waterwayPalm } from "../lib/road-waterway-contacts.ts";
import { roadDepth, roadScale } from "../lib/road-layout.ts";
import { FoundingRecipient } from "../lib/road-founding-recipient.ts";
import sharp from "sharp";

for (const width of [390, 936])
  test(`recipient steps clear while a fallen basket is recovered at ${width}px`, () => {
    const view = { width, height: (width * 2) / 3 },
      recipient = new FoundingRecipient(),
      battle = { time: 0, distance: 0, stage: "forest" },
      target = { x: 100, lane: 0.6 };
    let result;
    for (battle.time = 0; battle.time <= 8000; battle.time += 100)
      result = recipient.update("walk", target, battle, view);
    assert.equal(result.ready, true);
    const fallen = { x: target.x - 1, lane: target.lane };
    let previous = result.point;
    for (let i = 0; i < 20; i++) {
      result = recipient.update("walk", target, battle, view, fallen);
      assert.ok(Math.abs(result.point.x - previous.x) * roadScale(width) <= 8.01);
      assert.equal(result.ready, false);
      previous = result.point;
      battle.time += 100;
    }
    assert.ok((result.point.x - fallen.x) * roadScale(width) > 30);
    for (let i = 0; i < 20 && !result.ready; i++) {
      result = recipient.update("walk", target, battle, view);
      battle.time += 100;
    }
    assert.equal(result.ready, true);
    assert.ok(Math.abs(result.point.x - target.x) * roadScale(width) < 1);
  });

for (const [id, palms] of [
  ["leon", leonRecoveryPalms],
  ["finn", finnRecoveryPalms],
])
  test(`${id}'s recovery hands are on the actual sprite and all four frames retain clear margins`, async () => {
    const { data, info } = await sharp(`public/storybook-study/${id}-recover-offer-v1.webp`)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    assert.equal(info.width, 768);
    assert.equal(info.height, 192);
    for (const [frame, [x, y]] of palms.entries()) {
      const at = (y * info.width + frame * 192 + x) * 4;
      assert.ok(data[at + 3] > 200, `frame ${frame}: hand anchor lies on the image`);
      assert.ok(data[at] > data[at + 1], `frame ${frame}: anchor lies on the hand`);
      for (let pixel = 0; pixel < 192; pixel++) {
        for (const [cx, cy] of [
          [0, pixel],
          [191, pixel],
          [pixel, 0],
          [pixel, 191],
        ])
          assert.equal(
            data[(cy * info.width + frame * 192 + cx) * 4 + 3],
            0,
            `frame ${frame}: clear outer gutter`,
          );
      }
    }
  });

test("a dropped item stays where it fell until a replacement reaches it", () => {
  const view = { width: 390, height: 260 },
    drop = new FoundingDrop();
  const start = { x: 220, lane: 0.48 },
    foot = { x: 215, lane: 0.8 };
  drop.capture(start, foot, 1000, view, "forest");
  assert.deepEqual(drop.point(1000), start);
  const ground = drop.point(1350);
  assert.deepEqual(drop.point(5000), ground);
  const hero = {
    id: "aria",
    x: ground.x - 100,
    lane: 0.8,
    hp: 10,
    maxHp: 10,
    facing: 1,
    walking: true,
  };
  const target = drop.target(hero, view);
  hero.x = target.x;
  hero.lane = target.lane;
  hero.walking = false;
  const battle = { time: 5000 };
  const first = drop.finish(hero, battle, view);
  assert.deepEqual(first.point, ground);
  assert.equal(first.done, false);
  battle.time += 600;
  const final = drop.finish(hero, battle, view);
  assert.equal(final.done, true);
  assert.equal(drop.active, false);
});

for (const width of [390, 936])
  for (const id of ["aria", "leon", "mira", "finn"])
    for (const facing of [-1, 1])
      test(`${id} keeps the recovered object in the visible hand at ${width}px facing ${facing}`, () => {
        const view = { width, height: (width * 2) / 3 },
          drop = new FoundingDrop();
        const start = { x: 220, lane: 0.48 },
          foot = { x: 215, lane: 0.8 };
        drop.capture(start, foot, 1000, view, "forest");
        const ground = drop.point(1350);
        const hero = {
          id,
          x: ground.x - facing * 100,
          lane: 0.8,
          hp: 10,
          maxHp: 10,
          facing,
          walking: false,
        };
        Object.assign(hero, drop.target(hero, view));
        const battle = { time: 5000 };
        const custom = id === "leon" || id === "finn";
        const ages = custom
          ? [0, 199, 200, 399, 400, 599, 600, 799, 800]
          : [0, 249, 250, 499, 500, 599, 600];
        let previous;
        for (const age of ages) {
          battle.time = 5000 + age;
          const result = drop.finish(hero, battle, view);
          const frame =
            custom && age < 800
              ? Math.min(3, Math.floor(age / 200))
              : custom
                ? undefined
                : age < 250
                  ? 1
                  : age < 500
                    ? 2
                    : undefined;
          const palm =
            frame === undefined
              ? lindeCouriers[id].offerPalm
              : custom
                ? (id === "leon" ? leonRecoveryPalms : finnRecoveryPalms)[frame]
                : handheldPalm(id, frame);
          const expected = waterwayPalm(hero, palm, facing, view);
          assert.ok(Math.abs(result.point.x - expected.x) < 1e-8);
          assert.ok(Math.abs(result.point.lane - expected.lane) < 1e-8);
          assert.equal(result.pose.frame, frame ?? lindeCouriers[id].offerFrame);
          assert.equal(result.done, age === (custom ? 800 : 600));
          if (custom && previous) {
            const distance = Math.hypot(
              (result.point.x - previous.x) * roadScale(width),
              (result.point.lane - previous.lane) * roadDepth(width, view.height),
            );
            assert.ok(distance < 24, `recovery hand advances gradually: ${distance}`);
          }
          previous = result.point;
        }
      });

for (const width of [390, 936])
  for (const kind of ["letter", "basket"])
    for (const interruption of ["battle", "down", "rest", "paralyzed", "all-down"])
      test(`${interruption} keeps the carried ${kind} visible and resumes delivery at ${width}px`, () => {
        const quest = "starlit-guild-founding",
          height = (width * 2) / 3,
          view = { width, height };
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
        while (kind === "basket" && state.squads[0].run && state.squads[0].run.node < 1)
          state = settle(state, state.updatedAt + 100);
        const motion = new RoadMotion();
        let mode = "normal",
          owner,
          held,
          dropped,
          recovered = false,
          delivered = false,
          latest,
          lastRecover,
          cues = {};
        for (let i = 0; i < 1300 && !delivered; i++) {
          const before = JSON.stringify(state);
          const input = {
            squad: state.squads[0],
            startQuest: quest,
            now: state.updatedAt,
            ready: true,
            paused: false,
            storybookHeroes: true,
            backgroundOverride: foundingRoadBackground,
          };
          const frame = chapterRoadFrame(input, false, 1400, view);
          if (mode === "interrupt" && interruption === "battle")
            frame.battle.enemies = [
              { id: 99, kind: "slime", x: 500, lane: 0.6, hp: 10, maxHp: 10, boss: false },
            ];
          if (mode === "interrupt" && interruption === "rest") frame.battle.phase = "rest";
          if ((mode === "interrupt" || mode === "replacement") && interruption === "down") {
            const hero = frame.battle.heroes.find((h) => h.id === owner);
            if (hero) hero.hp = 0;
          }
          if (mode === "interrupt" && interruption === "paralyzed") {
            const hero = frame.battle.heroes.find((h) => h.id === owner);
            if (hero) hero.paralyzed = true;
          }
          if (mode === "interrupt" && interruption === "all-down")
            for (const hero of frame.battle.heroes) hero.hp = 0;
          const result = motion.update(frame, "interruption", width, false, height);
          latest = {
            cue: result.look.foundingDraft,
            cart: result.battle.journeyCart,
            heroes: result.battle.heroes,
            prop: result.battle.waterwayActions?.props,
          };
          const cue = result.look.foundingDraft?.cue ?? "none";
          cues[cue] = (cues[cue] ?? 0) + 1;
          assert.equal(JSON.stringify(state), before);
          const cart = result.battle.journeyCart,
            prop = result.battle.waterwayActions?.props.find((p) => p.id === `founding-${kind}`);
          if (mode === "normal" && result.look.foundingDraft?.cue === "walk" && prop) {
            held = { ...prop.point };
            owner = result.look.foundingDraft.actor;
            mode = "interrupt";
          } else if (mode === "interrupt") {
            assert.ok(prop, "the letter must remain visible during the interruption");
            assert.equal(cart.cargo[kind], false, "the same item cannot return to the cart");
            dropped ??= { ...prop.point };
            if (i % 10 === 0) mode = interruption === "down" ? "replacement" : "resume";
          } else if (mode === "resume" || mode === "replacement") {
            if (result.look.foundingDraft?.cue === "recover") {
              recovered = true;
              lastRecover = latest;
              if (mode === "replacement") assert.notEqual(result.look.foundingDraft.actor, owner);
            }
            if (recovered && result.look.foundingDraft?.cue === "return") delivered = true;
          }
          state = settle(state, state.updatedAt + 100);
        }
        assert.ok(
          held && dropped && recovered && delivered,
          JSON.stringify({ mode, held, dropped, recovered, delivered, cues, lastRecover, latest }),
        );
        assert.deepEqual(dropped, held, "the fall starts at the last visible position");
      });

for (const width of [390, 936])
  test(`a recipient keeps the delivered letter when combat interrupts at ${width}px`, () => {
    const quest = "starlit-guild-founding",
      view = { width, height: (width * 2) / 3 };
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
    const motion = new RoadMotion();
    let interrupt = false,
      verified = false,
      giveFrames = 0;
    for (let i = 0; i < 800 && !verified; i++) {
      const before = JSON.stringify(state);
      const frame = chapterRoadFrame(
        {
          squad: state.squads[0],
          startQuest: quest,
          now: state.updatedAt,
          ready: true,
          paused: false,
          storybookHeroes: true,
          backgroundOverride: foundingRoadBackground,
        },
        false,
        1400,
        view,
      );
      if (interrupt)
        frame.battle.enemies = [
          { id: 99, kind: "slime", x: 500, lane: 0.6, hp: 10, maxHp: 10, boss: false },
        ];
      const result = motion.update(frame, "received-combat", width, false, view.height);
      assert.equal(JSON.stringify(state), before);
      const scene = result.battle.waterwayActions;
      const recipient = scene?.actors?.find((actor) => actor.id === "founding-recipient-letter");
      const letter = scene?.props.find((prop) => prop.id === "founding-letter");
      if (interrupt) {
        assert.equal(result.look.foundingDraft.cue, "recipient-wait");
        assert.ok(recipient && letter, "the recipient retains the same visible letter");
        assert.equal(result.battle.journeyCart.cargo.letter, false);
        verified = true;
      } else if (
        result.look.foundingDraft?.cue === "give" &&
        recipient &&
        letter &&
        ++giveFrames >= 6
      )
        interrupt = true;
      state = settle(state, state.updatedAt + 100);
    }
    assert.ok(verified, "combat must begin after the letter reaches the recipient");
  });
