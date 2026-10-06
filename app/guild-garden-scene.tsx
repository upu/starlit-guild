import type { State } from "@/lib/game";
import { guildPlots, guildCrops, type GuildPlotId } from "@/lib/guild-content";
import { residentIds } from "@/lib/home-actor";
import { HomeRoom } from "./home-room";
import { plotGrowth, plotName } from "./guild-plot-view";
import { heroes } from "@/lib/game";
import { gardenStatus } from "@/lib/guild-ui-status";
import { GuildDutyFace } from "./guild-duty-marker";
import { GuildItemIcon } from "./guild-item-icon";
export type GardenSite = "linde" | "brekka";
export const gardenSites = { linde: "リンデの菜園", brekka: "ブレッカの栽培所" };
export function GuildGardenScene({
  state,
  now,
  site,
  onSite,
  onPlot,
  onRoles,
}: {
  state: State;
  now: number;
  site: GardenSite;
  onSite: (site: GardenSite) => void;
  onPlot: (id: GuildPlotId) => void;
  onRoles: () => void;
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
        onUse={(id) => {
          const plot = plots.find((p) => p === id);
          if (plot) onPlot(plot);
        }}
      />
      <GardenButtons
        plots={plots}
        state={state}
        now={now}
        onPlot={onPlot}
        onRoles={onRoles}
        site={site}
      />
    </>
  );
}

function GardenButtons({
  plots,
  state,
  now,
  onPlot,
  onRoles,
  site,
}: {
  plots: GuildPlotId[];
  state: State;
  now: number;
  onPlot: (id: GuildPlotId) => void;
  onRoles: () => void;
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
            data-guild-control={id}
            aria-label={plotName(id)}
            onClick={() => {
              onPlot(id);
            }}
          >
            <GuildItemIcon id={crop?.output ?? (site === "brekka" ? "moss-spore" : "herb-seed")} />
            <span className="guild-facility-copy">
              <small>{plotName(id)}</small>
              <b>{crop?.name ?? "＋ 植える"}</b>
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
      <GardenDuty state={state} site={site} onRoles={onRoles} />
    </div>
  );
}

function GardenDuty({
  state,
  site,
  onRoles,
}: {
  state: State;
  site: GardenSite;
  onRoles: () => void;
}) {
  return (
    <button
      data-guild-control="roles"
      className="guild-facility-card guild-garden-duty"
      aria-label={`${gardenSites[site]}の担当を選ぶ`}
      onClick={onRoles}
    >
      <GuildDutyFace id={state.guild?.roles[site]} />
      <span className="guild-facility-copy">
        <b>{heroes.find((h) => h.id === state.guild?.roles[site])?.name ?? "＋"}</b>
        <small>{state.guild?.roles[site] ? "担当を変更" : "担当：未選択"}</small>
      </span>
    </button>
  );
}
