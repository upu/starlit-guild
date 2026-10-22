import type { StageItem } from "./story-stage-cues.ts";
import { ground, held } from "./story-stage-later-shared.ts";

type Records = {
  district?: "keeper" | "table";
  receipt?: "table" | "hand" | "folding" | "folded" | "returned";
};
const deskPaper = (
  art: StageItem["art"],
  id: string,
  x: number,
  bottom: number,
  width: number,
): StageItem => ({
  ...ground(art, x, bottom, width),
  id,
  support: "inspection-table",
});
export const inspectionLuggage = (): StageItem[] => [
  ground("basket", 18, 13, 7),
  ground("delivery-bag", 90, 8, 8),
  ground("medicine-closed", 17, 39, 8),
];
function shippingCopy(receipt: Records["receipt"]): StageItem {
  const folded = receipt === "folded" || receipt === "returned";
  const art = folded ? "folded-paper" : "paper",
    width = folded ? 3.2 : 4.5;
  return receipt === "table" || receipt === "returned"
    ? deskPaper(art, "shipping-copy", 72, 34, width)
    : held(art, "finn", {
        id: "shipping-copy",
        x: 6,
        bottom: 27,
        width,
        turn: receipt === "folding" ? 80 : 0,
      });
}
function districtPlan(district: Records["district"]): StageItem[] {
  if (district === "keeper")
    return [{ ...ground("map", 5, 34, 6), id: "district-plan", extra: "keeper" }];
  return district === "table" ? [deskPaper("map", "district-plan", 66, 34, 6)] : [];
}
export function inspectionRecords({ district, receipt = "table" }: Records = {}): StageItem[] {
  return [
    ...inspectionLuggage(),
    { ...ground("table", 65, 16, 24), id: "inspection-table" },
    deskPaper("map", "tower-plan", 60, 34, 6.5),
    shippingCopy(receipt),
    ...districtPlan(district),
  ];
}

export const foundationItems = (packing = false, ready = false): StageItem[] => [
  ...(ready
    ? [
        held("basket", "aria", { x: 3, bottom: 17, width: 7 }),
        held("delivery-bag", "leon", { x: -4, bottom: 18, width: 8 }),
        held("medicine-closed", "mira", { x: 2.2, bottom: 22, width: 8 }),
      ]
    : inspectionLuggage()),
  ground("tools", 29, 33, 5),
  held("map", "leon", { id: "district-plan", x: -2, bottom: 26, width: 6, stored: packing }),
  held("paper", "leon", { id: "shipping-copy", x: -5, bottom: 23, width: 4.5, stored: packing }),
];
