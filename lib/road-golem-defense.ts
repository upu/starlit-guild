import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { fixedRoadLayout } from "./road-fixed-layout.ts";
import { projectFixedEffects } from "./road-fixed-effects.ts";
import { roadHeroSize } from "./road-layout.ts";

export const golemDefenseAssets = {
  bank: "/storybook-study/mountain-road-v1.png",
  bag: "/storybook-study/packing-bag-close-3-v1.webp",
  box: "/storybook-study/homeward-medicine-v1.webp",
};
const feet = {
  aria: { x: 845, y: 740 },
  leon: { x: 990, y: 825 },
  mira: { x: 670, y: 790 },
  finn: { x: 565, y: 560 },
  lico: { x: 580, y: 680 },
};

/** Continue the departure's rearward luggage defence on one registered ground plane. */
export function presentGolemDefense(
  frame: { battle: RoadBattle; look: RoadLook },
  input: AdventureInput,
  view: RoadViewport,
) {
  if (
    !frame.look.storybookHeroes ||
    frame.look.quest !== "begging-golem" ||
    input.backgroundOverride !== golemDefenseAssets.bank
  )
    return;
  const { battle, look } = frame;
  const beforeHeroes = battle.heroes.map((h) => ({ ...h }));
  const beforeEnemies = battle.enemies.map((e) => ({ ...e }));
  const front = beforeHeroes.find((h) => h.id === "leon") ?? beforeHeroes[0];
  const layout = fixedRoadLayout(view.width, view.height);
  look.defense = { node: input.squad.run?.node ?? 2 };
  look.background = golemDefenseAssets.bank;
  look.backgroundShade = 0.08;
  look.destination = false;
  look.puller = null;
  look.frontCarriers = [];
  battle.stage = "forest";
  battle.distance = 0;
  for (const hero of battle.heroes)
    Object.assign(hero, layout.world(feet[hero.id].x, feet[hero.id].y), {
      walking: false,
      facing: 1,
    });
  for (const enemy of battle.enemies) {
    const gap = enemy.x - front.x;
    const x = 990 + Math.max(145, Math.min(650, gap * 0.7));
    Object.assign(enemy, layout.world(x, enemy.kind === "golem" ? 650 : 750));
  }
  projectFixedEffects(battle, beforeHeroes, beforeEnemies);
}

export function finishGolemDefense(battle: RoadBattle, look: RoadLook, view: RoadViewport) {
  if (!look.defense) return;
  const layout = fixedRoadLayout(view.width, view.height);
  const size = layout.sourceScale / roadHeroSize(view.width, view.height);
  battle.waterwayActions ??= { poses: {}, props: [], debrisHidden: true, closeContact: false };
  for (const [id, asset, x, y, width] of [
    ["medicine-bag", golemDefenseAssets.bag, 575, 825, 65],
    ["honey-bag", golemDefenseAssets.bag, 650, 840, 65],
    ["mira-box", golemDefenseAssets.box, 570, 775, 55],
  ] as const) {
    const point = layout.world(x, y);
    battle.waterwayActions.props.push({ id, asset, point, size: width * size, depth: point.lane });
  }
}
