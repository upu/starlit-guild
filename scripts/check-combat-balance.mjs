import { pathToFileURL } from "node:url";
import { act, settle, initialPrologueState, level, allQuests } from "../lib/game.ts";
import { prologueStages } from "../lib/prologue.ts";
import { combatRank } from "../lib/combat.ts";

export function simulateCombat(input, quest, limitMs = 600000) {
  let state = act(
    input,
    { type: "start", id: quest, value: false, readDeparture: true },
    input.updatedAt,
  );
  const start = state.updatedAt,
    record = {
      quest,
      rank: combatRank(allQuests.find((q) => q.id === quest)),
      levels: state.squads[0].members.map((id) => level(state.xp[id] || 0)),
      seconds: 0,
      cleared: false,
      rests: 0,
      maxEnemies: 0,
      maxEnemyHp: 0,
      minHit: null,
    };
  for (let steps = 0; state.squads[0].run && steps < 20000; steps++) {
    const run = state.squads[0].run;
    if (run.nextAt > start + limitMs) break;
    record.maxEnemies = Math.max(record.maxEnemies, run.enemies?.length || 0);
    for (const enemy of run.enemies || [])
      record.maxEnemyHp = Math.max(record.maxEnemyHp, enemy.maxHp);
    const phase = run.phase;
    state = settle(state, run.nextAt).state;
    const next = state.squads[0].run;
    if (next?.phase === "rest" && phase !== "rest") record.rests++;
    for (const event of next?.events || [])
      if (
        event.at === state.updatedAt &&
        event.enemy &&
        event.kind === "hit" &&
        next.enemies?.some((enemy) => enemy.id === event.enemy && enemy.hp > 0)
      )
        record.minHit = Math.min(record.minHit ?? Infinity, event.amount);
  }
  record.seconds = Math.round((state.updatedAt - start) / 1000);
  record.cleared = !state.squads[0].run;
  return { state, record };
}
export function combatScenarios() {
  const records = [];
  let state = initialPrologueState(1000);
  for (const stage of prologueStages) {
    const result = simulateCombat(state, stage.quest);
    records.push(result.record);
    if (!result.record.cleared) break;
    state = act(
      result.state,
      { type: "readStory", id: stage.quest + "-return" },
      result.state.updatedAt,
    );
  }
  return records;
}
export function chapterCombatState(index, lv, equipped = false) {
  let state = initialPrologueState(1000);
  state.gold = 1000;
  for (const stage of prologueStages.slice(0, index)) {
    state.done[stage.quest] = 1;
    state.story.departed.push(stage.quest);
    state.story.completed.push(stage.quest);
    state.story.read.push(stage.quest + "-return");
  }
  for (const id of state.owned) state.xp[id] = 30 * (lv - 1) ** 2;
  if (equipped)
    for (const [hero, weapon] of [
      ["aria", "ash-bow"],
      ["leon", "steel-sword"],
    ]) {
      state = act(state, { type: "buy", id: weapon }, 1000);
      state = act(state, { type: "equip", hero, slot: "weapon", id: weapon }, 1000);
      state = act(state, { type: "buy", id: "leather-vest" }, 1000);
      state = act(state, { type: "equip", hero, slot: "armor", id: "leather-vest" }, 1000);
    }
  return state;
}
export function chapterComparisons() {
  return [6, 7, 8].flatMap((index) =>
    [5, 8, 10, 12, 15].flatMap((lv) =>
      [false, true].map((equipped) => ({
        ...simulateCombat(chapterCombatState(index, lv, equipped), prologueStages[index].quest)
          .record,
        equipped,
      })),
    ),
  );
}
export function trainedChapter(includeState = false) {
  let state = initialPrologueState(1000),
    trainingSeconds = 0;
  const records = [];
  for (const [index, stage] of prologueStages.entries()) {
    if (index === 3)
      for (const [hero, weapon] of [
        ["aria", "ash-bow"],
        ["leon", "steel-sword"],
      ]) {
        state = act(state, { type: "buy", id: weapon }, state.updatedAt);
        state = act(state, { type: "equip", hero, slot: "weapon", id: weapon }, state.updatedAt);
        state = act(state, { type: "buy", id: "leather-vest" }, state.updatedAt);
        state = act(
          state,
          { type: "equip", hero, slot: "armor", id: "leather-vest" },
          state.updatedAt,
        );
      }
    let result = simulateCombat(state, stage.quest, 180000);
    for (let attempts = 0; !result.record.cleared && attempts < 10; attempts++) {
      state = act(result.state, { type: "stop" }, result.state.updatedAt);
      const farm = prologueStages[Math.min(index - 1, 5)].quest;
      state = act(state, { type: "start", id: farm, value: true }, state.updatedAt);
      state = settle(state, state.updatedAt + 300000).state;
      trainingSeconds += 300;
      state = act(state, { type: "stop" }, state.updatedAt);
      result = simulateCombat(state, stage.quest, 180000);
    }
    records.push(result.record);
    if (!result.record.cleared) break;
    state = act(
      result.state,
      { type: "readStory", id: stage.quest + "-return" },
      result.state.updatedAt,
    );
  }
  return {
    records,
    trainingSeconds,
    totalSeconds: Math.round((state.updatedAt - 1000) / 1000),
    ...(includeState ? { state } : {}),
  };
}
export function tappedCombat(input, quest, tapsPerSecond = 8) {
  let state = act(
      input,
      { type: "start", id: quest, value: false, readDeparture: true },
      input.updatedAt,
    ),
    taps = 0;
  const start = state.updatedAt,
    interval = 1000 / tapsPerSecond;
  for (let at = start + interval; at <= start + 600000 && state.squads[0].run; at += interval) {
    state = settle(state, at).state;
    if (!state.squads[0].run) break;
    state = act(
      state,
      { type: "assist", mode: state.squads[0].run.phase === "rest" ? "heal" : "strike" },
      at,
    );
    taps++;
  }
  return {
    cleared: !state.squads[0].run,
    seconds: Math.round((state.updatedAt - start) / 1000),
    taps,
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(
    JSON.stringify(
      {
        untrained: combatScenarios(),
        comparisons: chapterComparisons(),
        trained: trainedChapter(),
        tapping: tappedCombat(chapterCombatState(8, 5), prologueStages[8].quest),
      },
      null,
      2,
    ),
  );
