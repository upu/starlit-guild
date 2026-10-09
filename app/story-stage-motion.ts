import { useEffect, useRef } from "react";
import {
  sampleStageActor,
  stageLuggage,
  stageEntrance,
  stageTravel,
  type StagePosition,
  type StageSample,
  type StoryStageCue,
} from "@/lib/story-stage";

function paintActor(element: HTMLElement, sample: StageSample) {
  element.style.left = `${String(sample.x)}%`;
  element.style.visibility = sample.visible ? "visible" : "hidden";
  const sprite = element.querySelector<HTMLElement>(".story-stage-sprite");
  if (sprite) {
    sprite.dataset.atlas = sample.atlas;
    const rows = sample.atlas === "adventure" ? 6 : sample.atlas === "conversation" ? 2 : 4;
    sprite.style.backgroundPosition = `${String(((sample.frame % 4) / 3) * 100)}% ${String((Math.floor(sample.frame / 4) / (rows - 1)) * 100)}%`;
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
  onComplete: () => void,
) {
  const actors = cue.actors.map((actor) => ({
    actor,
    origin: positions.get(actor.id) ?? stageEntrance(actor.id),
    element: stage.querySelector<HTMLElement>(`[data-actor="${actor.id}"]`),
  }));
  const cart = stage.querySelector<HTMLElement>(".story-stage-cart");
  const cartOrigin = positions.get("cart")?.x ?? 64;
  const endAt = Math.max(
    3000,
    ...actors.map(({ actor, origin }) => Math.abs(actor.x - origin.x) * 34),
  );
  const paint = (elapsed: number, reduced: boolean) => {
    const travel = stageTravel(cartOrigin, cue.cartX ?? 64, elapsed, reduced);
    positions.set("cart", travel);
    if (cart) cart.style.left = `${String(travel.x)}%`;
    for (const { actor, origin, element } of actors) {
      const sample = sampleStageActor(actor, origin, elapsed, reduced);
      positions.set(actor.id, sample);
      if (element) paintActor(element, sample);
      if (actor.id === "aria") stage.dataset.luggage = stageLuggage(cue, sample);
    }
  };
  return animateFrames(paint, endAt, onComplete);
}

function animateFrames(
  paint: (elapsed: number, reduced: boolean) => void,
  endAt: number,
  onComplete: () => void,
) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let elapsed = 0,
    previous = 0,
    frame = 0;
  let completed = false;
  const complete = () => {
    if (elapsed < endAt || completed) return;
    completed = true;
    onComplete();
  };
  const tick = (time: number) => {
    elapsed += previous ? Math.min(64, time - previous) : 0;
    previous = time;
    paint(elapsed, reduced.matches);
    if (elapsed < endAt && !reduced.matches) frame = requestAnimationFrame(tick);
    else complete();
  };
  const resume = () => {
    cancelAnimationFrame(frame);
    previous = 0;
    // Finish at a stable pose when motion is reduced, including live preference changes.
    if (reduced.matches) elapsed = endAt;
    paint(elapsed, reduced.matches);
    if (!document.hidden && !reduced.matches && elapsed < endAt)
      frame = requestAnimationFrame(tick);
    if (!document.hidden) complete();
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

export function useStoryStageMotion(cue: StoryStageCue, onComplete?: () => void) {
  const stage = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, StagePosition>());
  const completion = useRef(onComplete);
  useEffect(() => {
    completion.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    if (stage.current)
      return animateStage(stage.current, cue, positions.current, () => {
        completion.current?.();
      });
  }, [cue]);
  return stage;
}
