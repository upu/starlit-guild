import { initialState, act, settle, quests, heroes, allQuests, memberLimit } from "../lib/game.ts";
import { recruitments, met, canPrepare, rareProgress } from "../lib/recruitment.ts";
let s = initialState(1000);
const records = [];
function prepareParty() {
  const members = [
    "aria",
    "leon",
    ...(s.owned.includes("mira") && memberLimit(s) >= 3 ? ["mira"] : []),
  ];
  s = act(s, { type: "party", members }, s.updatedAt);
  while (
    s.gear < Math.min(8, 1 + Math.floor(s.clears / 10)) &&
    s.gold >= 100 * (s.gear + 1) &&
    s.ore >= 5 * (s.gear + 1) &&
    s.clears >= 3
  )
    s = act(s, { type: "gear" }, s.updatedAt);
}
function run(q) {
  prepareParty();
  s = act(s, { type: "repeat", value: false }, s.updatedAt);
  s = act(s, { type: "start", id: q.id }, s.updatedAt);
  let events = 0;
  while (s.squads[0].run && events++ < 100000) s = settle(s, s.squads[0].run.nextAt).state;
  if (s.squads[0].run)
    throw Error(
      "Cannot complete " + q.id + " with " + s.squads[0].members + " at clears " + s.clears,
    );
}
for (const r of recruitments) {
  let runs = 0;
  while (!canPrepare(s, r) && runs++ < 2500) {
    let q;
    const sources = r.rare.sources
      .map((id) => quests.find((q) => q.id === id))
      .filter((q) => q.unlock <= s.clears);
    if (rareProgress(s, r).remaining && sources.length) q = sources[0];
    else {
      const lack = Object.keys(r.cost).find((k) => s[k] < r.cost[k]);
      const candidates = quests.filter((q) => q.unlock <= s.clears);
      q =
        lack === "herbs"
          ? candidates.filter((q) => q.herbs > 0).sort((a, b) => b.herbs - a.herbs)[0]
          : lack === "ore"
            ? candidates.filter((q) => q.ore > 0).sort((a, b) => b.ore - a.ore)[0]
            : candidates.at(-1);
    }
    run(q || quests[0]);
  }
  if (!canPrepare(s, r) || !met(s, r)) throw Error("Preparation never reached: " + r.hero);
  s = act(s, { type: "prepareRecruitment", id: r.hero }, s.updatedAt);
  run(allQuests.find((q) => q.companion === r.hero));
  records.push({
    name: r.name,
    clears: s.clears,
    minutes: Math.round((s.updatedAt - 1000) / 60000),
    gear: s.gear,
    levels: s.squads[0].members.map((id) => ({
      name: heroes.find((h) => h.id === id).name,
      level: Math.min(50, 1 + Math.floor(Math.sqrt((s.xp[id] || 0) / 30))),
    })),
  });
}
console.log(JSON.stringify(records, null, 2));
