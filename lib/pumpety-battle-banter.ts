import type { Run } from "./game-types.ts";
import type { StoryLine } from "./stories.ts";

export const pumpetyBattleExchanges = {
  opening: [
    {
      speaker: "masked-pumpety",
      expression: "mischievous",
      text: "今度はプティも一緒なのよ。さあ、並んで、通せんぼ！",
    },
    { speaker: "aria", expression: "serious", text: "増えたって、蜜は返してもらうからね！" },
  ],
  command: [
    {
      speaker: "masked-pumpety",
      expression: "mischievous",
      text: "そこでおしまいじゃないのよ。もう一回なのよ！",
    },
    { speaker: "leon", expression: "surprised", text: "続けて来るぞ！　アリア、一度下がって！" },
    { speaker: "aria", expression: "serious", text: "あの手の合図だね。次は見てるよ！" },
  ],
  falter: [
    {
      speaker: "masked-pumpety",
      expression: "surprised",
      text: "あっ、そっちの子！　寝るにはまだ早いのよ！",
    },
    {
      speaker: "mira",
      expression: "serious",
      text: "あなたも、そろそろおしまいにしましょう。蜜を待っている子がいるの。",
    },
  ],
  escape: [
    {
      speaker: "masked-pumpety",
      expression: "worried",
      text: "今日はここまでなのよ！　ほら、ふたりとも、帰るのよ！",
    },
    { speaker: "aria", expression: "surprised", text: "引っぱって帰るの！？　蜜は置いてってよ！" },
  ],
} satisfies Record<string, StoryLine[]>;

export function pumpetyBattleBanter(run: Run): StoryLine[] | null {
  if (run.quest !== "sweet-blockade" || run.phase === "rest") return null;
  if (run.road?.scene?.kind === "escape") return pumpetyBattleExchanges.escape;
  const master = run.enemies?.find((enemy) => enemy.role === "puppeteer" && enemy.hp > 0);
  if (!master) return null;
  if (run.enemies?.some((enemy) => enemy.role !== "puppeteer" && enemy.hp <= 0))
    return pumpetyBattleExchanges.falter;
  if (
    run.events.some(
      (event) =>
        event.kind === "move" &&
        event.enemy === master.id &&
        event.id.startsWith(`${String(run.round)}-${String(run.node)}-`),
    )
  )
    return pumpetyBattleExchanges.command;
  return pumpetyBattleExchanges.opening;
}
