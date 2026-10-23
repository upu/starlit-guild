import type { StagePosition, StoryStageCue } from "@/lib/story-stage";
import {
  transferBox,
  stageItemTarget,
  stageItemDepth,
  stageItemVisible,
  type BoxPosition,
} from "@/lib/story-stage-props";
import type { StageItem } from "@/lib/story-stage-cues";
import { stageFigure } from "@/lib/story-stage-figure";
import { orderStageItems, itemFacing } from "@/lib/story-stage-cargo";

type ItemState = {
  position: BoxPosition;
  signature: string;
  settled: boolean;
  tilt: number;
  turn: number;
};
export type ItemMotion = Map<string, ItemState>;
export function itemPainter(stage: HTMLElement, cue: StoryStageCue, state: ItemMotion) {
  const items = orderStageItems(cue.items ?? []).map((item) => ({
    item,
    element: stage.querySelector<HTMLElement>(`[data-item="${item.id}"]`),
    origin: state.get(item.id),
    // Angle changes do not release a grip; only a new owner or destination starts a transfer.
    signature: `${item.actor ?? item.extra ?? item.carrier ?? "ground"}:${String(item.x)}:${String(item.bottom)}`,
  }));
  for (const id of state.keys()) if (!items.some(({ item }) => item.id === id)) state.delete(id);
  stage.querySelectorAll<HTMLElement>("[data-item]").forEach((element) => {
    element.hidden = !items.some(({ item }) => item.id === element.dataset.item);
  });
  return (positions: Map<string, StagePosition>, elapsed: number, reduced: boolean) => {
    for (const { item, element, origin, signature } of items) {
      const target = stageItemTarget(item, cue, positions);
      const transferring = origin && (origin.signature !== signature || !origin.settled);
      const at = transferring
        ? transferBox(origin.position, target, elapsed, reduced, item.travelMs)
        : target;
      const t = reduced ? 1 : Math.min(1, elapsed / 650);
      const { tilt, turn } = itemAngles(item, origin, t);
      const depth = stageItemDepth({ ...item, bottom: at.bottom }, cue, positions);
      positions.set(`item:${item.id}`, {
        ...at,
        depth,
        mirrored: itemFacing(item, at, target, reduced),
      });
      state.set(item.id, {
        position: at,
        signature,
        tilt,
        turn,
        settled: Math.abs(at.x - target.x) + Math.abs(at.bottom - target.bottom) < 0.001,
      });
      if (element) {
        element.hidden = !stageItemVisible(item, positions);
        paintItem(element, item, at, tilt, wristLift(item, positions), turn);
        paintFigure(element, item, at, target, elapsed, reduced);
        element.style.zIndex = String(depth);
      }
    }
  };
}

function itemAngles(item: StageItem, origin: ItemState | undefined, t: number) {
  const fromTilt = origin?.tilt ?? 0,
    fromTurn = origin?.turn ?? 0;
  return {
    tilt: fromTilt + ((item.tilt ?? 0) - fromTilt) * t,
    turn: fromTurn + ((item.turn ?? 0) - fromTurn) * t,
  };
}

function wristLift(item: StageItem, positions: Map<string, StagePosition>) {
  return item.wrist ? (positions.get(item.actor ?? "")?.lift ?? 0) : 0;
}

function paintFigure(
  element: HTMLElement,
  item: StageItem,
  at: BoxPosition,
  target: BoxPosition,
  elapsed: number,
  reduced: boolean,
) {
  const moving =
    !item.carrier && !reduced && Math.hypot(at.x - target.x, at.bottom - target.bottom) > 0.001;
  const figure = stageFigure(item, moving, elapsed);
  element.dataset.figure = String(!!figure);
  if (!figure) {
    element.style.removeProperty("background-position");
    return;
  }
  element.style.width = `${String(figure.width)}%`;
  element.style.bottom = `${String(at.bottom - figure.footPadding)}%`;
  element.style.setProperty("--item-art", `url(/story-stage/prop-${item.art}-poses.webp)`);
  element.style.backgroundPosition = `${String(((figure.frame % 4) * 100) / 3)}% ${String(Math.floor(figure.frame / 4) * 100)}%`;
  element.dataset.frame = String(figure.frame);
  // These two source figures face left. Keep the authored resting direction after arrival.
  if (moving)
    element.style.transform = `translateX(-50%) scaleX(${itemFacing(item, at, target, reduced) ? "-1" : "1"})`;
}

function paintItem(
  element: HTMLElement,
  item: StageItem,
  at: BoxPosition,
  tilt: number,
  lift = 0,
  turn = 0,
) {
  element.style.left = `${String(at.x)}%`;
  element.style.bottom = `${String(at.bottom)}%`;
  element.style.width = `${String(item.width ?? 10)}%`;
  element.style.transform = `translateX(-50%) translateY(${String(lift)}px) rotate(${String(tilt)}deg) scaleX(${item.left ? "-1" : "1"})${turn ? ` rotateY(${String(turn)}deg)` : ""}`;
  element.style.setProperty("--item-art", `url(/story-stage/prop-${item.art}.webp)`);
  element.dataset.art = item.art;
  element.dataset.dissipating = String(!!item.dissipating);
  element.dataset.pouring = String(!!item.pouring);
  element.dataset.steaming = String(!!item.steaming);
  if (item.glow) element.dataset.glow = item.glow;
  else delete element.dataset.glow;
  if (item.glowTone) element.dataset.glowTone = item.glowTone;
  else delete element.dataset.glowTone;
}
