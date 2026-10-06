import type { State } from "@/lib/game";
import { guildPlots, guildCrops, type GuildPlotId } from "@/lib/guild-content";
import { residentIds } from "@/lib/home-actor";
import { HomeRoom } from "./home-room";
import { plotGrowth, plotName } from "./guild-plot-view";
import { gardenStatus } from "@/lib/guild-ui-status";
import { GuildItemIcon } from "./guild-item-icon";
export type GardenSite = "linde" | "brekka";
export const gardenSites = { linde: "リンデの菜園", brekka: "ブレッカの栽培所" };
export function GuildGardenScene({
  state,
  now,
  site,
  onSite,
  onPlot,
}: {
  state: State;
  now: number;
  site: GardenSite;
  onSite: (site: GardenSite) => void;
  onPlot: (id: GuildPlotId) => void;
}) {
  const plots = guildPlots.filter((id) => id.startsWith(site));
  const members = residentIds.filter((id) => id === state.guild?.roles[site]);
  const growth = Object.fromEntries(
    plots
      .filter((id) => state.guild?.plots[id].crop)
      .map((id) => [id, plotGrowth(state.guild?.plots[id], now)]),
  );
  return (
    <>
      <nav className="guild-location-nav" aria-label="栽培地を選ぶ">
        {Object.entries(gardenSites).map(([id, label]) => (
          <button
            key={id}
            aria-pressed={site === id}
            onClick={() => {
              onSite(id as GardenSite);
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      <HomeRoom
        key={site}
        site={site}
        members={members}
        growth={growth}
        markers={plots.map((id) => ({
          id,
          control: id,
          label: plotName(id),
          hero: state.guild?.roles[site],
        }))}
        onUse={(id) => {
          const plot = plots.find((p) => p === id);
          if (plot) onPlot(plot);
        }}
      />
      <GardenButtons plots={plots} state={state} now={now} onPlot={onPlot} site={site} />
    </>
  );
}

function GardenButtons({
  plots,
  state,
  now,
  onPlot,
  site,
}: {
  plots: GuildPlotId[];
  state: State;
  now: number;
  onPlot: (id: GuildPlotId) => void;
  site: GardenSite;
}) {
  return (
    <div className="guild-production-cards">
      {plots.map((id) => {
        const plot = state.guild?.plots[id],
          crop = guildCrops.find((c) => c.id === plot?.crop);
        return (
          <button
            key={id}
            className="guild-facility-card guild-plot-card"
            aria-label={`${plotName(id)}の詳細`}
            onClick={() => {
              onPlot(id);
            }}
          >
            <GuildItemIcon id={crop?.output ?? (site === "brekka" ? "moss-spore" : "herb-seed")} />
            <span className="guild-facility-copy">
              <small>{plotName(id)}</small>
              <b>{crop?.name ?? "空き"}</b>
              <small>{gardenStatus(state, id, now)}</small>
              {plot?.batch && (
                <span>
                  <progress
                    aria-label={`${plotName(id)}の成長`}
                    value={plotGrowth(plot, now)}
                    max={1}
                  />
                  {Math.floor(plotGrowth(plot, now) * 100)}% · 収穫 ×{plot.batch.quantity}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
