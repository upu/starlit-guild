import type { RoadLook } from "./road-look.ts";
import type { RoadBattle, Traveller } from "./road-view.ts";
import type { HandheldItem } from "./road-handheld.ts";

export const picnicHandheld = (look?: RoadLook) =>
  !!look?.storybookHeroes && look.quest === "hilltop-picnic";

/** A spawned opponent farther down the road is not yet beside the lunch. */
export function picnicEncounterNear(battle: RoadBattle, drawn: Map<string, Traveller>) {
  return battle.enemies.some(
    (enemy) =>
      enemy.hp > 0 &&
      battle.heroes.some((hero) => {
        const foot = drawn.get(hero.id) ?? hero;
        return hero.hp > 0 && Math.abs(enemy.x - foot.x) <= 170;
      }),
  );
}

export function picnicEffects(battle: RoadBattle, items: HandheldItem[]) {
  return battle.effects.filter(
    (effect) =>
      !["arrow", "slash", "magic"].includes(effect.kind) ||
      !items.some((i) => i.hero === effect.hero && (i.phase !== "ground" || i.returning)),
  );
}
export const picnicAssets = {
  bag: "/storybook-study/visiting-satchel-v1.webp",
  bread: "/storybook-study/lunch-cake-parcel-v1.webp",
  carry: "/storybook-study/leon-carry-v1.webp",
  walk: "/storybook-study/leon-carry-walk-v1.webp",
  lower: "/storybook-study/leon-work-v1.webp",
};
// Same palms and figure scale as the accepted 2-3 two-handed carrying poses.
export const picnicLeonPalms = [
  [134, 105],
  [144, 172],
  [134, 117],
  [134, 105],
  [126, 105],
  [135, 107],
  [124, 105],
  [129, 106],
];
export function picnicLeonPose(frame: number) {
  if (frame >= 4) return { asset: picnicAssets.walk, frame: frame - 4, cell: 256 };
  if (frame === 1 || frame === 2)
    return { asset: picnicAssets.lower, frame: frame === 1 ? 3 : 2, cell: 192 };
  return { asset: picnicAssets.carry, frame: 0, cell: 192 };
}
