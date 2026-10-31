import type { RoadViewport } from "./road-cart-layout.ts";
import type { WaterwayActions } from "./road-waterway-contacts.ts";
import { manorDeliveryLayout } from "./road-housecalls-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";

export const MANOR_GARDEN_FIGURE_SCALE = 1.33;
export const manorGardenAssets = {
  garden: "/storybook-study/manor-garden-v1.png",
  displayTable: "/storybook-study/medicine-table-v1.webp",
  displayCovered: "/storybook-study/display-covered-v1.webp",
  gardener: "/storybook-study/gardener-motion-v1.webp",
  owner: "/storybook-study/merchant-poses-v2.webp",
  basket: "/storybook-study/basket-v1.webp",
  deliveryBag: "/story-stage/prop-delivery-bag.webp",
  medicine: "/storybook-study/medicine-closed-v1.webp",
  documentProp: "/story-stage/prop-paper.webp",
};

/** Same covered case, people and belongings as the first moment of the return conversation. */
export function manorGardenScene(scene: WaterwayActions, view: RoadViewport) {
  gardenPeople(scene, view);
  gardenObjects(scene, view);
}
function gardenPeople(scene: WaterwayActions, view: RoadViewport) {
  const l = manorDeliveryLayout(view);
  scene.actors = [
    {
      id: "manor-owner",
      point: l.world(525, 486),
      size: l.figureRatio * MANOR_GARDEN_FIGURE_SCALE,
      pose: {
        asset: manorGardenAssets.owner,
        cell: 128,
        rows: 1,
        frame: 0,
        square: { foot: 120, height: 95 },
      },
    },
    {
      id: "manor-gardener",
      point: l.world(988, 589),
      size: l.figureRatio * MANOR_GARDEN_FIGURE_SCALE,
      pose: {
        asset: manorGardenAssets.gardener,
        cell: 128,
        rows: 2,
        frame: 0,
        square: { foot: 120, height: 95 },
      },
    },
  ];
}
function gardenObjects(scene: WaterwayActions, view: RoadViewport) {
  const l = manorDeliveryLayout(view);
  const table = housecallProp(
    view,
    "manor-display-table",
    manorGardenAssets.displayTable,
    l.world(845, 699),
    266,
    l.scale,
  );
  const covered = housecallProp(
    view,
    "manor-display-covered",
    manorGardenAssets.displayCovered,
    l.world(845, 591),
    155,
    l.scale,
  );
  table.verticalScale = 2 / 3;
  table.flipX = true;
  covered.depth = table.depth + 0.03;
  const basket = housecallProp(
    view,
    "manor-basket",
    manorGardenAssets.basket,
    l.world(480, 770),
    61,
    l.scale,
  );
  const bag = housecallProp(
    view,
    "manor-bag",
    manorGardenAssets.deliveryBag,
    l.world(1188, 770),
    78,
    l.scale,
  );
  bag.verticalScale = 256 / 217 / 1.3;
  const medicine = housecallProp(
    view,
    "manor-medicine",
    manorGardenAssets.medicine,
    l.world(382, 571),
    58,
    l.scale,
  );
  const paper = housecallProp(
    view,
    "manor-copy",
    manorGardenAssets.documentProp,
    l.world(723, 588),
    39,
    l.scale,
  );
  paper.verticalScale = 256 / 237 / 2;
  paper.depth = l.world(690, 670).lane + 0.03;
  scene.props.push(table, covered, basket, bag, medicine, paper);
}
