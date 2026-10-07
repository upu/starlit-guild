import type { State } from "./game-types.ts";
import type { GuildBatch } from "./guild-types.ts";
import type { HomeMarkerStatus } from "./home-room-markers.ts";
import {
  guildCrops,
  guildRecipes,
  plotRole,
  GUILD_STOCK_CAP,
  type GuildPlotId,
} from "./guild-content.ts";
import { guildStock } from "./guild-production.ts";

export const batchProgress = (batch: GuildBatch | undefined, now: number) =>
  batch
    ? Math.min(
        1,
        Math.max(0, (now - batch.startedAt) / Math.max(1, batch.readyAt - batch.startedAt)),
      )
    : 0;
export const remainingLabel = (readyAt: number, now: number) =>
  `あと${String(Math.max(1, Math.ceil((readyAt - now) / 60000)))}分`;
export function workProgress(state: State, now: number) {
  const work = state.guild?.work;
  const at = work?.batch && work.pausedMs !== undefined ? work.batch.readyAt - work.pausedMs : now;
  return batchProgress(work?.batch, at);
}
export function gardenStatus(state: State, id: GuildPlotId, now: number) {
  const plot = state.guild?.plots[id],
    crop = guildCrops.find((c) => c.id === plot?.crop);
  if (!plot?.batch) {
    return emptyPlotStatus(state, id);
  }
  if (plot.batch.readyAt > now) return remainingLabel(plot.batch.readyAt, now);
  if (!state.guild?.roles[plotRole(id)]) return "収穫の担当待ち";
  if (
    crop &&
    crop.output !== "herbs" &&
    guildStock(state, crop.output) + plot.batch.quantity > GUILD_STOCK_CAP
  )
    return "在庫の空き待ち";
  return "収穫待ち";
}
function emptyPlotStatus(state: State, id: GuildPlotId) {
  const plot = state.guild?.plots[id],
    crop = guildCrops.find((c) => c.id === plot?.crop);
  if (!crop) return "植える作物を選ぶ";
  if (plot?.replant === false) return "収穫済み";
  return guildStock(state, crop.seed) < 1 ? "種切れ" : "次の植え直し待ち";
}
export function workStatus(state: State, now: number) {
  const work = state.guild?.work;
  if (!work) return "作るものを選ぶ";
  if (!state.guild?.roles.workbench) return "一時停止・担当待ち";
  if (work.batch)
    return work.batch.readyAt > now ? remainingLabel(work.batch.readyAt, now) : "在庫の空き待ち";
  const recipe = guildRecipes.find((r) => r.id === work.recipe);
  if (recipe && Object.entries(recipe.ingredients).some(([id, n]) => guildStock(state, id) < n))
    return "材料待ち";
  return "在庫の空き待ち";
}

export function workbenchMarkerStatus(state: State, now: number): HomeMarkerStatus | undefined {
  const work = state.guild?.work;
  if (!work) return undefined;
  const status = workStatus(state, now);
  return {
    text: status === "材料待ち" ? "材料不足" : status,
    warning: !work.batch || !state.guild?.roles.workbench || work.batch.readyAt <= now,
    progress: work.batch ? workProgress(state, now) : undefined,
  };
}
