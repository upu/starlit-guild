import type { State } from "@/lib/game";
import { hasStudyStatus, hasVisualProgress, studyStatus } from "./adventure-description";
import { chapterFourWork } from "@/lib/chapter-four";
import type { LindeProgress } from "../../phaser/renderer-session";

export function StudyStatus({
  quest,
  state,
  linde,
  painted,
}: {
  quest: string;
  state: State | null;
  linde?: LindeProgress | null;
  painted: boolean;
}) {
  if (!hasVisualProgress(quest, painted)) linde = null;
  const fighting = state?.squads[0].run?.enemies?.some((enemy) => enemy.hp > 0);
  const label = fighting
    ? studyStatus(state)
    : linde?.complete
      ? "到着しました"
      : linde
        ? visualStatus(quest, linde)
        : studyStatus(state);
  return hasStudyStatus(quest) ? (
    <output className="storybook-review-status">{label}</output>
  ) : null;
}

function visualStatus(quest: string, progress: LindeProgress) {
  const name = chapterFourWork(quest, progress.node)?.name ?? "";
  const phase = progress.phase === "move" ? "移動中" : "作業中";
  return `${String(progress.node + 1)}/15 · ${name} · ${phase}`;
}
