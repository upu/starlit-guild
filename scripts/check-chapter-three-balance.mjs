import { pathToFileURL } from "node:url";
import { act, settle } from "../lib/game.ts";
import { chapterThreeStages, LUNCH_INTERLUDE, BERNE_QUEST } from "../lib/chapter-three.ts";
import { trainedChapter } from "./check-combat-balance.mjs";
import { chapterRoute, measure } from "./check-chapter-two-balance.mjs";

export function outfitBerne(input) {
  let state = input;
  for (const [hero, weapon] of [
    ["aria", "bow"],
    ["leon", "sword"],
    ["mira", "staff"],
    ["finn", "dagger"],
  ]) {
    for (const [slot, id] of [
      ["weapon", `berne-${weapon}`],
      ["armor", "berne-jacket"],
    ]) {
      state = act(state, { type: "buy", id }, state.updatedAt);
      state = act(state, { type: "equip", hero, slot, id }, state.updatedAt);
    }
  }
  return state;
}
export function chapterThreeRoute(input, { shop = true } = {}) {
  let state = act(input, { type: "readStory", id: LUNCH_INTERLUDE }, input.updatedAt);
  const start = state.updatedAt,
    records = [];
  let trainingSeconds = 0;
  for (const stage of chapterThreeStages) {
    let result = measure(state, stage.quest);
    for (let attempt = 0; !result.record.cleared && attempt < 24; attempt++) {
      state = act(result.state, { type: "stop" }, result.state.updatedAt);
      const farm = state.done[BERNE_QUEST] ? BERNE_QUEST : "mountain-entrance";
      state = act(state, { type: "start", id: farm, value: true }, state.updatedAt);
      state = settle(state, state.updatedAt + 300000);
      state = act(state, { type: "stop" }, state.updatedAt);
      trainingSeconds += 300;
      result = measure(state, stage.quest);
    }
    records.push(result.record);
    state = result.state;
    if (!result.record.cleared) break;
    state = act(state, { type: "readStory", id: stage.quest + "-return" }, state.updatedAt);
    if (stage.quest === BERNE_QUEST && shop) state = outfitBerne(state);
  }
  return {
    records,
    trainingSeconds,
    totalSeconds: Math.round((state.updatedAt - start) / 1000),
    state,
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const first = trainedChapter(true),
    second = chapterRoute("standard", first.state);
  const third = chapterThreeRoute(second.state);
  console.log(
    JSON.stringify(
      { chapters: [first.totalSeconds, second.totalSeconds, third.totalSeconds], ...third },
      null,
      2,
    ),
  );
}
