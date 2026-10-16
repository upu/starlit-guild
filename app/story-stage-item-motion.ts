import type { StagePosition, StoryStageCue } from "@/lib/story-stage";
import { transferBox, stageItemTarget, type BoxPosition } from "@/lib/story-stage-props";
import type { StageItem } from "@/lib/story-stage-cues";

type ItemState = { position: BoxPosition; signature: string; settled: boolean; tilt: number };
export type ItemMotion = Map<string, ItemState>;
export function itemPainter(stage: HTMLElement, cue: StoryStageCue, state: ItemMotion) {
  const items =
    cue.items?.map((item) => ({
      item,
      element: stage.querySelector<HTMLElement>(`[data-item="${item.id}"]`),
      origin: state.get(item.id),
      signature: `${item.actor ?? item.extra ?? "ground"}:${String(item.x)}:${String(item.bottom)}:${String(item.tilt ?? 0)}`,
    })) ?? [];
  for (const id of state.keys()) if (!items.some(({ item }) => item.id === id)) state.delete(id);
  stage.querySelectorAll<HTMLElement>("[data-item]").forEach((element) => {
    element.hidden = !items.some(({ item }) => item.id === element.dataset.item);
  });
  return (positions: Map<string, StagePosition>, elapsed: number, reduced: boolean) => {
    for (const { item, element, origin, signature } of items) {
      const target = stageItemTarget(item, cue, positions);
      const transferring = origin && (origin.signature !== signature || !origin.settled);
      const at = transferring ? transferBox(origin.position, target, elapsed, reduced) : target;
      const t = reduced ? 1 : Math.min(1, elapsed / 650);
      const tilt = (origin?.tilt ?? 0) + ((item.tilt ?? 0) - (origin?.tilt ?? 0)) * t;
      state.set(item.id, {
        position: at,
        signature,
        tilt,
        settled: Math.abs(at.x - target.x) + Math.abs(at.bottom - target.bottom) < 0.001,
      });
      if (element) paintItem(element, item, at, tilt);
    }
  };
}

function paintItem(element: HTMLElement, item: StageItem, at: BoxPosition, tilt: number) {
  element.style.left = `${String(at.x)}%`;
  element.style.bottom = `${String(at.bottom)}%`;
  element.style.width = `${String(item.width ?? 10)}%`;
  element.style.transform = `translateX(-50%) rotate(${String(tilt)}deg)`;
  element.style.setProperty("--item-art", `url(/story-stage/prop-${item.art}.webp)`);
  element.dataset.art = item.art;
}
