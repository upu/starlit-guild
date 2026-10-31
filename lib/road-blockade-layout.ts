import type { RoadEnemy } from "./road-view.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import { fixedRoadLayout } from "./road-fixed-layout.ts";
import { roadHeroSize } from "./road-layout.ts";
import type { WaterwayProp } from "./road-waterway-contacts.ts";
import { paintedPuppetAssets } from "./road-storybook-enemy.ts";

export const blockadeAssets = {
  bank: "/storybook-study/workshop-yard-v1.png",
  table: "/storybook-study/packing-table-v1.webp",
  honey: "/storybook-study/honey-v1.webp",
  goods: "/storybook-study/trade-parcels-open-v1.webp",
  medicine: "/storybook-study/packing-bag-close-3-v1.webp",
  box: "/storybook-study/homeward-medicine-v1.webp",
  ...paintedPuppetAssets,
};
export const blockadeFeet = {
  aria: { x: 945, y: 720 },
  leon: { x: 760, y: 810 },
  mira: { x: 590, y: 640 },
  finn: { x: 530, y: 560 },
  lico: { x: 540, y: 670 },
};
export type SourceFoot = { x: number; y: number };
export function blockadeEnemyFoot(enemy: Pick<RoadEnemy, "kind">, small = 0): SourceFoot {
  if (enemy.kind === "golem") return { x: 980, y: 625 };
  if (enemy.kind === "pumpety") return { x: 1320, y: 580 };
  return { x: 1100 + small * 140, y: 750 - small * 20 };
}
export const blockadeGatheredFoot = (kind: RoadEnemy["kind"]): SourceFoot =>
  ({ golem: { x: 1010, y: 520 }, puppet: { x: 1170, y: 570 }, pumpety: { x: 1250, y: 490 } })[
    kind as "golem" | "puppet" | "pumpety"
  ];

export function blockadeProps(view: RoadViewport): WaterwayProp[] {
  const layout = fixedRoadLayout(view.width, view.height);
  const scale = layout.sourceScale / roadHeroSize(view.width, view.height);
  return (
    [
      ["loot-table", blockadeAssets.table, 1240, 690, 240, 690],
      ["stolen-honey", blockadeAssets.honey, 1200, 601, 28, 691],
      ["other-goods", blockadeAssets.goods, 1310, 603, 55, 692],
      ["medicine-bag", blockadeAssets.medicine, 535, 805, 65, 805],
      ["mira-box", blockadeAssets.box, 570, 740, 55, 740],
    ] as const
  ).map(([id, asset, x, y, width, depth]) => ({
    id,
    asset,
    point: layout.world(x, y),
    size: width * scale,
    depth: layout.world(x, depth).lane,
  }));
}
