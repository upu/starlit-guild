import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  act,
  settle,
  heroes,
  quests,
  recruitmentQuests,
  allQuests,
  targetName,
} from "../lib/game.ts";
import {
  recruitments,
  met,
  prepared,
  rareProgress,
  canPrepare,
  recruitmentNeeds,
} from "../lib/recruitment.ts";
import { availableStories } from "../lib/stories.ts";
import { parseBundle } from "../lib/save-format.ts";

function bundle(s) {
  const id = crypto.randomUUID();
  return {
    format: 4,
    deviceId: crypto.randomUUID(),
    active: id,
    profiles: [{ id, name: "出会いの旅", test: false, state: s }],
    serial: 1,
    sound: false,
    cloudAt: 0,
    legacyImported: true,
  };
}
const restore = (s) => parseBundle(JSON.parse(JSON.stringify(bundle(s)))).profiles[0].state;
function supplied(r) {
  const s = initialState(1000);
  s.clears = Math.max(60, r.unlock);
  s.owned = heroes.filter((h) => h.id !== r.hero).map((h) => h.id);
  s.squads[0].members = ["aria", "leon"];
  s.xp.aria = s.xp.leon = 30 * 19 ** 2;
  s.gear = 10;
  s.town = 2;
  for (const key of ["gold", "wood", "herbs", "ore"]) s[key] = r.cost[key] + 200;
  s.done[r.rare.sources[0]] = r.rare.every * r.rare.count;
  return s;
}

test("seven distinct arcs each have an accessible material source and playable mission", () => {
  assert.equal(recruitments.length, 7);
  assert.equal(recruitmentQuests.length, 7);
  assert.equal(quests.length, 29);
  assert.equal(new Set(allQuests.map((q) => q.id)).size, 36);
  for (const r of recruitments) {
    assert.ok(r.rare.sources.some((id) => quests.find((q) => q.id === id).unlock <= r.unlock));
    assert.ok(allQuests.some((q) => q.companion === r.hero));
    const s = supplied(r);
    assert.ok(met(s, r));
    assert.ok(canPrepare(s, r));
  }
});

test("gold alone never buys a hero or skips their materials and encounter", () => {
  const s = initialState(1000);
  s.gold = 100000;
  assert.throws(() => act(s, { type: "recruit", id: "mira" }, 1000), /専用クエスト/);
  assert.throws(() => act(s, { type: "prepareRecruitment", id: "mira" }, 1000));
  s.clears = 60;
  s.wood = s.herbs = s.ore = 10000;
  assert.throws(() => act(s, { type: "prepareRecruitment", id: "mira" }, 1000));
  assert.throws(() => act(s, { type: "start", id: "join-mira" }, 1000));
  const finn = supplied(recruitments.find((r) => r.hero === "finn"));
  finn.owned = finn.owned.filter((id) => id !== "mira");
  assert.ok(
    !met(
      finn,
      recruitments.find((r) => r.hero === "finn"),
    ),
  );
  assert.ok(
    !canPrepare(
      finn,
      recruitments.find((r) => r.hero === "finn"),
    ),
  );
  assert.deepEqual(s.owned, ["aria", "leon"]);
});

test("insufficient materials reject atomically without partial payment", () => {
  for (const r of recruitments)
    for (const need of recruitmentNeeds(supplied(r), r)) {
      const s = supplied(r);
      if (need.key === r.rare.id) s.done[r.rare.sources[0]] = r.rare.every * r.rare.count - 1;
      else s[need.key] = need.need - 1;
      const before = structuredClone(s);
      assert.throws(() => act(s, { type: "prepareRecruitment", id: r.hero }, 1000));
      assert.deepEqual(s, before);
    }
});

test("preparation reveals an interlude at the halfway milestone without spending items", () => {
  const r = recruitments.find((r) => r.hero === "finn"),
    s = supplied(r),
    half = Math.ceil(r.rare.count / 2) * r.rare.every;
  s.done[r.rare.sources[0]] = half - 1;
  assert.ok(!availableStories(s).some((st) => st.id === "recruit-finn-progress"));
  s.done[r.rare.sources[0]] = half;
  const before = structuredClone(s);
  assert.ok(availableStories(s).some((st) => st.id === "recruit-finn-progress"));
  assert.deepEqual(s, before);
  assert.ok(!s.owned.includes("finn"));
  assert.ok(!prepared(s, "finn"));
});

test("offline completion, multiple squads and repeated settlement preserve one join and rare progress", () => {
  let s = act(supplied(recruitments[0]), { type: "prepareRecruitment", id: "mira" }, 1000);
  s.squads.push({
    id: "party-2",
    name: "素材の隊",
    members: ["garr", "finn"],
    repeat: true,
    run: null,
  });
  s = act(s, { type: "start", id: "join-mira" }, 1000);
  s = act(s, { type: "start", id: "cart", squad: "party-2" }, 1000);
  const bulk = settle(s, 601000).state;
  let frames = s;
  for (let now = 1200; now <= 601000; now += 200) frames = settle(frames, now).state;
  for (const key of [
    "owned",
    "done",
    "gold",
    "herbs",
    "ore",
    "wood",
    "xp",
    "friendship",
    "recruitment",
    "squads",
  ])
    assert.deepEqual(bulk[key], frames[key], key);
  for (const r of recruitments) assert.deepEqual(rareProgress(bulk, r), rareProgress(frames, r));
  assert.equal(bulk.squads[0].run, null);
  assert.ok(bulk.squads[1].run);
  assert.equal(bulk.done["join-mira"], 1);
  assert.deepEqual(settle(bulk, 601000).state, bulk);
  assert.doesNotThrow(() => restore(bulk));
});

test("new mission targets and save clocks remain valid at every location including offline cap", () => {
  for (const r of recruitments) {
    let s = act(supplied(r), { type: "prepareRecruitment", id: r.hero }, 1000);
    s = act(s, { type: "start", id: "join-" + r.hero }, 1000);
    const visited = new Set();
    for (let i = 0; s.squads[0].run && i < 20000; i++) {
      const run = s.squads[0].run;
      if (!visited.has(run.node)) {
        visited.add(run.node);
        assert.ok(
          targetName(
            allQuests.find((q) => q.id === run.quest),
            run.node,
          ),
        );
        assert.doesNotThrow(() => restore(s));
      }
      s = settle(s, run.nextAt).state;
    }
    assert.equal(visited.size, 15);
    assert.ok(s.owned.includes(r.hero));
    assert.doesNotThrow(() => restore(settle(s, s.updatedAt + 86400000).state));
  }
});
