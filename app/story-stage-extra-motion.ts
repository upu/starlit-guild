import { type StagePosition, type StoryStageCue } from "@/lib/story-stage";
import type { StageExtra } from "@/lib/story-stage-cues";
import { stageExtraFrame, stageExtraRows } from "@/lib/story-stage-figure";
import { sampleExtraTravel } from "@/lib/story-stage-extra-travel";
import { stageExtraWrist } from "@/lib/story-stage-extra-wrists";
import { stageItemDepth } from "@/lib/story-stage-props";

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
      hand: stage.querySelector<HTMLElement>(`[data-npc-hand="${extra.id}"]`),
    })) ?? [];
  stage.querySelectorAll<HTMLElement>("[data-npc]").forEach((element) => {
    element.hidden = !extras.some(({ extra }) => extra.id === element.dataset.npc);
  });
  stage.querySelectorAll<HTMLElement>("[data-npc-hand]").forEach((element) => {
    element.hidden = true;
  });
  return (elapsed: number, reduced: boolean) => {
    for (const { extra, origin, element, hand } of extras) {
      const at = sampleExtraTravel(extra, origin, elapsed, reduced);
      const { left } = at;
      positions.set(`extra:${extra.id}`, {
        ...at,
        atlas: "conversation",
        frame: stageExtraFrame(extra, at.moving && !reduced, elapsed),
        wrist: stageExtraWrist(extra, at.moving && !reduced, elapsed),
      });
      if (!element) continue;
      element.style.left = `${String(at.x)}%`;
      element.style.bottom = `${String(at.bottom)}%`;
      element.style.zIndex = String(Math.round(100 - at.bottom));
      element.dataset.speaking = String(!!extra.speaking);
      element.dataset.moving = String(at.moving && !reduced);
      element.dataset.carry = String(!!extra.carry);
      element.dataset.pose = extra.pose ?? "idle";
      paintExtraSprite(element, extra, at.moving && !reduced, elapsed, left);
      if (hand) paintHand(hand, element, extra, cue, positions, at.moving && !reduced, elapsed);
    }
  };
}

function paintHand(
  hand: HTMLElement,
  body: HTMLElement,
  extra: StageExtra,
  cue: StoryStageCue,
  positions: Map<string, StagePosition>,
  moving: boolean,
  elapsed: number,
) {
  const support = extra.handOver && cue.items?.find((item) => item.id === extra.handOver?.item);
  const deliveryTable = extra.handOver?.item === "delivery-table" && !!cue.merchant;
  hand.hidden = (!support && !deliveryTable) || moving;
  if ((!support && !deliveryTable) || !extra.handOver) return;
  const [x, y, width, height] = extra.handOver.rect;
  hand.style.left = body.style.left;
  hand.style.bottom = body.style.bottom;
  hand.style.zIndex = String(support ? stageItemDepth(support, cue, positions) + 1 : 2);
  const inset = [y, 128 - x - width, 128 - y - height, x]
    .map((value) => `${String(value / 1.28)}%`)
    .join(" ");
  hand.style.clipPath = `inset(${inset})`;
  paintExtraSprite(hand, extra, false, elapsed, !!extra.left);
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
  if (
    extra.walkFrames ||
    extra.id !== "merrill" ||
    !extra.carry ||
    (!moving && extra.seedlingAction)
  ) {
    paintPose(sprite, extra, moving, elapsed, left);
    return;
  }
  const frame = moving ? Math.floor(elapsed / 180) % 4 : 1;
  sprite.dataset.frame = String(frame);
  sprite.style.backgroundImage = "url(/story-stage/merrill-walk.webp)";
  sprite.style.backgroundSize = "400% 100%";
  sprite.style.backgroundPositionY = "0%";
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
  if (extra.id === "merrill") {
    sprite.style.backgroundImage = "url(/story-stage/merrill-poses.webp)";
    sprite.style.backgroundSize = "400% 300%";
  }
  sprite.dataset.frame = String(frame);
  sprite.style.backgroundPosition = `${String(((frame % 4) * 100) / 3)}% ${String((Math.floor(frame / 4) * 100) / Math.max(1, stageExtraRows(extra) - 1))}%`;
  paintFacing(sprite, extra, moving, left);
}

function paintFacing(sprite: HTMLElement, extra: StageExtra, moving: boolean, left: boolean) {
  if (fixedOpeningFacing(extra, moving) || fixedLanternFacing(extra, moving)) {
    sprite.style.transform = "scaleX(1)";
    return;
  }
  if (extra.chair && (extra.id === "keeper" || extra.id === "merchant")) {
    sprite.style.transform = `scaleX(${left ? "1" : "-1"})`;
    return;
  }
  if (usesLeftFacingPose(extra, moving)) {
    const flip = moving ? !left : !!extra.left;
    sprite.style.transform = `scaleX(${flip ? "-1" : "1"})`;
    return;
  }
  paintRightFacing(sprite, extra, moving, left);
}

function fixedOpeningFacing(extra: StageExtra, moving: boolean) {
  return extra.hatchOpening && (!moving || extra.hatchOpening !== "idle");
}

function fixedLanternFacing(extra: StageExtra, moving: boolean) {
  return extra.lanternHandling && (!moving || extra.lanternHandling !== "hold");
}

function usesLeftFacingPose(extra: StageExtra, moving: boolean) {
  return (
    ["masked-pumpety", "worker", "stone-carrier", "fence-carrier"].includes(extra.id) ||
    (extra.id === "keeper" &&
      (moving || extra.restoration || extra.basketHandoff || extra.hatchMark))
  );
}

function paintRightFacing(sprite: HTMLElement, extra: StageExtra, moving: boolean, left: boolean) {
  const transform = `scaleX(${left ? "-1" : "1"})`;
  if (extra.id === "parent" || extra.id === "merrill") sprite.style.transform = transform;
  if (["cook", "merchant"].includes(extra.id)) sprite.style.transform = moving ? transform : "";
}
