import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";

type View = { width: number; height: number; stage: string; figureSize?: number };
type Step = { x: number; lane: number; phase: number; viewport: string };

/** Locomotion advances by world travel, so a paused camera cannot make feet walk. */
export class RoadGait {
  private steps = new Map<string, Step>();

  frame(hero: { id: string; x: number; lane: number }, view: View) {
    const { width, height, stage } = view;
    const viewport = `${String(width)}:${String(height)}:${stage}`;
    const previous = this.steps.get(hero.id);
    let phase = previous?.phase ?? 0;
    if (previous?.viewport === viewport) {
      const distance = Math.hypot(
        (hero.x - previous.x) * roadScale(width, stage),
        (hero.lane - previous.lane) * roadDepth(width, height),
      );
      const size = view.figureSize ?? roadHeroSize(width, height);
      // Discontinuous re-positioning is not a stride. A complete four-pose
      // cycle covers roughly 96 source pixels at the shared character scale.
      if (distance < size * 2) phase = (phase + distance / (size * 0.6)) % 1;
    }
    this.steps.set(hero.id, { x: hero.x, lane: hero.lane, phase, viewport });
    return Math.floor(phase * 4);
  }
}
