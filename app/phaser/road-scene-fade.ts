import type Phaser from "phaser";
import type { RoadLook } from "@/lib/road-look";
import type { RoadBattle } from "@/lib/road-view";

function otherFade(look: RoadLook) {
  return (
    look.nightBridge?.fade ??
    look.lindeDelivery?.fade ??
    look.lanternRoad?.fade ??
    (look.brekkaJourney
      ? Math.max(look.brekkaJourney.fade ?? 0, look.brekkaLedger?.fade ?? 0)
      : look.brekkaLedger?.fade) ??
    look.restoration?.fade
  );
}
function sceneFallback(look: RoadLook, battle?: RoadBattle) {
  return otherFade(look) ?? battle?.townTransitionFade;
}

function firstFixedFade(look: RoadLook) {
  return (
    look.waterwaySearchReturn?.fade ??
    look.forestReturn?.fade ??
    look.foundation?.fade ??
    look.manorDelivery?.fade
  );
}

export function paintRoadSceneFade(
  graphics: Phaser.GameObjects.Graphics,
  look: RoadLook,
  width: number,
  height: number,
  battle?: RoadBattle,
) {
  graphics.clear();
  const fade =
    firstFixedFade(look) ??
    look.stoneSelection?.fade ??
    look.manorSurvey?.fade ??
    look.gardenReception?.fade ??
    look.mossTrail?.fade ??
    look.foundingDraft?.fade ??
    sceneFallback(look, battle);
  if (fade) graphics.fillStyle(0x0c1914, fade).fillRect(0, 0, width, height);
}
