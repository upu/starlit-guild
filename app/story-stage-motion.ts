import { useEffect, useRef } from "react";
import { boxPainter, type BoxMotion } from "./story-stage-box-motion";
import { itemPainter, type ItemMotion } from "./story-stage-item-motion";
import { extraPainter } from "./story-stage-extra-motion";
import { journeyDuration } from "@/lib/story-stage-travel";
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
  element.style.bottom = `${String(sample.bottom ?? 14)}%`;
  element.style.zIndex = String(Math.round(100 - (sample.bottom ?? 14)));
  element.style.visibility = sample.visible ? "visible" : "hidden";
  const name = element.querySelector<HTMLElement>(".story-stage-name");
  if (name)
    name.style.top =
      (sample.onChair || (sample.atlas === "conversation" && sample.frame >= 36)) &&
      (sample.bottom ?? 14) >= 20
        ? sample.frame >= 36
          ? "26%"
          : "8%"
        : "100%";
  const sprite = element.querySelector<HTMLElement>(".story-stage-sprite");
  if (sprite) paintSprite(sprite, sample);
  const bubble = element.querySelector<HTMLElement>(".story-stage-reaction");
  if (bubble) {
    bubble.textContent = sample.bubble;
    bubble.hidden = !sample.bubble;
  }
}

function paintSprite(sprite: HTMLElement, sample: StageSample) {
  sprite.dataset.atlas = sample.atlas;
  sprite.dataset.frame = String(sample.frame);
  const rows = { adventure: 6, conversation: 11, home: 4, shawl: 1 }[sample.atlas];
  sprite.style.backgroundPosition = `${String(((sample.frame % 4) / 3) * 100)}% ${String(rows === 1 ? 0 : (Math.floor(sample.frame / 4) / (rows - 1)) * 100)}%`;
  const authoredFacing =
    sample.atlas === "conversation" &&
    ((sample.frame >= 24 && sample.frame < 32) || sample.frame >= 36);
  sprite.style.transform = `translateY(${String(sample.lift)}px) scaleX(${sample.left && !authoredFacing ? "-1" : "1"})`;
}

function stagePainter(
  stage: HTMLElement,
  cue: StoryStageCue,
  positions: Map<string, StagePosition>,
  boxMotion: BoxMotion,
  itemMotion: ItemMotion,
) {
  const actors = cue.actors.map((actor) => ({
    actor,
    origin: positions.get(actor.id) ?? stageEntrance(actor.id, cue),
    element: stage.querySelector<HTMLElement>(`[data-actor="${actor.id}"]`),
  }));
  const cart = stage.querySelector<HTMLElement>(".story-stage-cart");
  const cartOrigin = positions.get("cart")?.x ?? 64;
  const paintBox = boxPainter(stage, cue, boxMotion);
  const paintItems = itemPainter(stage, cue, itemMotion);
  const paintExtras = extraPainter(stage, cue, positions);
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
    paintBox(positions, elapsed, reduced);
    paintExtras(elapsed, reduced);
    paintItems(positions, elapsed, reduced);
  };
  return paint;
}

function animateStage(
  stage: HTMLElement,
  cue: StoryStageCue,
  positions: Map<string, StagePosition>,
  boxMotion: BoxMotion,
  itemMotion: ItemMotion,
  onComplete: () => void,
) {
  const moments = [
    { after: 0, actors: cue.actors, items: cue.items ?? [] },
    ...(cue.sequence ?? []),
  ];
  const last = moments[moments.length - 1];
  const previousActors = moments.at(-2)?.actors ?? cue.actors;
  const endAt = Math.max(
    3000,
    ...cue.actors.map((a) => journeyDuration(a, positions.get(a.id) ?? stageEntrance(a.id, cue))),
    last.after +
      Math.max(
        3000,
        ...last.actors.map((a) =>
          journeyDuration(a, previousActors.find((p) => p.id === a.id) ?? a),
        ),
      ),
  );
  let phase = -1,
    paint: ReturnType<typeof stagePainter>;
  return animateFrames(
    (elapsed, reduced) => {
      const index = moments.findLastIndex((m) => m.after <= elapsed);
      const moment = moments[index];
      if (index !== phase) {
        phase = index;
        paint = stagePainter(stage, { ...cue, ...moment }, positions, boxMotion, itemMotion);
      }
      paint(elapsed - moment.after, reduced);
    },
    endAt,
    onComplete,
  );
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
  const boxMotion = useRef<BoxMotion>({});
  const itemMotion = useRef<ItemMotion>(new Map());
  const completion = useRef(onComplete);
  useEffect(() => {
    completion.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    if (cue.cut) {
      positions.current.clear();
      itemMotion.current.clear();
      boxMotion.current = {};
    }
    if (stage.current)
      return animateStage(
        stage.current,
        cue,
        positions.current,
        boxMotion.current,
        itemMotion.current,
        () => {
          completion.current?.();
        },
      );
  }, [cue]);
  return stage;
}
