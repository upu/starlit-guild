import type { RoadLook } from "./road-look.ts";
import { roadHeroSize, roadScale, roadX, roadY } from "./road-layout.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadBattle } from "./road-view.ts";
export const berneJourneyAssets = {
  road: "/storybook-study/berne-road-loop-v1.png",
  gate: "/storybook-study/berne-gate-v1.webp",
  finn: "/storybook-study/finn-handheld-balanced-v2.webp",
  parcel: "/storybook-study/medicine-packet-v1.webp",
};
export const berneHandheld = (look?: RoadLook) =>
  !!look?.storybookHeroes && look.quest === "berne-road";
export const berneGroundY = (y: number, height: number) => Math.min(0, y + height * 0.12);
/** Give the healer a rear horizontal slot instead of pushing her into the verge. */
export function arrangeBerneParty(battle: RoadBattle, look: RoadLook) {
  if (!berneHandheld(look)) return;
  const healer = battle.heroes.find((h) => h.id === "mira");
  if (healer) {
    const companions = battle.heroes.filter((h) => h.id === "aria" || h.id === "leon");
    if (companions.length) healer.x = Math.min(...companions.map((h) => h.x)) - 110;
    healer.lane = 0.74;
  }
}
/** A landmark appears once in world space; it is never part of the repeating road. */
export function berneGateLayout(view: RoadViewport, camera: number, length: number, stage: string) {
  const size = roadHeroSize(view.width, view.height) * 5.2;
  const x = roadX(length + 145, camera, view.width, stage);
  return {
    x,
    y: roadY(0.54, view.height, view.width),
    width: size,
    visible: x - size / 2 < view.width + 4 && x + size / 2 > -4,
    world: length + 145,
    scale: roadScale(view.width, stage),
  };
}
