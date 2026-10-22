import type { StageItem } from "./story-stage-cues.ts";
import type { BoxPosition } from "./story-stage-props.ts";

/** Sample parents first, so attached cargo follows this frame rather than the previous one. */
export function orderStageItems(items: StageItem[]) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const visited = new Set<string>(),
    ordered: StageItem[] = [];
  function visit(item: StageItem) {
    if (visited.has(item.id)) return;
    visited.add(item.id);
    const parent = item.carrier && byId.get(item.carrier);
    if (parent) visit(parent);
    ordered.push(item);
  }
  items.forEach(visit);
  return ordered;
}

export function itemFacing(
  item: StageItem,
  at: BoxPosition,
  target: BoxPosition,
  reduced: boolean,
) {
  if (item.carrier || reduced || !["golem", "puppet"].includes(item.art)) return !!item.left;
  return Math.abs(target.x - at.x) > 0.001 ? target.x > at.x : !!item.left;
}
