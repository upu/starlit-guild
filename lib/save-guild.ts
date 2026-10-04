import { z } from "zod";
import { homeLayoutSchema } from "./home-room-schema.ts";
import {
  guildRoles,
  guildPlots,
  guildMaterials,
  guildCrops,
  guildRecipes,
  plotRole,
} from "./guild-content.ts";
import type { State } from "./game-types.ts";

const time = z.number().finite().min(0).max(8640000000000000);
const batch = z
  .object({ startedAt: time, readyAt: time, quantity: z.number().int().min(1).max(9) })
  .strict()
  .refine((value) => value.readyAt > value.startedAt);
const plot = z
  .object({
    crop: z
      .string()
      .refine((id) => guildCrops.some((crop) => crop.id === id))
      .optional(),
    batch: batch.optional(),
    replant: z.boolean().optional(),
  })
  .strict();
export const guildSchema = z
  .object({
    lastAt: time,
    materials: z.record(
      z.string().refine((id) => guildMaterials.some((item) => item.id === id)),
      z.number().int().min(0).max(9999),
    ),
    roles: z
      .object({
        linde: z.string().optional(),
        brekka: z.string().optional(),
        workbench: z.string().optional(),
      })
      .strict(),
    plots: z.object({ "linde-1": plot, "linde-2": plot, "brekka-1": plot }).strict(),
    cultivation: z.number().int().min(0).max(10),
    crafting: z.number().int().min(0).max(10),
    home: homeLayoutSchema.optional(),
    work: z
      .object({
        recipe: z.string().refine((id) => guildRecipes.some((item) => item.id === id)),
        remaining: z.number().int().min(1).max(99).nullable(),
        batch: batch.optional(),
        pausedMs: time.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
export function validGuild(s: Pick<State, "guild" | "owned">) {
  const guild = s.guild;
  if (!guild) return true;
  const assigned = guildRoles.flatMap((role) => (guild.roles[role] ? [guild.roles[role]] : []));
  if (
    new Set(assigned).size !== assigned.length ||
    assigned.some((hero) => !s.owned.includes(hero))
  )
    return false;
  if (!guildPlots.every((id) => validPlot(guild, id))) return false;
  const work = guild.work;
  if (!work) return true;
  if (work.pausedMs !== undefined && (!work.batch || guild.roles.workbench)) return false;
  if (!work.batch) return true;
  return (
    work.batch.startedAt <= guild.lastAt &&
    work.batch.quantity <= 3 &&
    (!!guild.roles.workbench || work.pausedMs !== undefined)
  );
}
function validPlot(guild: NonNullable<State["guild"]>, id: (typeof guildPlots)[number]) {
  const plot = guild.plots[id];
  if (plot.crop && !guildCrops.some((crop) => crop.id === plot.crop && crop.role === plotRole(id)))
    return false;
  return (
    !plot.batch || (!!plot.crop && plot.batch.startedAt <= guild.lastAt && plot.batch.quantity <= 7)
  );
}
