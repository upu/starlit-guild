import { initialPrologueState, act, type State } from "./game.ts";
import { prologueStages } from "./prologue.ts";

export const chapterTwoPresets = [
  {
    id: "standard",
    name: "第2章・標準",
    level: 10,
    description: "Lv.10・店の武器と革の上着。第1章を終えた目安。育てながら挑戦します。",
  },
  {
    id: "strong",
    name: "第2章・余裕あり",
    level: 30,
    description: "Lv.30・店の武器と革の上着。物語や演出を余裕を持って確認します。",
  },
] as const;
export type ChapterTwoPreset = (typeof chapterTwoPresets)[number]["id"];

// Both presets start before 2-1, keeping Mira's introduction and recruitment intact.
export function chapterTwoPresetState(preset: ChapterTwoPreset, now: number): State {
  const config = chapterTwoPresets.find((item) => item.id === preset);
  if (!config) throw Error("テスト用の開始条件を確認してください。");
  let state = initialPrologueState(now);
  state.gold = 1000;
  state.clears = prologueStages.length;
  const story = (state.story = { departed: [], completed: [], read: [] } as NonNullable<
    State["story"]
  >);
  for (const { quest } of prologueStages) {
    state.done[quest] = 1;
    story.departed.push(quest);
    story.completed.push(quest);
    story.read.push(quest + "-departure", quest + "-return");
  }
  for (const [hero, weapon] of [
    ["aria", "ash-bow"],
    ["leon", "steel-sword"],
  ]) {
    state.xp[hero] = 30 * (config.level - 1) ** 2;
    for (const [slot, id] of [
      ["weapon", weapon],
      ["armor", "leather-vest"],
    ] as const) {
      state = act(state, { type: "buy", id }, now);
      state = act(state, { type: "equip", hero, slot, id }, now);
    }
  }
  state.log = [{ at: now, text: config.name + "の条件で、第2章の冒険を始めます。" }];
  state.squads[0].lastQuest = "hilltop-picnic";
  return state;
}
