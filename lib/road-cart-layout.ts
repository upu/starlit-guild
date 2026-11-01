import { roadDepth, roadHeroSize, roadScale } from "./road-layout.ts";
import { RPG_CAMERA_SCALE } from "./rpg-camera.ts";

export type RoadViewport = { width: number; height: number };
export const roadCartWidth = (width: number) => RPG_CAMERA_SCALE * Math.min(145, width * 0.3);
// Departure: cart width 25, figure cell 19, with a 144px body in a 192px cell.
// Use that same physical ratio on both wide and portrait adventure canvases.
export const seedlingCartWidth = (view: RoadViewport) =>
  roadHeroSize(view.width, view.height) * 0.9 * (100 / 57);

// Measured anchors in the delivered cart and 192px hero frames. Use the painted
// sizes on both sides, rather than the simulation's movement spacing.
export function roadCartSlot(
  view: RoadViewport,
  stage: string,
  seedlings: boolean,
  pulling: boolean,
  painted = false,
  hero = "leon",
  cartWidth?: number,
) {
  if (painted) return paintedCartSlot(view, stage, pulling, seedlings, hero, cartWidth);
  const cart = roadCartWidth(view.width);
  const figure = (roadHeroSize(view.width, view.height) * 0.9) / 96;
  const handX = pulling ? -32 : 30;
  const handY = pulling ? -41 : -48;
  const gripX = pulling ? 0.46 : -0.46;
  const gripY = pulling ? (seedlings ? -0.3 : -0.33) : seedlings ? -0.27 : -0.22;
  return {
    offset: (cart * gripX - handX * figure) / roadScale(view.width, stage),
    lane: 0.82 + (cart * gripY - handY * figure) / roadDepth(view.width, view.height),
  };
}

function paintedCartSlot(
  view: RoadViewport,
  stage: string,
  pulling: boolean,
  seedlings: boolean,
  hero: string,
  cartWidth?: number,
) {
  const cart = cartWidth ?? (seedlings ? seedlingCartWidth(view) : roadCartWidth(view.width));
  const figure = (roadHeroSize(view.width, view.height) * 0.9) / 144;
  // Registered to the complete 420x280 cart canvas, with its shafts facing right.
  const hand = pulling
    ? hero === "finn"
      ? { x: -47, y: -65 }
      : { x: -54, y: -66 }
    : { x: 47, y: -77 };
  const grip = seedlings
    ? pulling
      ? { x: 0.4, y: 0.012 }
      : { x: -0.47, y: -0.292 }
    : pulling
      ? { x: 0.44, y: -0.095 }
      : { x: -0.47, y: -0.35 };
  return {
    offset: (cart * grip.x - hand.x * figure) / roadScale(view.width, stage),
    lane: 0.82 + (cart * grip.y - hand.y * figure) / roadDepth(view.width, view.height),
  };
}
