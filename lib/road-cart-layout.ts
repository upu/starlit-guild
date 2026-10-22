import { roadHeroSize, roadScale } from "./road-layout.ts";
import { RPG_CAMERA_SCALE } from "./rpg-camera.ts";

export type RoadViewport = { width: number; height: number };
export const roadCartWidth = (width: number) => RPG_CAMERA_SCALE * Math.min(145, width * 0.3);

// Measured anchors in the delivered cart and 192px hero frames. Use the painted
// sizes on both sides, rather than the simulation's movement spacing.
export function roadCartSlot(
  view: RoadViewport,
  stage: string,
  seedlings: boolean,
  pulling: boolean,
) {
  const cart = roadCartWidth(view.width);
  const figure = (roadHeroSize(view.width, view.height) * 0.9) / 96;
  const handX = pulling ? -32 : 30;
  const handY = pulling ? -41 : -48;
  const gripX = pulling ? 0.46 : -0.46;
  const gripY = pulling ? (seedlings ? -0.3 : -0.33) : seedlings ? -0.27 : -0.22;
  return {
    offset: (cart * gripX - handX * figure) / roadScale(view.width, stage),
    lane:
      0.82 +
      (cart * gripY - handY * figure) / (Math.min(240, view.height * 0.65) * RPG_CAMERA_SCALE),
  };
}
