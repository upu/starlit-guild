import type { RoadViewport } from "./road-cart-layout.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadBattle, TravellerId } from "./road-view.ts";
import { roadHeroSize, roadScale } from "./road-layout.ts";

/** A quiet final group portrait in front of the visiting homes. */
export function brekkaArrival(frame: { battle: RoadBattle; look: RoadLook }, view: RoadViewport) {
  const scale = roadScale(view.width, frame.battle.stage);
  const size = roadHeroSize(view.width, view.height);
  const cartX = (view.width * 0.15) / scale;
  const offsets: Record<TravellerId, number> = {
    aria: -1.05,
    leon: 1.05,
    mira: -1.9,
    finn: 1.9,
    lico: 2.7,
  };
  return {
    battle: {
      ...frame.battle,
      distance: 0,
      phase: "arrived" as const,
      gathering: null,
      enemies: [],
      effects: [],
      heroes: frame.battle.heroes.map((hero) => ({
        ...hero,
        x: cartX + (offsets[hero.id] * size) / scale,
        lane: 0.82,
        walking: false,
      })),
      journeyCart: {
        asset: "/storybook-study/brekka-medical-cart-v1.webp",
        x: cartX,
        lane: 0.82,
        phase: "parked" as const,
        returning: false,
      },
    },
    look: { ...frame.look, workers: [], frontCarriers: [], puller: null },
  };
}
