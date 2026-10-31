import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { fixedRoadLayout } from "./road-fixed-layout.ts";
import { roadHeroSize } from "./road-layout.ts";
import { projectFixedEffects } from "./road-fixed-effects.ts";

export const signpostAssets = {
  bank: "/storybook-study/mountain-fork-v1.png",
  sign: "/storybook-study/signpost-portable-v1.webp",
  bag: "/storybook-study/packing-bag-close-3-v1.webp",
  box: "/storybook-study/homeward-medicine-v1.webp",
  inspect: "/storybook-study/aria-forage-v1.webp",
  paper: "/storybook-study/leon-paper-v1.webp",
  carry: "/storybook-study/leon-carry-v1.webp",
  walk: "/storybook-study/leon-carry-walk-v1.webp",
  lower: "/storybook-study/leon-work-v1.webp",
  turn: "/storybook-study/leon-packing-turn-v1.webp",
  puppet: "/storybook-study/puppet-poses-v1.webp",
};
export const signpostBase = { x: 990, y: 710 },
  signpostEnemy = { x: 1130, y: 670 };
export const signpostFeet = {
  aria: { x: 860, y: 710 },
  leon: { x: 990, y: 790 },
  mira: { x: 720, y: 760 },
  finn: { x: 600, y: 680 },
  lico: { x: 540, y: 800 },
};
export function signpostSize(view: RoadViewport, source = 60) {
  return (
    (source * fixedRoadLayout(view.width, view.height).sourceScale) /
    roadHeroSize(view.width, view.height)
  );
}
export function presentSignpost(
  frame: { battle: RoadBattle; look: RoadLook },
  input: AdventureInput,
  view: RoadViewport,
) {
  const { battle, look } = frame;
  if (
    !look.storybookHeroes ||
    look.quest !== "spinning-signpost" ||
    input.backgroundOverride !== signpostAssets.bank
  )
    return;
  look.signpost = {
    node: input.squad.run?.node ?? (input.questComplete === false ? 0 : 8),
    completed: !!input.questComplete && !input.squad.run,
  };
  look.background = signpostAssets.bank;
  look.backgroundShade = 0.08;
  look.destination = false;
  look.puller = null;
  look.frontCarriers = [];
  battle.stage = "forest";
  battle.distance = 0;
  const originalHeroes = battle.heroes.map((h) => ({ ...h })),
    originalEnemies = battle.enemies.map((e) => ({ ...e }));
  const layout = fixedRoadLayout(view.width, view.height);
  for (const hero of battle.heroes)
    Object.assign(hero, layout.world(signpostFeet[hero.id].x, signpostFeet[hero.id].y), {
      walking: false,
      facing: 1,
    });
  battle.enemies.forEach((enemy, index) =>
    Object.assign(enemy, layout.world(signpostEnemy.x + index * 95, signpostEnemy.y + index * 85)),
  );
  projectFixedEffects(battle, originalHeroes, originalEnemies);
  if (battle.gathering && look.work) {
    const point = layout.world(signpostBase.x, signpostBase.y);
    Object.assign(battle.gathering, {
      kind: "cargo",
      task: "inspect",
      x: point.x - 65,
      lane: point.lane,
    });
    Object.assign(look.work, {
      cargo: false,
      task: "inspect",
      frame: "signpost-restoration",
      asset: signpostAssets.sign,
    });
  }
}
