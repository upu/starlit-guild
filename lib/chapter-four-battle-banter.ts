import type { Run } from "./game-types.ts";
import type { StoryLine } from "./stories.ts";
import { confrontation } from "./chapter-four-battles.ts";

const licoOpening: StoryLine[] = [
  {
    speaker: "lico",
    expression: "serious",
    text: "その板、踏まないで。……近づくなら、足を止めるよ。",
  },
  { speaker: "leon", expression: "serious", text: "アリア、瓶の口を見て。風下には入らないで。" },
];
const licoSmoke: StoryLine[] = [
  { speaker: "lico", expression: "serious", text: "しびれるだけ。少し待てば、動くから。" },
  { speaker: "aria", expression: "surprised", text: "その煙、しびれるの！？　先に言ってよ！" },
  { speaker: "mira", expression: "serious", text: "無理に動かさないで。私が支えるわ。" },
  { speaker: "finn", expression: "thoughtful", text: "動ける方で栓を閉めよう。こっちの瓶もかい？" },
  { speaker: "lico", expression: "worried", text: "あ、それは比較用。混ぜないで。" },
];
const merrillOpening: StoryLine[] = [
  {
    speaker: "merrill",
    expression: "excited",
    text: "苔はひと口でいいの。……その籠、ひと口には大きいね。",
  },
  { speaker: "lico", expression: "serious", text: "籠ごと数えないで。植える分なの。" },
];
const merrillSummon: StoryLine[] = [
  {
    speaker: "merrill",
    expression: "smile",
    text: "コロタケたち、ちょっと手伝って。晩ごはんはあとでね。",
  },
  { speaker: "aria", expression: "surprised", text: "カバンから……動くキノコ！？" },
  { speaker: "leon", expression: "serious", text: "籠から離そう。こっちへ来い！" },
];
const merrillSong: StoryLine[] = [
  {
    speaker: "merrill",
    expression: "savoring",
    text: "コロタケ、ころころ、もうひと踊り♪　焦げる前には、ひと返し♪",
  },
  { speaker: "lico", expression: "shouting", text: "あーーっ！　コロタケ、元気になってる！" },
  { speaker: "mira", expression: "surprised", text: "歌に合わせて、傷がふさがっているわ。" },
  { speaker: "finn", expression: "mischievous", text: "いい声だが、もう一曲は遠慮したいね。" },
  { speaker: "merrill", expression: "excited", text: "まだ歌えるよ。お腹も、まだ空いてるし！" },
];
export function chapterFourBattleBanter(run: Run): StoryLine[] | null {
  if (run.phase === "rest" || !run.enemies?.some((e) => e.hp > 0)) return null;
  const kind = confrontation(run.quest, run.road?.ambushNode ?? run.node, run.nodes);
  const master = run.enemies.find((e) => e.trick === kind);
  const actions = master?.actions || 0;
  if (kind === "lico") return actions > 0 ? licoSmoke : licoOpening;
  if (kind === "merrill")
    return actions >= 2 ? merrillSong : actions === 1 ? merrillSummon : merrillOpening;
  return null;
}
