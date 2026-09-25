import chapterStates from "./generated/chapter-test-states.json" with { type: "json" };
import { initialState, level, type State } from "./game.ts";
import { storyStages } from "./prologue.ts";
import { pendingInterlude } from "./interludes.ts";

const latest = chapterStates[chapterStates.length - 1];
const standardPresets = chapterStates.slice(0, -1).map(({ chapter, state }) => ({
  id: `chapter-${String(chapter + 1)}`,
  name: `${String(chapter + 1)}章・標準`,
  description: `Lv.${String(level(state.xp.aria))}・前章終了時の装備と所持金。章の冒頭から育てながら進めます。`,
  completedChapter: chapter,
}));
export const testPresets = [
  {
    id: "strong-start",
    name: "強くて最初から",
    description: "Lv.50・100万Gで、物語の最初から始めます。",
    completedChapter: 0,
  },
  ...standardPresets,
  {
    id: "latest-clear",
    name: `${String(latest.chapter)}章・クリア状態`,
    description: `Lv.${String(level(latest.state.xp.aria))}・最新章の会話を読了済み。装備や思い出を確認できます。`,
    completedChapter: latest.chapter,
  },
];
export type TestPreset = (typeof testPresets)[number]["id"];

export function testPresetState(preset: TestPreset, now: number): State {
  const config = testPresets.find((item) => item.id === preset);
  if (!config) throw Error("テスト用の開始条件を確認してください。");
  const state: State = config.completedChapter
    ? (structuredClone(chapterStates[config.completedChapter - 1].state) as State)
    : initialState(now);
  if (!config.completedChapter) {
    state.gold = 1000000;
    for (const hero of state.owned) state.xp[hero] = 30 * 49 ** 2;
  }
  state.updatedAt = now;
  state.autoNextQuest = true;
  state.log = [{ at: now, text: config.name + "のテスト記録を作りました。" }];
  const next =
    storyStages.find((stage) => !state.done[stage.quest]) ?? storyStages[storyStages.length - 1];
  for (const squad of state.squads) squad.lastQuest = pendingInterlude(state)?.id || next.quest;
  return state;
}
