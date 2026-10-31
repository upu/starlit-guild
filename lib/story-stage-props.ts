import type { StoryStageCue, StageActor, StageItem } from "./story-stage-cues.ts";
import type { StagePosition } from "./story-stage-travel.ts";

export type BoxPosition = { x: number; bottom: number };
export const boxTransferDuration = 650;

export function stageActorDepth(
  actor: StageActor,
  at: StagePosition,
  cue: StoryStageCue,
  positions: Map<string, StagePosition>,
): number {
  const base = Math.round(100 - (at.bottom ?? 14));
  if (
    Math.abs(at.x - actor.x) + Math.abs((at.bottom ?? 14) - (actor.bottom ?? 14)) >
    (actor.reachApproach ?? 0.001)
  )
    return base;
  const support = actor.reachOver && cue.items?.find((item) => item.id === actor.reachOver);
  return support ? Math.max(base, stageItemDepth(support, cue, positions) + 1) : base;
}

export function stageItemVisible(item: StageItem, positions: Map<string, StagePosition>) {
  if (item.stored) return false;
  if (itemDrawnInPose(item, positions)) return false;
  if (item.wrist && !positions.get(item.actor ?? `extra:${item.extra ?? ""}`)?.wrist) return false;
  const sitter = item.seatFor && positions.get(item.seatFor);
  return (
    !sitter ||
    !sitter.onChair ||
    Math.abs(sitter.x - item.x) > 2 ||
    Math.abs((sitter.bottom ?? 14) - item.bottom) > 4
  );
}

function itemDrawnInPose(item: StageItem, positions: Map<string, StagePosition>) {
  const owner = positions.get(item.actor ?? `extra:${item.extra ?? ""}`);
  return (
    !!owner && owner.atlas === "conversation" && !!item.embeddedFrames?.includes(owner.frame ?? -1)
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
    return carrierTarget(item, positions.get(`item:${item.carrier}`));
  }
  const actor = cue.actors.find((a) => a.id === item.actor);
  const owner = positions.get(item.actor ?? `extra:${item.extra ?? ""}`);
  const wrist = wristTarget(item, cue, owner);
  if (wrist) return wrist;
  const offset = actor
    ? stageItemOffset(item, { ...actor, left: owner?.left ?? actor.left })
    : item.x;
  return {
    x: offset + (owner?.x ?? 0),
    bottom: heldItemBottom(item, cue, owner),
  };
}

function carrierTarget(item: StageItem, parent?: StagePosition) {
  return {
    x: (parent?.x ?? 0) + item.x * (parent?.mirrored ? -1 : 1),
    bottom: (parent?.bottom ?? 0) + item.bottom,
  };
}

function wristTarget(item: StageItem, cue: StoryStageCue, owner?: StagePosition) {
  if (!item.wrist || !owner?.wrist) return null;
  const pixel = (cue.cell ?? 24) / 128;
  // A plate rests above the supporting palm; a hanging bag attaches by its top edge.
  const drop =
    item.wristAnchor === "bottom"
      ? 0
      : item.wristAnchor === "top"
        ? (item.width ?? 2) * 1.5
        : ((item.width ?? 2) / 1.3) * 0.75;
  return {
    x:
      owner.x +
      ((owner.wrist.x - 64) * pixel + (item.wristOffset?.x ?? 0)) * wristDirection(item, owner),
    bottom:
      // The actor element ends at y=128; y=120 is the foot inside that element.
      (owner.bottom ?? 14) +
      (128 - owner.wrist.y) * pixel * 1.5 -
      drop +
      (item.wristOffset?.bottom ?? 0),
  };
}

function wristDirection(item: StageItem, owner: StagePosition) {
  return owner.left && !item.wristUnmirrored ? -1 : 1;
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
    return (
      (parent?.depth ?? Math.round(100 - (parent?.bottom ?? item.bottom))) +
      (item.behindOwner ? -1 : 1)
    );
  }
  const owner = item.actor
    ? (positions.get(item.actor) ?? cue.actors.find((a) => a.id === item.actor))
    : item.extra
      ? (positions.get(`extra:${item.extra}`) ?? cue.extras?.find((e) => e.id === item.extra))
      : undefined;
  if (item.art === "picnic-cloth") return 0;
  const { depth, supported } = supportDepth(item, cue);
  return owner ? Math.max(ownerDepth(item, owner, cue, positions), supported ? depth : 0) : depth;
}

function ownerDepth(
  item: StageItem,
  owner: StagePosition,
  cue: StoryStageCue,
  positions: Map<string, StagePosition>,
) {
  const actor = cue.actors.find((a) => a.id === item.actor);
  const surface = cue.items?.find((i) => i.id === actor?.reachOver);
  // A hand raised over a ground surface carries its held object into that same layer.
  // Owned supports keep their own ordering and cannot recurse through their holder.
  const depth =
    actor && surface && !surface.actor && !surface.extra
      ? stageActorDepth(actor, owner, cue, positions)
      : Math.round(100 - (owner.bottom ?? 14));
  return depth + (item.behindOwner ? -1 : 1);
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
