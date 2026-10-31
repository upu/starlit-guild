import test from "node:test";
import assert from "node:assert/strict";
import { studyCue } from "../lib/storybook/carry-cue.ts";
import { roadCartSlot, seedlingCartWidth } from "../lib/road-cart-layout.ts";
import { roadHeroSize, roadScale, roadDepth } from "../lib/road-layout.ts";
import * as cartLayout from "../lib/road-cart-layout.ts";
import * as workLayout from "../lib/road-work-layout.ts";
import * as journey from "../lib/road-journey-cart.ts";
import * as storyWork from "../lib/road-storybook-work.ts";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";

const { roadWorkAppearance } = evaluateSourceModule(
  compileSourceModule("../app/phaser/road-work-appearance.ts", import.meta.url),
  {
    "@/lib/road-cart-layout": cartLayout,
    "@/lib/road-work-layout": workLayout,
    "@/lib/road-journey-cart": journey,
    "@/lib/road-storybook-work": storyWork,
    "./road-art": { ROAD_CARGO: "legacy-cart", ROAD_HERB: "herb" },
  },
);

for (const view of [
  { width: 1180, height: 790 },
  { width: 936, height: 624 },
  { width: 390, height: 740 },
  { width: 374, height: 249 },
])
  test(`the seedling cart retains the departure's physical body ratio and hand contacts at ${view.width}x${view.height}`, () => {
    const cue = studyCue("moss-transplant-departure", 37, true);
    const cart = cue.items.find((item) => item.id === "transplant-cart");
    const expectedRatio = cart.width / ((cue.cell * 144) / 192);
    const size = roadHeroSize(view.width, view.height) * 0.9;
    const look = {
      quest: "moss-transplant",
      storybookHeroes: true,
      work: { asset: storyWork.STORYBOOK_SEEDLING_CART, frame: "cart" },
    };
    const rendered = roadWorkAppearance(look, view, true);
    assert.equal(rendered.asset, storyWork.STORYBOOK_SEEDLING_CART);
    assert.ok(Math.abs(rendered.size / size - expectedRatio) < 1e-10);
    assert.equal(rendered.size, seedlingCartWidth(view));
    for (const [id, pulling, palm, grip] of [
      ["aria", false, { x: 47, y: -77 }, { x: -0.47, y: -0.292 }],
      ["finn", true, { x: -47, y: -65 }, { x: 0.4, y: 0.012 }],
    ]) {
      const slot = roadCartSlot(view, "forest", true, pulling, true, id);
      assert.ok(
        Math.abs(
          slot.offset * roadScale(view.width) + (palm.x * size) / 144 - rendered.size * grip.x,
        ) < 1e-8,
      );
      assert.ok(
        Math.abs(
          (slot.lane - 0.82) * roadDepth(view.width, view.height) +
            (palm.y * size) / 144 -
            rendered.size * grip.y,
        ) < 1e-8,
      );
    }
    const plain = roadWorkAppearance({ ...look, storybookHeroes: false }, view, true);
    assert.equal(plain.size, workLayout.roadWorkWidth(view.width, true, "cart", view.height));
  });
