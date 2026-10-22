import type { StoryStageCue, StageActor, StageItem } from "./story-stage-cues.ts";
import type { StagePosition } from "./story-stage-travel.ts";

export type BoxPosition = { x: number; bottom: number };
export const boxTransferDuration = 650;

export function stageItemVisible(item: StageItem, positions: Map<string, StagePosition>) {
  if (item.stored) return false;
  const sitter = item.seatFor && positions.get(item.seatFor);
  return (
    !sitter ||
    !sitter.onChair ||
    Math.abs(sitter.x - item.x) > 2 ||
    Math.abs((sitter.bottom ?? 14) - item.bottom) > 4
  );
}

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
  if (item.carrier) {
    const parent = positions.get(`item:${item.carrier}`);
    return {
      x: (parent?.x ?? 0) + item.x * (parent?.mirrored ? -1 : 1),
      bottom: (parent?.bottom ?? 0) + item.bottom,
    };
  }
  const actor = cue.actors.find((a) => a.id === item.actor);
  const owner = positions.get(item.actor ?? `extra:${item.extra ?? ""}`);
  const offset = actor
    ? stageItemOffset(item, { ...actor, left: owner?.left ?? actor.left })
    : item.x;
  return {
    x: offset + (owner?.x ?? 0),
    bottom: heldItemBottom(item, cue, owner),
  };
}

function heldItemBottom(item: StageItem, cue: StoryStageCue, owner?: StagePosition) {
  if (!owner) return item.bottom;
  const baseline = item.actor ? 14 : (cue.extras?.find((e) => e.id === item.extra)?.bottom ?? 23);
  // Actor cells use width units on a 3:2 ground plane; bottom uses height units.
  const handDrop = ((owner.handDrop ?? 0) / 128) * (cue.cell ?? 24) * 1.5;
  return item.bottom + (owner.bottom ?? baseline) - baseline - handDrop;
}

export function stageItemDepth(
  item: StageItem,
  cue: StoryStageCue,
  positions: Map<string, StagePosition>,
) {
  if (item.carrier) {
    const parent = positions.get(`item:${item.carrier}`);
    return (parent?.depth ?? Math.round(100 - (parent?.bottom ?? item.bottom))) + 1;
  }
  const owner = item.actor
    ? (positions.get(item.actor) ?? cue.actors.find((a) => a.id === item.actor))
    : item.extra
      ? (positions.get(`extra:${item.extra}`) ?? cue.extras?.find((e) => e.id === item.extra))
      : undefined;
  if (item.art === "picnic-cloth") return 0;
  const { depth, supported } = supportDepth(item, cue);
  return owner
    ? Math.max(Math.round(100 - (owner.bottom ?? 14)) + 1, supported ? depth : 0)
    : depth;
}

function supportDepth(item: StageItem, cue: StoryStageCue) {
  // A support chain shares the ground contact of its lowest object.
  let base = item,
    above = 0;
  const seen = new Set([item.id]);
  while (base.support) {
    const next = cue.items?.find((p) => p.id === base.support);
    if (!next || seen.has(next.id)) break;
    seen.add(next.id);
    base = next;
    above += 1;
  }
  const depth = Math.round(100 - base.bottom) + above;
  return { depth, supported: base !== item };
}

export function deliveryBoxTarget(
  mode: StoryStageCue["box"],
  aria: number,
  leon: number,
  ariaBottom = 14,
  leonBottom = 14,
): BoxPosition {
  if (mode === "table") return { x: 42, bottom: 27 };
  if (mode === "shared")
    return { x: (aria + leon) / 2, bottom: (ariaBottom + leonBottom) / 2 + 10 };
  return { x: aria + 7, bottom: ariaBottom + (mode === "high" ? 15 : 10) };
}

// Smooth transfers keep the same small box, including a tap partway through putting it down.
export function transferBox(
  from: BoxPosition,
  to: BoxPosition,
  elapsed: number,
  reduced = false,
  duration = boxTransferDuration,
) {
  const t = reduced ? 1 : Math.min(1, Math.max(0, elapsed) / Math.max(1, duration));
  const progress = t * t * (3 - 2 * t);
  return {
    x: from.x + (to.x - from.x) * progress,
    bottom: from.bottom + (to.bottom - from.bottom) * progress,
  };
}
