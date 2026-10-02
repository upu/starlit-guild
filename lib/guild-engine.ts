import type { State } from "./game-types.ts";
import type { GuildState } from "./guild-types.ts";
import { guildUnlocked } from "./guild-base.ts";
import {
  guildPlots,
  guildRecipes,
  plotRole,
  GUILD_STOCK_CAP,
  type GuildPlotId,
} from "./guild-content.ts";
import { startPlant, startWork, harvestable, harvest, finishWork } from "./guild-production.ts";

function restart(s: State, guild: GuildState, at: number) {
  for (const id of guildPlots)
    if (guild.roles[plotRole(id)] && guild.plots[id].replant !== false)
      startPlant(s, guild, id, at);
  startWork(s, guild, at);
}
function nextProduction(s: State, guild: GuildState) {
  const events: { id: GuildPlotId | "workbench"; at: number }[] = [];
  for (const id of guildPlots) {
    const batch = guild.plots[id].batch;
    if (batch && harvestable(s, guild, id)) events.push({ id, at: batch.readyAt });
  }
  const work = guild.work,
    recipe = guildRecipes.find((item) => item.id === work?.recipe);
  if (
    work?.batch &&
    recipe &&
    guild.roles.workbench &&
    work.pausedMs === undefined &&
    (s.consumables?.items[recipe.output] ?? 0) + work.batch.quantity <= GUILD_STOCK_CAP
  ) {
    events.push({ id: "workbench", at: work.batch.readyAt });
  }
  return events.sort((a, b) => a.at - b.at).at(0);
}
// Mutates only the guild and its stock. Adventure clocks are advanced separately.
export function settleGuild(s: State, now: number) {
  const guild = s.guild;
  if (!guild || !guildUnlocked(s) || !Number.isFinite(now)) return;
  const end = Math.max(guild.lastAt, now);
  let at = guild.lastAt;
  restart(s, guild, at);
  for (;;) {
    const event = nextProduction(s, guild);
    if (!event || Math.max(at, event.at) > end) break;
    at = Math.max(at, event.at);
    if (event.id === "workbench") finishWork(s, guild);
    else harvest(s, guild, event.id);
    restart(s, guild, at);
  }
  guild.lastAt = end;
}
