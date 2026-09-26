import { pathToFileURL } from "node:url";
import { act, settle } from "../lib/game.ts";
import { chapterFourStages, WALNUT_INTERLUDE, LINDE_REQUESTS_QUEST } from "../lib/chapter-four.ts";
import { trainedChapter } from "./check-combat-balance.mjs";
import { chapterRoute, measure } from "./check-chapter-two-balance.mjs";
import { chapterThreeRoute } from "./check-chapter-three-balance.mjs";

// Carry the entire earned third-chapter state into the fourth chapter.
export function chapterFourRoute(input) {
  let state = act(input, { type: "readStory", id: WALNUT_INTERLUDE }, input.updatedAt);
  const start = state.updatedAt;
  const records = [];
  let trainingSeconds = 0;
  for (const stage of chapterFourStages) {
    let result = measure(state, stage.quest);
    for (let attempt = 0; !result.record.cleared && attempt < 24; attempt++) {
      state = act(result.state, { type: "stop" }, result.state.updatedAt);
      const farm = state.done[LINDE_REQUESTS_QUEST] ? LINDE_REQUESTS_QUEST : "berne-road";
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
  }
  return {
    records,
    trainingSeconds,
    totalSeconds: Math.round((state.updatedAt - start) / 1000),
    state,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const first = trainedChapter(true);
  const second = chapterRoute("standard", first.state);
  const third = chapterThreeRoute(second.state);
  const fourth = chapterFourRoute(third.state);
  console.log(
    JSON.stringify(
      {
        records: fourth.records,
        trainingSeconds: fourth.trainingSeconds,
        totalSeconds: fourth.totalSeconds,
        xp: fourth.state.xp,
        gold: fourth.state.gold,
      },
      null,
      2,
    ),
  );
}
