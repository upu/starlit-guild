import { useEffect, useRef } from "react";
import {
  sampleStageActor,
  stageEntrance,
  type StagePosition,
  type StageSample,
  type StoryStageCue,
} from "@/lib/story-stage";

function paintActor(element: HTMLElement, sample: StageSample) {
  element.style.left = `${String(sample.x)}%`;
  const sprite = element.querySelector<HTMLElement>(".story-stage-sprite");
  if (sprite) {
    sprite.style.backgroundPosition = `${String(((sample.frame % 4) / 3) * 100)}% ${String((Math.floor(sample.frame / 4) / 3) * 100)}%`;
    sprite.style.transform = `translateY(${String(sample.lift)}px) scaleX(${sample.left ? "-1" : "1"})`;
  }
  const bubble = element.querySelector<HTMLElement>(".story-stage-reaction");
  if (bubble) {
    bubble.textContent = sample.bubble;
    bubble.hidden = !sample.bubble;
  }
}

function animateStage(
  stage: HTMLElement,
  cue: StoryStageCue,
  positions: Map<string, StagePosition>,
) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const actors = cue.actors.map((actor) => ({
    actor,
    origin: positions.get(actor.id) ?? stageEntrance(actor.id),
    element: stage.querySelector<HTMLElement>(`[data-actor="${actor.id}"]`),
  }));
  let elapsed = 0,
    previous = 0,
    frame = 0;
  const paint = () => {
    for (const { actor, origin, element } of actors) {
      const sample = sampleStageActor(actor, origin, elapsed, reduced.matches);
      positions.set(actor.id, sample);
      if (element) paintActor(element, sample);
    }
  };
  const tick = (time: number) => {
    elapsed += previous ? Math.min(64, time - previous) : 0;
    previous = time;
    paint();
    if (elapsed < 3000 && !reduced.matches) frame = requestAnimationFrame(tick);
  };
  const resume = () => {
    cancelAnimationFrame(frame);
    previous = 0;
    // Finish at a stable pose when motion is reduced, including live preference changes.
    if (reduced.matches) elapsed = 3000;
    paint();
    if (!document.hidden && !reduced.matches && elapsed < 3000) frame = requestAnimationFrame(tick);
  };
  document.addEventListener("visibilitychange", resume);
  reduced.addEventListener("change", resume);
  resume();
  return () => {
    cancelAnimationFrame(frame);
    document.removeEventListener("visibilitychange", resume);
    reduced.removeEventListener("change", resume);
  };
}

export function useStoryStageMotion(cue: StoryStageCue) {
  const stage = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, StagePosition>());
  useEffect(() => {
    if (stage.current) return animateStage(stage.current, cue, positions.current);
  }, [cue]);
  return stage;
}
