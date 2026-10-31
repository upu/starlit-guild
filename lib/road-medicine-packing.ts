import type { AdventureInput } from "./adventure-presentation.ts";
import type { RoadBattle } from "./road-view.ts";
import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { fixedRoadLayout } from "./road-fixed-layout.ts";
import { roadHeroSize } from "./road-layout.ts";
import { packingFinishAssets } from "./road-packing-finish.ts";

export const medicinePackingAssets = {
  ...packingFinishAssets,
  bank: "/storybook-study/medicine-shop-yard-v1.png",
  table: "/storybook-study/packing-table-v1.webp",
  aria: "/storybook-study/aria-table-packing-v1.webp",
  leon: "/storybook-study/leon-packing-v1.webp",
  paper: "/storybook-study/leon-paper-v1.webp",
  ariaPaper: "/storybook-study/aria-paper-v1.webp",
  merchant: "/storybook-study/packing-merchant-v1.webp",
  bottle: "/storybook-study/healing-bottle-v1.webp",
  honey: "/storybook-study/honey-v1.webp",
  cloth: "/storybook-study/spare-cloth-folded-v1.webp",
  packet: "/storybook-study/medicine-packet-v1.webp",
  bag: "/storybook-study/honey-bag-open-v1.webp",
  bagFront: "/storybook-study/packing-bag-lip-v2.webp",
  ariaCarry: "/storybook-study/aria-night-handheld-v1.webp",
  leonCarry: "/storybook-study/leon-carry-v1.webp",
  leonCarryWalk: "/storybook-study/leon-carry-walk-v1.webp",
  leonLower: "/storybook-study/leon-work-v1.webp",
  ariaTurn: "/storybook-study/aria-packing-turn-v1.webp",
  leonTurn: "/storybook-study/leon-packing-turn-v1.webp",
};
export const packingFeet = {
  aria: { x: 820, y: 745 },
  leon: { x: 1100, y: 723 },
  merchant: { x: 950, y: 610 },
};
export function packingSourceSize(sourceWidth: number, view: RoadViewport) {
  return (
    (sourceWidth * fixedRoadLayout(view.width, view.height).sourceScale) /
    roadHeroSize(view.width, view.height)
  );
}
export function presentMedicinePacking(
  frame: { battle: RoadBattle; look: RoadLook },
  input: AdventureInput,
  view: RoadViewport,
) {
  const { battle, look } = frame;
  if (
    !look.storybookHeroes ||
    look.quest !== "medicine-packing" ||
    (input.backgroundOverride ?? look.background) !== medicinePackingAssets.bank
  )
    return;
  const layout = fixedRoadLayout(view.width, view.height);
  look.packing = {
    node: input.squad.run?.node ?? (input.questComplete === false ? 0 : 14),
    completed: !input.squad.run && input.questComplete === true,
  };
  look.background = medicinePackingAssets.bank;
  look.backgroundShade = 0.08;
  look.destination = false;
  look.puller = null;
  look.frontCarriers = [];
  battle.distance = 0;
  battle.heroes = battle.heroes.map((hero) => ({
    ...hero,
    ...layout.world(
      packingFeet[hero.id === "aria" ? "aria" : "leon"].x,
      packingFeet[hero.id === "aria" ? "aria" : "leon"].y,
    ),
    walking: false,
    facing: hero.id === "aria" ? 1 : -1,
  }));
  battle.effects = [];
  if (look.work && battle.gathering) {
    look.work = {
      ...look.work,
      asset: medicinePackingAssets.table,
      frame: "packing-bench",
      task: "inspect",
      cargo: false,
    };
    const workPoint = layout.world(950, 745);
    battle.gathering = {
      ...battle.gathering,
      ...workPoint,
      x: workPoint.x - 65,
      task: "inspect",
      kind: "herb",
    };
    look.workers = ["aria", "leon"];
  }
}
