import test from "node:test";
import assert from "node:assert/strict";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";
import * as roadLayout from "../lib/road-layout.ts";
import * as journey from "../lib/road-journey-cart.ts";
import * as wheels from "../lib/road-trade-cart-wheels.ts";
import * as foundingWheel from "../lib/road-founding-wheel.ts";
import * as foundingCargo from "../lib/road-founding-cargo.ts";
import { fixedRoadLayout } from "../lib/road-fixed-layout.ts";
import { WATERWAY_TOOL_CART } from "../lib/road-waterway.ts";

class WheelPainter {
  paint() {}
}
const { RoadJourneyCart } = evaluateSourceModule(
  compileSourceModule("../app/phaser/road-journey-cart.ts", import.meta.url),
  {
    "@/lib/road-layout": roadLayout,
    "@/lib/road-journey-cart": journey,
    "@/lib/road-trade-cart-wheels": wheels,
    "@/lib/road-founding-wheel": foundingWheel,
    "@/lib/road-founding-cargo": foundingCargo,
    "./road-trade-wheels": { RoadTradeWheels: WheelPainter },
    "./road-founding-wheel": { RoadFoundingWheel: WheelPainter },
  },
);

for (const view of [
  { width: 390, height: 740 },
  { width: 1180, height: 790 },
])
  test(`the tool cart sorts between feet behind and ahead of its axle at ${view.width}x${view.height}`, () => {
    const image = { depth: 0 };
    for (const method of ["setOrigin", "setVisible", "setTexture", "setDisplaySize", "setPosition"])
      image[method] = () => image;
    image.setDepth = (depth) => {
      image.depth = depth;
      return image;
    };
    const painter = new RoadJourneyCart({ scale: view, add: { image: () => image } });
    const layout = fixedRoadLayout(view.width, view.height),
      look = { waterway: { node: 2, phase: "blocked" } };
    const cart = {
      ...layout.world(900, 680),
      phase: "moving",
      asset: WATERWAY_TOOL_CART,
      returning: false,
    };
    painter.paint({ journeyCart: cart, distance: 0, stage: "forest" }, false, look);
    const behind = roadLayout.roadFigureDepth(layout.world(900, 650).lane, view, look);
    const ahead = roadLayout.roadFigureDepth(layout.world(900, 730).lane, view, look);
    assert.ok(behind < image.depth, "rear worker stays behind the cart");
    assert.ok(ahead > image.depth, "near worker stays in front of the cart");
    assert.ok(image.depth > 1, "the cart cannot disappear behind the scenery");
  });
