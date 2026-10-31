import type { RoadBattle, Traveller } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { waterwayLayout } from "./road-waterway-layout.ts";
import { waterwayAt } from "./road-waterway-contacts.ts";

export const waterwaySearchAssets = {
  bank: "/storybook-study/drain-search-bank-v1.png",
  notes: "/storybook-study/leon-route-notes-v1.webp",
  walk: "/storybook-study/leon-paper-walk-v2.webp",
  inspect: "/storybook-study/aria-forage-v1.webp",
  returnBank: "/storybook-study/drain-blocked-v1.png",
};
export function waterwaySearchFeet(node: number) {
  const site = node < 5 ? [700, 690] : node < 10 ? [880, 620] : [1050, 510];
  return [site[0] - 65, site[1] + 70, site[0] + 85, site[1] + 65];
}
/** The two searchers inspect the bank; no keeper, work crew, cart or harvesting appears. */
export function finishWaterwaySearch(
  battle: RoadBattle,
  look: RoadLook,
  view: RoadViewport,
  stride: number,
  reduced: boolean,
) {
  const scene = battle.waterwayActions;
  if (!scene || battle.enemies.some((e) => e.hp > 0)) return;
  for (const hero of battle.heroes) {
    const pose = searchPose(hero, battle, look, view, stride, reduced);
    if (pose) scene.poses[hero.id] = pose;
  }
}
function searchPose(
  hero: Traveller,
  battle: RoadBattle,
  look: RoadLook,
  view: RoadViewport,
  stride: number,
  reduced: boolean,
) {
  const feet = waterwaySearchFeet(look.waterway?.node ?? 0),
    layout = waterwayLayout(view.width, view.height);
  const index = hero.id === "aria" ? 0 : 2,
    arrived = waterwayAt(hero, layout.world(feet[index], feet[index + 1]), view);
  const working = arrived && look.workers.includes(hero.id) && !hero.walking;
  if (hero.id === "leon")
    return searchLeonPose(hero.walking, working, stride, reduced ? 0 : battle.time);
  if (hero.id === "aria" && working) return { asset: waterwaySearchAssets.inspect, frame: 1 };
}
function searchLeonPose(walking: boolean, working: boolean, stride: number, time: number) {
  if (walking) return { asset: waterwaySearchAssets.walk, frame: stride };
  return {
    asset: waterwaySearchAssets.notes,
    frame: working ? 1 + (Math.floor(time / 650) % 3) : 0,
  };
}
