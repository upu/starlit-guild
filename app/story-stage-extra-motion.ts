import { type StagePosition, type StoryStageCue } from "@/lib/story-stage";
import type { StageExtra } from "@/lib/story-stage-cues";
import { stageExtraFrame, stageExtraRows } from "@/lib/story-stage-figure";
import { sampleExtraTravel } from "@/lib/story-stage-extra-travel";

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
  stage.querySelectorAll<HTMLElement>("[data-npc]").forEach((element) => {
    element.hidden = !extras.some(({ extra }) => extra.id === element.dataset.npc);
  });
  return (elapsed: number, reduced: boolean) => {
    for (const { extra, origin, element } of extras) {
      const at = sampleExtraTravel(extra, origin, elapsed, reduced);
      const { left } = at;
      positions.set(`extra:${extra.id}`, at);
      if (!element) continue;
      element.style.left = `${String(at.x)}%`;
      element.style.bottom = `${String(at.bottom)}%`;
      element.style.zIndex = String(Math.round(100 - at.bottom));
      element.dataset.speaking = String(!!extra.speaking);
      element.dataset.pose = extra.pose ?? "idle";
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
  if (!sprite) return;
  if (extra.id !== "merrill" || !extra.carry) {
    paintPose(sprite, extra, moving, elapsed, left);
    return;
  }
  const frame = moving ? Math.floor(elapsed / 180) % 4 : 1;
  sprite.dataset.frame = String(frame);
  sprite.style.backgroundImage = "url(/story-stage/merrill-walk.webp)";
  sprite.style.backgroundPositionX = `${String((frame * 100) / 3)}%`;
  sprite.style.transform = `scaleX(${left ? "-1" : "1"})`;
}

function paintPose(
  sprite: HTMLElement,
  extra: StageExtra,
  moving: boolean,
  elapsed: number,
  left: boolean,
) {
  const frame = stageExtraFrame(extra, moving, elapsed);
  sprite.dataset.frame = String(frame);
  sprite.style.backgroundPosition = `${String(((frame % 4) * 100) / 3)}% ${String((Math.floor(frame / 4) * 100) / Math.max(1, stageExtraRows(extra) - 1))}%`;
  if (["masked-pumpety", "worker"].includes(extra.id)) {
    const flip = moving ? !left : !!extra.left;
    sprite.style.transform = `scaleX(${flip ? "-1" : "1"})`;
  }
}
