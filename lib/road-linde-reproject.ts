import type { RoadLook } from "./road-look.ts";
import { lindeDeliveryLayout } from "./road-housecalls-layout.ts";
import { lanternRoadLayout } from "./road-lantern-layout.ts";
import { brekkaLedgerLayout } from "./road-brekka-ledger-layout.ts";
import { roadX, roadY } from "./road-layout.ts";

type Point = { x: number; lane: number };
type View = {
  width: number;
  height: number;
  portrait: boolean;
  scene: "linde" | "lantern" | "ledger";
};
function currentScene(look: RoadLook): Pick<View, "scene" | "portrait"> | undefined {
  if (look.lindeDelivery) return { scene: "linde", portrait: !!look.lindeDelivery.portrait };
  if (look.lanternRoad) return { scene: "lantern", portrait: !!look.lanternRoad.portrait };
  if (look.brekkaLedger) return { scene: "ledger", portrait: !!look.brekkaLedger.portrait };
}
const layouts = {
  linde: lindeDeliveryLayout,
  lantern: lanternRoadLayout,
  ledger: brekkaLedgerLayout,
};
function unchanged(prior: View, current: View) {
  return (
    prior.width === current.width &&
    prior.height === current.height &&
    prior.portrait === current.portrait
  );
}

/** Keep the same ground coordinates when a painted scene changes canvas size. */
export class LindeReprojection {
  private previous?: View;
  update(
    look: RoadLook,
    view: { width: number; height: number },
    reset: boolean,
    feet: Map<string, Point>,
    positions: Map<string, Point>,
    camera: number,
  ) {
    const prior = this.previous;
    const selected = currentScene(look);
    if (!selected) {
      this.previous = undefined;
      return;
    }
    const current: View = {
      ...view,
      ...selected,
    };
    this.previous = current;
    if (reset || !prior || prior.scene !== current.scene || unchanged(prior, current)) return;
    const layout = layouts[current.scene];
    const from = layout(prior, prior.portrait);
    const to = layout(current, current.portrait);
    for (const [id, foot] of feet) {
      const old = from.unproject(
        roadX(foot.x, camera, prior.width),
        roadY(foot.lane, prior.height, prior.width),
      );
      const next = to.world(old.x, old.y);
      feet.set(id, next);
      positions.set(id, {
        x: (roadX(next.x, camera, view.width) / view.width) * 560,
        lane: next.lane,
      });
    }
  }
}
