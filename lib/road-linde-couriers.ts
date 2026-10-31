import type { Traveller } from "./road-view.ts";
import type { WaterwayPose } from "./road-waterway-contacts.ts";

type CourierArt = {
  walk: string;
  walkRow?: number;
  offer: string;
  offerFrame: number;
  offerRows?: number;
  walkPalm: readonly [number, number];
  offerPalm: readonly [number, number];
};

// Cell coordinates use the common 192px painted-character atlas.
export const lindeCouriers: Partial<Record<Traveller["id"], CourierArt>> = {
  leon: {
    walk: "/storybook-study/leon-paper-walk-v2.webp",
    offer: "/storybook-study/leon-conversation-v1.webp",
    offerFrame: 2,
    walkPalm: [130, 106],
    offerPalm: [150, 106],
  },
  aria: {
    walk: "/storybook-study/aria-paper-walk-v1.webp",
    offer: "/storybook-study/aria-conversation-v1.webp",
    offerFrame: 2,
    walkPalm: [125, 110],
    offerPalm: [143, 108],
  },
  mira: {
    walk: "/storybook-study/mira-paper-walk-v1.webp",
    offer: "/storybook-study/mira-handheld-v1.webp",
    offerFrame: 0,
    offerRows: 2,
    walkPalm: [126, 116],
    offerPalm: [122, 112],
  },
  finn: {
    walk: "/storybook-study/finn-handheld-balanced-v2.webp",
    walkRow: 1,
    offer: "/storybook-study/finn-handheld-balanced-v2.webp",
    offerFrame: 0,
    offerRows: 2,
    walkPalm: [118, 107],
    offerPalm: [118, 107],
  },
};

export const lindeCourierAssets = Object.values(lindeCouriers).flatMap(({ walk, offer }) => [
  walk,
  offer,
]);

export function lindeCourierPose(
  id: Traveller["id"],
  walking: boolean,
  stride: number,
): WaterwayPose | undefined {
  const art = lindeCouriers[id];
  if (!art) return undefined;
  return walking
    ? { asset: art.walk, frame: stride + 4 * (art.walkRow ?? 0), rows: art.walkRow ? 2 : 1 }
    : { asset: art.offer, frame: art.offerFrame, rows: art.offerRows ?? 1 };
}

export function lindeCourier(heroes: Traveller[], previous?: Traveller["id"]) {
  const available = (hero: Traveller) => hero.hp > 0 && !hero.paralyzed && !!lindeCouriers[hero.id];
  return (
    heroes.find((hero) => hero.id === previous && available(hero))?.id ??
    (["leon", "aria", "mira", "finn"].find((id) =>
      heroes.some((hero) => hero.id === id && available(hero)),
    ) as Traveller["id"] | undefined)
  );
}
