import type { StoryStageCue, StageActor, StageItem } from "./story-stage-cues.ts";
import type { StagePosition } from "./story-stage-travel.ts";

export type BoxPosition = { x: number; bottom: number };
export const boxTransferDuration = 650;

export function stageItemOffset(item: StageItem, actor?: StageActor) {
  if (!actor) return item.x;
  const reversed = actor.left !== (actor.id === "leon");
  return reversed ? -item.x : item.x;
}

export function stageItemTarget(
  item: StageItem,
  cue: StoryStageCue,
  positions: Map<string, StagePosition>,
) {
  const actor = cue.actors.find((a) => a.id === item.actor);
  const owner = positions.get(item.actor ?? `extra:${item.extra ?? ""}`);
  const offset = actor
    ? stageItemOffset(item, { ...actor, left: owner?.left ?? actor.left })
    : item.x;
  const baseline = item.actor ? 14 : (cue.extras?.find((e) => e.id === item.extra)?.bottom ?? 23);
  return {
    x: offset + (owner?.x ?? 0),
    bottom: item.bottom + (owner ? (owner.bottom ?? baseline) - baseline : 0),
  };
}

export function deliveryBoxTarget(
  mode: StoryStageCue["box"],
  aria: number,
  leon: number,
): BoxPosition {
  if (mode === "table") return { x: 46, bottom: 27 };
  if (mode === "shared") return { x: (aria + leon) / 2, bottom: 24 };
  return { x: aria + 7, bottom: mode === "high" ? 29 : 24 };
}

// Smooth transfers keep the same small box, including a tap partway through putting it down.
export function transferBox(from: BoxPosition, to: BoxPosition, elapsed: number, reduced = false) {
  const t = reduced ? 1 : Math.min(1, Math.max(0, elapsed) / boxTransferDuration);
  const progress = t * t * (3 - 2 * t);
  return {
    x: from.x + (to.x - from.x) * progress,
    bottom: from.bottom + (to.bottom - from.bottom) * progress,
  };
}
