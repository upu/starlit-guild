import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BrekkaNotes,
  finishBrekkaNotes,
  freezeBrekkaNoteTargets,
} from "../lib/road-brekka-notes.ts";
import { waterwayPalm } from "../lib/road-waterway-contacts.ts";

test("the group stays by the cart while Finn reads a paper at his hands", () => {
  const view = { width: 390, height: 700 };
  const heroes = ["aria", "leon", "mira", "finn"].map((id, i) => ({
    id,
    x: i * 60,
    lane: 0.4 + i * 0.1,
    hp: 10,
    walking: false,
    facing: 1,
  }));
  const frame = {
    battle: { stage: "forest", time: 1000, heroes, journeyCart: { x: 200, lane: 0.82 } },
    look: { brekkaNotes: { actor: "finn", node: 2, generation: 1 } },
  };
  const before = JSON.stringify(frame),
    notes = new BrekkaNotes();
  const prepared = notes.prepare(frame, view, "run");
  const feet = new Map(heroes.map((h) => [h.id, { x: h.x, lane: h.lane }]));
  const shown = freezeBrekkaNoteTargets(prepared.battle, frame.look, feet);
  assert.equal(shown.heroes.length, 4);
  assert.equal(JSON.stringify(frame), before);
  finishBrekkaNotes(shown, frame.look, view);
  const finn = shown.heroes.find((h) => h.id === "finn");
  assert.equal(
    shown.waterwayActions.poses.finn.asset,
    "/storybook-study/finn-handheld-balanced-v2.webp",
  );
  const paper = shown.waterwayActions.props.find((p) => p.id === "brekka-notes-in-hand");
  assert.deepEqual(paper.point, waterwayPalm(finn, [116, 120], 1, view));
  assert.equal(freezeBrekkaNoteTargets(frame.battle, {}, feet), frame.battle);
});
