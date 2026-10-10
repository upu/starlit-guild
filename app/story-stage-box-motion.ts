import type { StagePosition, StoryStageCue } from "@/lib/story-stage";
import { deliveryBoxTarget, transferBox, type BoxPosition } from "@/lib/story-stage-props";

export type BoxMotion = { position?: BoxPosition; mode?: StoryStageCue["box"]; settled?: boolean };
export function boxPainter(stage: HTMLElement, cue: StoryStageCue, state: BoxMotion) {
  const box = stage.querySelector<HTMLElement>(".story-stage-delivery-box");
  const origin = state.position;
  const transferring = state.mode !== cue.box || !state.settled;
  state.mode = cue.box;
  return (positions: Map<string, StagePosition>, elapsed: number, reduced: boolean) => {
    if (!box || !cue.box) return;
    const target = deliveryBoxTarget(
      cue.box,
      positions.get("aria")?.x ?? 30,
      positions.get("leon")?.x ?? 64,
    );
    const at = origin && transferring ? transferBox(origin, target, elapsed, reduced) : target;
    state.position = at;
    state.settled = Math.abs(at.x - target.x) + Math.abs(at.bottom - target.bottom) < 0.001;
    box.style.left = `${String(at.x)}%`;
    box.style.bottom = `${String(at.bottom)}%`;
  };
}
