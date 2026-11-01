import type { RoadLook } from "./road-look.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import {
  housecallsSceneLayout,
  nightBridgeLayout,
  usesHousecallsLayout,
} from "./road-housecalls-layout.ts";
import { fixedFigureScale } from "./road-fixed-figure-scale.ts";
import { partyClearance, partyFootClearance } from "./road-party-spacing.ts";

export function brekkaInitialAvoidance(look: RoadLook, battle: RoadBattle, hero: Traveller) {
  return (
    !!look.brekkaJourney &&
    ((!!look.brekkaJourney.field && battle.enemies.some((enemy) => enemy.hp > 0)) ||
      (hero.id === "mira" && !!battle.journeyCart))
  );
}

export const fixedScene = (look: RoadLook) =>
  [
    look.waterway,
    look.packing,
    look.signpost,
    look.defense,
    look.blockade,
    look.housecalls,
    look.lindeDelivery,
    look.foundingDraft,
    look.lanternRoad,
    look.brekkaLedger,
    look.mossTrail,
    look.mossBeds,
    look.berneCalls,
    look.foundation,
    look.forestReturn?.scene,
    look.waterwaySearchReturn?.scene,
    look.manorDelivery,
    look.stoneSelection,
    look.manorSurvey,
    look.gardenReception,
    look.nightBridge,
    look.restoration,
  ].some(Boolean);
export const fixedBattle = (look: RoadLook) =>
  !!(look.nightBridge || look.mossBeds?.records || look.mossBeds?.seedlings);
function contactGap(battle: RoadBattle, look?: RoadLook) {
  const dialogue = look?.mossBeds?.recordsDialogue;
  const mira = battle.heroes.find((hero) => hero.id === "mira");
  return dialogue?.cue === "support" &&
    dialogue.patient &&
    dialogue.patient !== "mira" &&
    mira &&
    mira.hp > 0 &&
    !mira.paralyzed
    ? 0.68
    : 1;
}

export function formationGap(
  battle: RoadBattle,
  width: number,
  height: number,
  look?: RoadLook,
  feet = false,
) {
  const gap =
    feet || battle.waterwayActions?.closeContact
      ? partyFootClearance(width, height)
      : partyClearance(width, height);
  const scale = look?.nightBridge
    ? nightBridgeLayout({ width, height }, look.nightBridge.section).figureRatio *
      fixedFigureScale(look, { width, height })
    : usesHousecallsLayout(look)
      ? housecallsSceneLayout({ width, height }, look).figureRatio *
        fixedFigureScale(look, { width, height })
      : 1;
  const contact = contactGap(battle, look);
  return { x: gap.x * scale * contact, lane: gap.lane * scale * contact };
}
