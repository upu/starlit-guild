import type { AdventureFrame } from "./adventure-presentation.ts";
import { enemyTargetName } from "./game-rules.ts";

/** Work instructions belong to the worksite; enemy labels use the authored name. */
export function roadEnemyCaption(frame: AdventureFrame, id: string, custom?: string) {
  const target = frame.targets.find((t) => t.id === id);
  return target?.cue || (custom ? target?.name : enemyTargetName(frame.quest)) || "";
}
