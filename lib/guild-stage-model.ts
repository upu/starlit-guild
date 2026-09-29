import type { State } from "./game.ts";
import type { GuildPlotId } from "./guild-content.ts";
export type GuildSite = "home" | "linde" | "brekka";
export const guildStageLayout = {
  bench: { x: 720, y: 390, width: 290 },
  worker: { x: 520, y: 365 },
  table: { x: 260, y: 520, width: 255 },
  plots: {
    "linde-1": { x: 295, y: 385, width: 365 },
    "linde-2": { x: 690, y: 625, width: 365 },
    "brekka-1": { x: 460, y: 555, width: 490 },
  },
};
export function guildStagePlots(site: GuildSite): GuildPlotId[] {
  return site === "home" ? [] : site === "linde" ? ["linde-1", "linde-2"] : ["brekka-1"];
}
const starts = [
  [115, 600],
  [460, 560],
  [570, 675],
  [250, 685],
  [820, 680],
];
const ends = [
  [230, 640],
  [570, 630],
  [470, 705],
  [355, 680],
  [755, 710],
];
function routeEndpoints(index: number, site: GuildSite) {
  if (site === "home") return [starts[index % starts.length], ends[index % ends.length]];
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
  const [a, b] = routeEndpoints(index, site);
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
    left: walking
      ? to[0] < from[0] !== returning
      : site === "brekka" || (site === "linde" && t === 0),
  };
}
export function guildStagePeople(state: State, site: GuildSite) {
  const roles = state.guild?.roles ?? {};
  return site === "home"
    ? state.owned.filter((id) => !Object.values(roles).includes(id))
    : roles[site]
      ? [roles[site]]
      : [];
}
