import type { RoadViewport } from "./road-cart-layout.ts";
import type { Traveller, RoadBattle } from "./road-view.ts";
import { housecallsLayout } from "./road-housecalls-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";
import { gardenReceptionAssets as assets, receptionCart } from "./road-garden-reception.ts";

export function receptionReturnTarget(id: Traveller["id"]): [number, number] {
  const points: Partial<Record<Traveller["id"], [number, number]>> = {
    aria: [315, 477],
    leon: [547, 595],
    mira: [458, 713],
    finn: [936, 775],
  };
  return points[id] ?? [1250, 850];
}
export function receptionReturnScene(
  scene: NonNullable<RoadBattle["waterwayActions"]>,
  view: RoadViewport,
) {
  const l = housecallsLayout(view);
  receptionCart(scene, view, { x: 779, y: 726 });
  scene.poses.finn = { asset: assets.push, frame: 1, rows: 2 };
  scene.actors = [
    {
      id: "reception-servant",
      point: l.world(1111, 462),
      size: l.figureRatio * 1.33,
      pose: {
        asset: assets.servant,
        cell: 128,
        rows: 4,
        frame: 0,
        square: { foot: 120, height: 104 },
      },
    },
  ];
  const table = housecallProp(view, "display-table", assets.table, l.world(945, 520), 265);
  const covered = housecallProp(view, "display-covered", assets.covered, l.world(945, 417), 155);
  covered.depth = table.depth + 0.01;
  const marker = housecallProp(view, "return-marker", assets.marker, l.world(354, 442), 39);
  marker.depth = l.world(315, 477).lane + 0.03;
  scene.props.push(
    table,
    covered,
    marker,
    housecallProp(view, "display-pot", assets.pot, l.world(746, 498), 66),
  );
}
