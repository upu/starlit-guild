import { stageTravel, type StagePosition, type StoryStageCue } from "@/lib/story-stage";
import type { StageExtra } from "@/lib/story-stage-cues";

export function extraPainter(
  stage: HTMLElement,
  cue: StoryStageCue,
  positions: Map<string, StagePosition>,
) {
  const extras =
    cue.extras?.map((extra) => ({
      extra,
      origin: positions.get(`extra:${extra.id}`) ?? { x: extra.x, bottom: extra.bottom ?? 23 },
      element: stage.querySelector<HTMLElement>(`[data-npc="${extra.id}"]`),
    })) ?? [];
  return (elapsed: number, reduced: boolean) => {
    for (const { extra, origin, element } of extras) {
      const at = stageTravel(origin.x, extra.x, elapsed * 0.6, reduced);
      const left = at.moving ? extra.x < origin.x : !!extra.left;
      positions.set(`extra:${extra.id}`, { x: at.x, bottom: extra.bottom ?? 23, left });
      if (!element) continue;
      element.style.left = `${String(at.x)}%`;
      paintExtraSprite(element, extra, at.moving && !reduced, elapsed, left);
    }
  };
}

function paintExtraSprite(
  element: HTMLElement,
  extra: StageExtra,
  moving: boolean,
  elapsed: number,
  left: boolean,
) {
  const sprite = element.querySelector<HTMLElement>(".story-stage-extra-sprite");
  if (!sprite || extra.id !== "merrill" || !extra.carry) return;
  const frame = moving ? Math.floor(elapsed / 180) % 4 : 1;
  sprite.dataset.frame = String(frame);
  sprite.style.backgroundImage = "url(/story-stage/merrill-walk.webp)";
  sprite.style.backgroundPositionX = `${String((frame * 100) / 3)}%`;
  sprite.style.transform = `scaleX(${left ? "-1" : "1"})`;
}
