import { test } from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { compileSourceModule, evaluateSourceModule } from "./helpers/source-module.mjs";

const ui = (...names) => Object.fromEntries(names.map((name) => [name, name]));
// Render the exported component from its whole source module. Other imports are
// registered explicitly, but their components are not rendered in this test.
const exports = evaluateSourceModule(
  compileSourceModule("../app/equipment-panels.tsx", import.meta.url),
  {
    react: {
      useState: () => {
        throw new Error("Unexpected useState in ResourcesGrid");
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "./character-loadout": ui("CharacterEquipment", "EquipmentSlotPanel"),
    "./consumable-panels": ui("ConsumableBag", "ConsumableDetails"),
    "next/image": { default: "img" },
    "lucide-react": {
      Coins: "coins",
      Leaf: "leaf",
      Gem: "gem",
      ...ui("Shield", "Swords", "Package", "SquareDashed", "X"),
    },
    "@/lib/game": {},
    "@/lib/equipment": {},
    "@/lib/story-items": {},
    "@/lib/techniques": {},
    "./technique-panel": ui("TechniquePanel", "TechniqueDetails"),
    "./shop-item-icon": ui("ShopItemIcon"),
    "./technique-icon": ui("TechniqueIcon"),
    "./portrait": ui("Portrait"),
    "./character-level": ui("CharacterLevel"),
    "./use-character-swipe": { useCharacterSwipe: () => ({}) },
  },
);
function balances(state) {
  const content = exports.ResourcesGrid({ state });
  assert.equal(content.type, "div");
  assert.equal(content.props.className, "inventory-grid");
  assert.equal(content.props.children.length, 2);
  return Array.from(content.props.children, (cell) => ({
    icon: cell.props.children[0].type,
    label: cell.props.children[1].props.children,
    amount: cell.props.children[2].props.children,
  }));
}
test("bag resource counters keep money and ore; herbs belong to the item list", () => {
  const state = Object.freeze({ gold: 12345.9, herbs: 8.7, ore: 3 });
  assert.deepEqual(balances(state), [
    { icon: "coins", label: "お金", amount: "12,345" },
    { icon: "gem", label: "鉱石", amount: "3" },
  ]);
});

test("empty inventory keeps every resource counter visible", () => {
  assert.deepEqual(
    balances({ gold: 0, herbs: 0, ore: 0 }).map((item) => item.amount),
    ["0", "0"],
  );
});
