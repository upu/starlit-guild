import type { RoadBattle } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { foundationLayout } from "./road-housecalls-layout.ts";
import { waterwaySearchAssets } from "./road-waterway-search.ts";

/** Ground positions match the 1-7 return conversation's 0.72 camera. */
export const waterwaySearchReturnPoints = {
  aria: [569, 710],
  leon: [845, 710],
  mira: [1080, 610],
  finn: [1200, 700],
  lico: [1310, 800],
} as const;
// Phaser's 192px cell is drawn at 1.2 times the requested figure size.
export const WATERWAY_SEARCH_RETURN_SCALE = 1.536;

export function waterwaySearchReturnFrame(battle: RoadBattle, view: RoadViewport): RoadBattle {
  const layout = foundationLayout(view);
  return {
    ...battle,
    distance: 0,
    enemies: [],
    effects: [],
    gathering: null,
    heroes: battle.heroes.map((hero) => ({
      ...hero,
      ...layout.world(
        waterwaySearchReturnPoints[hero.id][0],
        waterwaySearchReturnPoints[hero.id][1],
      ),
      facing: 1,
      walking: false,
    })),
    waterwayActions: {
      poses: {
        aria: { asset: "/storybook-study/aria-conversation-v1.webp", frame: 1 },
        leon: { asset: waterwaySearchAssets.notes, frame: 1 },
      },
      props: [],
      debrisHidden: true,
      closeContact: true,
    },
  };
}
