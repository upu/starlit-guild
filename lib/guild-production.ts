import type { State } from "./game-types.ts";
import type { GuildState } from "./guild-types.ts";
import {
  guildCrops,
  guildRecipes,
  guildLevel,
  openGuildPlots,
  plotRole,
  GUILD_STOCK_CAP,
  type GuildPlotId,
} from "./guild-content.ts";

export const guildStock = (s: State, id: string) =>
  id === "herbs" ? Math.floor(s.herbs) : (s.guild?.materials[id] ?? 0);
export function takeMaterial(s: State, guild: GuildState, id: string, count: number) {
  if (id === "herbs") s.herbs -= count;
  else guild.materials[id] = (guild.materials[id] ?? 0) - count;
}
export function startPlant(s: State, guild: GuildState, id: GuildPlotId, at: number) {
  if (!openGuildPlots.includes(id)) return;
  const plot = guild.plots[id],
    crop = guildCrops.find((item) => item.id === plot.crop);
  if (!crop || plot.batch || guildStock(s, crop.seed) < 1) return;
  const hero = guild.roles[plotRole(id)],
    expert = hero === "aria" || hero === "lico";
  const bonus = hero ? (expert ? 2 : 1) : 0,
    level = guildLevel(guild.cultivation);
  const speed = (hero ? (expert ? 0.75 : 0.9) : 1) * (1 - (level - 1) * 0.05);
  takeMaterial(s, guild, crop.seed, 1);
  plot.batch = {
    startedAt: at,
    readyAt: at + crop.minutes * 60000 * speed,
    quantity: crop.yield + bonus + level - 1,
  };
}
export function startWork(s: State, guild: GuildState, at: number) {
  const work = guild.work,
    hero = guild.roles.workbench;
  if (!work || work.batch || !hero || work.remaining === 0) return;
  const recipe = guildRecipes.find((item) => item.id === work.recipe);
  if (!recipe || Object.entries(recipe.ingredients).some(([id, n]) => guildStock(s, id) < n))
    return;
  const level = guildLevel(guild.crafting),
    quantity = level;
  if ((s.consumables?.items[recipe.output] ?? 0) + quantity > GUILD_STOCK_CAP) return;
  for (const [id, count] of Object.entries(recipe.ingredients)) takeMaterial(s, guild, id, count);
  const steep = recipe.steepMinutes ?? 0;
  const minutes =
    steep +
    (recipe.minutes - steep) * (hero === recipe.expert ? 0.75 : 1) * (1 - (level - 1) * 0.05);
  work.batch = { startedAt: at, readyAt: at + minutes * 60000, quantity };
}
export function harvestable(s: State, guild: GuildState, id: GuildPlotId) {
  const plot = guild.plots[id],
    crop = guildCrops.find((item) => item.id === plot.crop);
  if (!crop || !plot.batch || !guild.roles[plotRole(id)]) return false;
  return (
    crop.output === "herbs" || guildStock(s, crop.output) + plot.batch.quantity <= GUILD_STOCK_CAP
  );
}
export function harvest(s: State, guild: GuildState, id: GuildPlotId) {
  const plot = guild.plots[id],
    crop = guildCrops.find((item) => item.id === plot.crop);
  if (!crop || !plot.batch) return;
  if (crop.output === "herbs") s.herbs += plot.batch.quantity;
  else guild.materials[crop.output] = guildStock(s, crop.output) + plot.batch.quantity;
  guild.cultivation = Math.min(10, guild.cultivation + 1);
  delete plot.batch;
  if (!openGuildPlots.includes(id)) guild.plots[id] = {};
}
export function finishWork(s: State, guild: GuildState) {
  const work = guild.work,
    recipe = guildRecipes.find((item) => item.id === work?.recipe);
  if (!work?.batch || !recipe) return;
  const items = (s.consumables ??= { items: {}, assigned: {} }).items;
  items[recipe.output] = (items[recipe.output] ?? 0) + work.batch.quantity;
  guild.crafting = Math.min(10, guild.crafting + 1);
  delete work.batch;
  if (work.remaining !== null) work.remaining--;
  if (work.remaining === 0) delete guild.work;
}
