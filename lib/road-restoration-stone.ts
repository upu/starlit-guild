import type { RoadLook } from "./road-look.ts";
import type { RoadViewport } from "./road-cart-layout.ts";
import type { WaterwayActions } from "./road-waterway-contacts.ts";
import { restorationSiteLayout } from "./road-restoration-layout.ts";
import { housecallProp } from "./road-housecalls-contacts.ts";
import { restorationPlacement, restorationStoneTurn } from "./road-restoration-placement.ts";

export function restorationStoneProps(
  scene: WaterwayActions,
  state: NonNullable<RoadLook["restoration"]>,
  view: RoadViewport,
  reduced: boolean,
  assets: { stone: string; stoneTop: string; stoneSide: string },
) {
  if (state.installed) return;
  const l = restorationSiteLayout(view);
  const stonePoint =
    state.installAge === undefined
      ? { x: 822, y: 675 }
      : restorationPlacement(state.installAge, reduced).stone;
  const turn = restorationStoneTurn(state.installAge ?? 0);
  const angle =
    view.height > view.width
      ? 50 * Math.max(0, Math.min(1, ((state.installAge ?? 0) - 3000) / 600))
      : 0;
  const point = l.world(stonePoint.x, stonePoint.y);
  const stone = housecallProp(
    view,
    "restoration-stone",
    turn.upperFace ? assets.stoneTop : assets.stone,
    point,
    90,
    l.scale,
  );
  stone.alpha = turn.faceAlpha;
  stone.angle = angle;
  scene.props.push(stone);
  if (turn.sideAlpha > 0) {
    const side = housecallProp(
      view,
      "restoration-stone-side",
      assets.stoneSide,
      point,
      90,
      l.scale,
    );
    side.alpha = turn.sideAlpha;
    side.angle = angle;
    scene.props.push(side);
  }
}
