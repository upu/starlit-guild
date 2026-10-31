import type { Run } from "./game-types.ts";
import type { StoryLine } from "./stories.ts";
import { confrontation, paralyzed } from "./chapter-four-battles.ts";

const licoOpening: StoryLine[] = [
  {
    speaker: "lico",
    expression: "serious",
    text: "その板、踏まないで。……近づくなら、足を止めるよ。",
  },
  { speaker: "leon", expression: "serious", text: "瓶の口を確かめよう。風下には入らないで。" },
];
const licoSmoke: StoryLine[] = [
  { speaker: "lico", expression: "serious", text: "しびれるだけ。少し待てば、動くから。" },
  { speaker: "aria", expression: "surprised", text: "その煙、しびれるの！？　先に言ってよ！" },
  { speaker: "mira", expression: "serious", text: "無理に動かさないで。私が支えるわ。" },
  { speaker: "finn", expression: "thoughtful", text: "動ける方で栓を閉めよう。こっちの瓶もかい？" },
  { speaker: "lico", expression: "worried", text: "あ、それは比較用。混ぜないで。" },
];
/** Keep the confrontation's exchange separate from earlier route conversations. */
export function licoRecordsBanterContext(run: Run | null) {
  return run?.quest === "lico-records" && run.enemies?.some((enemy) => enemy.trick === "lico")
    ? "lico-records-confrontation"
    : undefined;
}
export function licoRecordsEncounterStopped(run: Run | null) {
  return !!licoRecordsBanterContext(run) && !run?.enemies?.some((enemy) => enemy.hp > 0);
}
/** Only the confrontation's authored lines are conditioned on battle health. */
export function licoRecordsLineAvailable(
  line: StoryLine,
  run: Run | null,
  history: StoryLine[] = [],
  patient?: string,
  now = 0,
) {
  if (!run || run.quest !== "lico-records") return true;
  const authored = [...licoOpening, ...licoSmoke].some(
    (entry) => entry.speaker === line.speaker && entry.text === line.text,
  );
  const patientLine =
    line.speaker === "mira" &&
    line.text === "足がしびれてきたわ。無理に動かず、煙が薄れるのを待ちましょう。";
  if (!authored && !patientLine) return true;
  if (
    line.speaker === licoSmoke[2].speaker &&
    line.text === licoSmoke[2].text &&
    !recordsSupportAvailable(run, patient, now)
  )
    return false;
  if (line.speaker === "lico") {
    // Her comparison-bottle reply only makes sense after Finn's question.
    return (
      line.text !== licoSmoke[4].text ||
      history.some(
        (entry) => entry.speaker === licoSmoke[3].speaker && entry.text === licoSmoke[3].text,
      )
    );
  }
  return (
    !!line.speaker && Object.hasOwn(run.health, line.speaker) && run.health[line.speaker].hp > 0
  );
}
function recordsSupportAvailable(run: Run, patient: string | undefined, now: number) {
  if (!patient || patient === "mira" || !Object.hasOwn(run.health, patient)) return false;
  const helper = run.actors.find((actor) => actor.hero === "mira");
  return run.health[patient].hp > 0 && !!helper && !paralyzed(helper, now);
}
/** Match the actual displayed line, including retained battle dialogue. */
export function licoRecordsBanterCue(line?: StoryLine): "support" | "bottle" | "other" {
  if (!line) return "other";
  const same = (entry: StoryLine) => entry.speaker === line.speaker && entry.text === line.text;
  if (same(licoSmoke[2])) return "support";
  if (same(licoSmoke[3])) return "bottle";
  return "other";
}
/** Give the helper time to reach the patient or the apparatus before the next line. */
export function licoRecordsBanterMinimum(line?: StoryLine) {
  const cue = licoRecordsBanterCue(line);
  return cue === "support" || cue === "bottle" ? 8000 : 0;
}
/** Mira does not promise to support someone else when she is the one affected. */
export function licoRecordsPatientBanter(lines: StoryLine[], patient?: string) {
  if (patient !== "mira") return lines;
  return lines.map((line) =>
    line.speaker === licoSmoke[2].speaker && line.text === licoSmoke[2].text
      ? { ...line, text: "足がしびれてきたわ。無理に動かず、煙が薄れるのを待ちましょう。" }
      : line,
  );
}
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
const merrillStopped: StoryLine[] = [
  { text: "メリルは動きを止めた。コロタケたちは、まだ動いている。" },
];
/** Use monotonic phases so repeated songs do not restart the same dialogue. */
export function merrillBanterContext(run: Run | null) {
  if (run?.quest !== "merrill-seedlings" || run.phase === "rest") return undefined;
  const master = run.enemies?.find((enemy) => enemy.trick === "merrill");
  if (!master) return undefined;
  if (master.hp <= 0)
    return run.enemies?.some((enemy) => enemy.hp > 0) ? "merrill-stopped" : undefined;
  return `merrill-${String(Math.min(2, master.actions ?? 0))}`;
}
export function merrillSingingLine(line?: StoryLine) {
  return !!line && line.speaker === merrillSong[0].speaker && line.text === merrillSong[0].text;
}
function merrillDialogue(master: NonNullable<Run["enemies"]>[number] | undefined) {
  if (master && master.hp <= 0) return merrillStopped;
  const actions = master?.actions ?? 0;
  return actions >= 2 ? merrillSong : actions === 1 ? merrillSummon : merrillOpening;
}
export function chapterFourBattleBanter(run: Run): StoryLine[] | null {
  if (run.phase === "rest" || !run.enemies?.some((e) => e.hp > 0)) return null;
  const kind = confrontation(run.quest, run.road?.ambushNode ?? run.node, run.nodes);
  const master = run.enemies.find((e) => e.trick === kind);
  const actions = master?.actions || 0;
  if (kind === "lico") return actions > 0 ? licoSmoke : licoOpening;
  if (kind === "merrill") return merrillDialogue(master);
  return null;
}
/** Reconstruct the last observed encounter, including its smoke cue, after it ends. */
export function licoRecordsRetainedBanter(run: Run | null, patient?: string) {
  if (!run || !licoRecordsBanterContext(run)) return [];
  return licoRecordsPatientBanter(chapterFourBattleBanter(run) ?? [], patient);
}
