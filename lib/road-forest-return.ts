import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { foundationLayout } from "./road-housecalls-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";

/** Source-pixel positions derived from the return conversation's 0.72 camera. */
export const forestReturnAssets = {
  background: "/storybook-study/forest-floor-v1.png",
  aria: "/storybook-study/aria-forest-sample-v1.webp",
  jar: "/storybook-study/moss-jar-open-v1.webp",
  bowl: "/storybook-study/sample-bowl-v1.webp",
  colony: "/storybook-study/moss-colony-v1.webp",
};
// Phaser's 192px cell is drawn at 1.2 times the requested figure size.
export const FOREST_RETURN_SCALE = 1.536;
export const forestReturnPreload = (look: RoadLook) =>
  look.quest === "forest-wetland" && look.storybookHeroes ? Object.values(forestReturnAssets) : [];
export const forestReturnPoints = {
  aria: [414, 444],
  leon: [691, 444],
  mira: [940, 480],
  finn: [1090, 580],
  lico: [1260, 680],
  jar: [489, 483],
  sample: [541, 461],
  forest: [608, 461],
  colony: [326, 461],
} as const;

export function forestReturnFrame(battle: RoadBattle, view: RoadViewport): RoadBattle {
  const l = foundationLayout(view),
    p = forestReturnPoints;
  const items = [
    // The conversation's 3.5%-wide box is 1.3:1; its taller jar is contained inside it.
    ["forest-jar", forestReturnAssets.jar, p.jar, 24],
    ["forest-sample", forestReturnAssets.bowl, p.sample, 61],
    ["forest-bowl", forestReturnAssets.bowl, p.forest, 61],
    ["forest-colony", forestReturnAssets.colony, p.colony, 61],
  ] as const;
  return {
    ...battle,
    distance: 0,
    gathering: null,
    effects: [],
    enemies: [],
    handheld: [],
    heroes: battle.heroes.map((hero) => ({
      ...hero,
      ...l.world(p[hero.id][0], p[hero.id][1]),
      facing: 1,
      walking: false,
    })),
    waterwayActions: {
      poses: { aria: { asset: forestReturnAssets.aria, frame: 1, rows: 1 } },
      props: items.map(([id, asset, point, width]) =>
        housecallProp(view, id, asset, l.world(point[0], point[1]), width, l.scale),
      ),
      debrisHidden: true,
      closeContact: true,
    },
  };
}
