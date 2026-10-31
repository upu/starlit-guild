import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  storybookWorkAppearance,
  STORYBOOK_CART,
  STORYBOOK_MEDICAL_CART,
  STORYBOOK_SEEDLING_CART,
} from "../lib/road-storybook-work.ts";

test("Brekka's visiting supplies replace only its painted cart", () => {
  const look = {
    storybookHeroes: true,
    quest: "brekka-arrival",
    work: { frame: "cart", asset: "cart" },
  };
  assert.equal(storybookWorkAppearance(look).asset, STORYBOOK_MEDICAL_CART);
  assert.equal(storybookWorkAppearance({ ...look, quest: "village-trade" }).asset, STORYBOOK_CART);
  assert.equal(
    storybookWorkAppearance({
      ...look,
      quest: "moss-transplant",
      work: { frame: "cart", asset: "seedling-cart" },
    }).asset,
    STORYBOOK_SEEDLING_CART,
  );
  assert.equal(storybookWorkAppearance({ ...look, storybookHeroes: false }), undefined);
});

test("the visiting cart uses the established transparent canvas and keeps its handles and wheel", async () => {
  const cart = await sharp(`public${STORYBOOK_MEDICAL_CART}`)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.deepEqual([cart.info.width, cart.info.height, cart.info.channels], [420, 280, 4]);
  const alpha = (x, y) => cart.data[(y * cart.info.width + x) * 4 + 3];
  assert.equal(alpha(0, 0), 0);
  assert.equal(alpha(419, 279), 0);
  assert.ok(alpha(405, 205) > 128, "upper shaft reaches the right-hand grip");
  assert.ok(alpha(382, 237) > 128, "lower shaft reaches the right-hand grip");
  assert.ok(alpha(82, 254) > 128, "wheel remains on its common ground baseline");
});
