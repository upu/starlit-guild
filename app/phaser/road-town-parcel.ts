import type Phaser from "phaser";
import type { RoadViewport } from "@/lib/road-cart-layout";
import type { RoadBattle, Traveller } from "@/lib/road-view";
import type { RoadLook } from "@/lib/road-look";
import {
  townParcelAsset,
  townParcelCarry,
  townParcelCheck,
  townParcelFigure,
  townParcelSupported,
  townParcelWidth,
} from "@/lib/road-town-parcel";
import { applyHeroPose } from "./road-poses";
import { applyStorybookFrame } from "./road-storybook-poses";
import { roadWorkAppearance } from "./road-work-appearance";

export function paintTownParcelHero(
  image: Phaser.GameObjects.Image,
  state: RoadBattle,
  hero: Traveller,
  reduced: boolean,
  size: number,
  stride: number,
  look?: RoadLook,
) {
  if (!townParcelCarry(state, look) || (hero.id !== "aria" && hero.id !== "leon")) return false;
  if (!townParcelSupported(state, look)) {
    applyHeroPose(
      image,
      hero.id,
      hero.walking && !reduced ? `walk-${String(stride % 4)}` : "8",
      size,
      true,
      stride,
    );
    return true;
  }
  const { key, frame } = townParcelPose(hero, state, reduced, stride);
  applyStorybookFrame(image, key, frame, size);
  return true;
}

function townParcelPose(hero: Traveller, state: RoadBattle, reduced: boolean, stride: number) {
  const walking = hero.walking && !reduced;
  const lifting = (state.townParcelLift ?? 0) < 0.75;
  const key =
    walking && !lifting
      ? `/storybook-study/${hero.id}-paper-walk-${hero.id === "aria" ? "v1" : "v2"}.webp`
      : `/storybook-study/${hero.id}-carry-v1.webp`;
  return { key, frame: lifting ? 3 : walking ? stride % 4 : 0 };
}

export function townParcelAppearance(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
  if (!townParcelCarry(battle, look) && !townParcelCheck(battle, look)) return undefined;
  const supported = townParcelSupported(battle, look);
  return {
    size: townParcelWidth(view),
    asset: townParcelAsset,
    frame: "__BASE",
    offset:
      (battle.townParcelLift ?? 0) * (battle.townParcelLiftHeight ?? 45) * townParcelFigure(view),
    depth:
      supported || battle.townSoloCarrier
        ? 10 + Math.max(...battle.heroes.map((h) => h.lane)) * 10 + 0.02
        : undefined,
  };
}

export function roadGatheringAppearance(
  battle: RoadBattle,
  look: RoadLook,
  view: RoadViewport,
  cargo: boolean,
) {
  return (
    townParcelAppearance(battle, look, view) ?? {
      ...roadWorkAppearance(look, view, cargo, !!battle.journeyCart && cargo, battle.journeyCart),
      offset: 0,
      depth: undefined,
    }
  );
}
