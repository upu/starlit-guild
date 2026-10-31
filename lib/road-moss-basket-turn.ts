import { waterwayActionAssets as assets } from "./road-waterway-contacts.ts";

/** Palms are registered per painted pose; the basket remains a separate prop. */
export function mossBasketTurn(age: number, startFacing: 1 | -1, reduced: boolean) {
  if (startFacing > 0 || reduced || age >= 480)
    return { facing: 1 as const, palm: [134, 105], asset: assets.carry, frame: 0 };
  if (age < 120) return { facing: -1 as const, palm: [134, 105], asset: assets.carry, frame: 0 };
  if (age < 240)
    return { facing: -1 as const, palm: [118, 107], asset: assets.carryTurn, frame: 1 };
  if (age < 360) return { facing: 1 as const, palm: [96, 108], asset: assets.carryTurn, frame: 2 };
  return { facing: 1 as const, palm: [118, 107], asset: assets.carryTurn, frame: 1 };
}
