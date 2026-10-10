import type { StagePosition, StoryStageCue } from "@/lib/story-stage";
import { transferBox, stageItemOffset, type BoxPosition } from "@/lib/story-stage-props";

type ItemState = { position: BoxPosition; signature: string; settled: boolean };
export type ItemMotion = Map<string, ItemState>;
export function itemPainter(stage: HTMLElement, cue: StoryStageCue, state: ItemMotion) {
  const items =
    cue.items?.map((item) => ({
      item,
      element: stage.querySelector<HTMLElement>(`[data-item="${item.id}"]`),
      origin: state.get(item.id),
      signature: `${item.actor ?? "ground"}:${String(item.x)}:${String(item.bottom)}`,
    })) ?? [];
  for (const id of state.keys()) if (!items.some(({ item }) => item.id === id)) state.delete(id);
  return (positions: Map<string, StagePosition>, elapsed: number, reduced: boolean) => {
    for (const { item, element, origin, signature } of items) {
      const actor = cue.actors.find((a) => a.id === item.actor);
      const x =
        stageItemOffset(item, actor) + (item.actor ? (positions.get(item.actor)?.x ?? 0) : 0);
      const target = { x, bottom: item.bottom };
      const transferring = origin && (origin.signature !== signature || !origin.settled);
      const at = transferring ? transferBox(origin.position, target, elapsed, reduced) : target;
      state.set(item.id, {
        position: at,
        signature,
        settled: Math.abs(at.x - target.x) + Math.abs(at.bottom - target.bottom) < 0.001,
      });
      if (!element) continue;
      element.style.left = `${String(at.x)}%`;
      element.style.bottom = `${String(at.bottom)}%`;
    }
  };
}
