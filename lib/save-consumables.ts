import { z } from "zod";
import { consumableById } from "./consumables.ts";
import type { State } from "./game-types.ts";

export const consumableId = z.string().refine((id) => !!consumableById(id));
export const consumablesSchema = z
  .object({
    items: z.record(consumableId, z.number().finite().int().min(0).max(9999)),
    assigned: z.record(z.string(), consumableId),
  })
  .strict();
export const consumableEffectsSchema = z.record(
  z.string(),
  z.string().refine((id) => consumableById(id)?.effect.timing === "departure"),
);
export function validConsumables(s: Pick<State, "consumables" | "owned" | "squads">) {
  return (
    Object.keys(s.consumables?.assigned ?? {}).every((hero) => s.owned.includes(hero)) &&
    s.squads.every((sq) =>
      Object.keys(sq.run?.consumableEffects ?? {}).every((hero) => sq.members.includes(hero)),
    )
  );
}
