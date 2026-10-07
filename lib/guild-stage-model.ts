import type { State } from "./game.ts";
import { openGuildPlots, type GuildPlotId } from "./guild-content.ts";
export type GuildSite = "home" | "linde" | "brekka";
export const guildStageLayout = {
  bench: { x: 765, y: 350, width: 330 },
  worker: { x: 555, y: 350 },
  table: { x: 395, y: 610, width: 330 },
  desk: { x: 240, y: 310, width: 300 },
  plots: {
    "linde-1": { x: 295, y: 385, width: 365 },
    "linde-2": { x: 690, y: 625, width: 365 },
    "brekka-1": { x: 460, y: 555, width: 490 },
  },
};
export function guildStagePlots(site: GuildSite): GuildPlotId[] {
  return openGuildPlots.filter((id) => id.startsWith(site));
}
export const guildSeats = [
  { x: 175, y: 555, left: false },
  { x: 610, y: 550, left: true },
  { x: 220, y: 695, left: false },
  { x: 565, y: 700, left: true },
  { x: 385, y: 425, left: false },
];
// Root anchors and mature plant widths stay inside the soil, above the front timber.
export const guildCropSlots = Array.from({ length: 8 }, (_, index) => ({
  x: 0.2 + (index % 4) * 0.2,
  y: index < 4 ? 0.35 : 0.55,
}));
export function guildCropWidth(growth: number) {
  return 0.075 + Math.max(0, Math.min(1, growth)) * 0.045;
}
export function guildMotion(time: number, walking: boolean, reduced: boolean) {
  if (!walking || reduced) return { lift: 0, angle: 0 };
  const phase = (time / 640) * Math.PI * 2;
  return { lift: Math.abs(Math.sin(phase)) * 7, angle: Math.sin(phase) * 1.6 };
}
function routeEndpoints(site: GuildSite) {
  return site === "linde"
    ? [
        [555, 365],
        [460, 615],
      ]
    : [
        [765, 490],
        [755, 300],
      ];
}
function routeProgress(phase: number) {
  if (phase < 5500) return 0;
  if (phase < 10000) return (phase - 5500) / 4500;
  if (phase < 17000) return 1;
  if (phase < 21500) return 1 - (phase - 17000) / 4500;
  return 0;
}
export function guildRoute(index: number, site: GuildSite, time: number, reduced: boolean) {
  if (site === "home") return { ...guildSeats[index % guildSeats.length], walking: false };
  const [a, b] = routeEndpoints(site);
  const phase = reduced ? 0 : time % 24000,
    t = routeProgress(phase);
  const returning = phase >= 17000 && phase < 21500;
  const walking = (phase >= 5500 && phase < 10000) || returning;
  // Pass the inner corner before walking down beside the second planter.
  const corner = site === "linde" ? [460, 410] : [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const from = t < 0.5 ? a : corner,
    to = t < 0.5 ? corner : b,
    amount = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  return {
    x: from[0] + (to[0] - from[0]) * amount,
    y: from[1] + (to[1] - from[1]) * amount,
    walking,
    left: walking ? to[0] < from[0] !== returning : site === "brekka" || t === 0,
  };
}
export function guildStagePeople(state: State, site: GuildSite, now = state.updatedAt) {
  const roles = state.guild?.roles ?? {};
  return site === "home"
    ? state.owned.filter(
        (id) =>
          id !== roles.linde &&
          id !== roles.brekka &&
          (id !== roles.workbench || !guildWorkActive(state, now)),
      )
    : roles[site]
      ? [roles[site]]
      : [];
}

export function guildWorkActive(state: State, now: number) {
  const work = state.guild?.work;
  return (
    !!state.guild?.roles.workbench &&
    !!work?.batch &&
    work.batch.readyAt > now &&
    work.pausedMs === undefined
  );
}
