import { test } from "node:test";
import assert from "node:assert/strict";
import { act, settle, initialState, heroes, heroSkills } from "../lib/game.ts";
import { stories, availableStories, campStories, journeyBanter } from "../lib/stories.ts";
import { originalCharacters } from "../lib/original-characters.ts";
import { recruitments } from "../lib/recruitment.ts";
import { parseBundle } from "../lib/save-format.ts";
const restore = (state) => {
  const id = crypto.randomUUID();
  return parseBundle({
    format: 4,
    deviceId: crypto.randomUUID(),
    active: id,
    profiles: [{ id, name: "三人との出会い", test: false, state }],
    serial: 1,
    sound: false,
    cloudAt: 0,
    legacyImported: true,
  }).profiles[0].state;
};

test("guest conversations use their own present cast; memories remain when that cast departs", () => {
  let s = initialState(1000);
  s.owned.push("chacha", "mira");
  s.town = 1;
  s.squads[0].members = ["aria", "leon"];
  s = act(s, { type: "start", id: "herbs" }, 1000);
  assert.ok(
    campStories(s).some((st) => st.id === "camp-chacha-mira"),
    "tea does not require the childhood friends at home",
  );
  s.squads.push({
    id: "party-2",
    name: "お茶の隊",
    members: ["chacha", "mira"],
    repeat: true,
    run: null,
  });
  s = act(s, { type: "start", id: "herbs", squad: "party-2" }, 1000);
  assert.ok(!campStories(s).some((st) => st.id === "camp-chacha-mira"));
  assert.ok(availableStories(s).some((st) => st.id === "camp-chacha-mira"));
  assert.deepEqual(
    journeyBanter(s, s.squads[1], 1000).map((l) => l.speaker),
    ["chacha", "mira"],
  );
});

test("NPC speakers resolve without becoming recruitable heroes; all named speakers exist", () => {
  const cast = new Set([...heroes, ...originalCharacters].map((c) => c.id));
  for (const st of stories)
    for (const line of st.lines)
      if (line.speaker) assert.ok(cast.has(line.speaker), st.id + ": " + line.speaker);
  for (const id of ["merrill", "pumpety"]) {
    assert.ok(!heroes.some((h) => h.id === id));
    assert.ok(!recruitments.some((r) => r.hero === id));
  }
});

test("Halloween pair banter stays ahead of Chacha generic expedition banter", () => {
  const s = initialState(1000);
  s.owned.push("chacha");
  s.clears = 10;
  s.squads[0].members = ["aria", "leon", "chacha"];
  const started = act(s, { type: "start", id: "midnight-snack" }, 1000),
    speakers = journeyBanter(started, started.squads[0], 1000).map((line) => line.speaker);
  assert.ok(speakers.includes("merrill"));
  assert.ok(!speakers.includes("chacha"));
});

test("Chacha has real heavy melee strikes and her tea scene only plays when she is home", () => {
  let s = initialState(1000);
  s.owned.push("chacha");
  s.clears = 6;
  s.squads[0].members = ["chacha"];
  s = act(s, { type: "start", id: "slime" }, 1000);
  let normal, special;
  for (let i = 0; i < 1000 && !special; i++) {
    s = settle(s, s.squads[0].run.nextAt).state;
    const events = s.squads[0].run.events;
    normal ??= events.find((e) => e.hero === "chacha" && e.kind === "hit");
    special = events.find((e) => e.hero === "chacha" && e.kind === "skill");
  }
  assert.equal(heroSkills.chacha.style, "melee");
  assert.ok(
    Math.abs(special.amount - normal.amount * 2) <= 1,
    "double power before integer rounding",
  );
  assert.doesNotThrow(() => restore(s));
  s.town = 1;
  s.story = { departed: ["herbs"], completed: ["herbs"], read: [] };
  assert.ok(!campStories(s).some((st) => st.id === "camp-chacha-tea"));
  s = act(s, { type: "stop" }, s.updatedAt);
  assert.ok(campStories(s).some((st) => st.id === "camp-chacha-tea"));
  s.owned = s.owned.filter((id) => id !== "chacha");
  assert.ok(!availableStories(s).some((st) => st.id === "camp-chacha-tea"));
});
