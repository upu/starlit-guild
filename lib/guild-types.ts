import type { GuildPlotId, GuildRole } from "./guild-content.ts";
export type GuildBatch = { startedAt: number; readyAt: number; quantity: number };
export type GuildPlot = { crop?: string; batch?: GuildBatch; replant?: boolean };
export type GuildWork = {
  recipe: string;
  remaining: number | null;
  batch?: GuildBatch;
  pausedMs?: number;
};
export type GuildState = {
  lastAt: number;
  materials: Record<string, number>;
  roles: Partial<Record<GuildRole, string>>;
  plots: Record<GuildPlotId, GuildPlot>;
  cultivation: number;
  crafting: number;
  work?: GuildWork;
};
export function initialGuild(now: number): GuildState {
  return {
    lastAt: now,
    materials: {},
    roles: {},
    plots: { "linde-1": {}, "linde-2": {}, "brekka-1": {} },
    cultivation: 0,
    crafting: 0,
  };
}
