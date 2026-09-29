import type { State } from "@/lib/game";
import type { GuildPlotId } from "@/lib/guild-content";
import { PhaserGuild } from "./phaser-guild";
import { GuildDutyFace } from "./guild-duty-marker";
import { GuildPlotView } from "./guild-plot-view";
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
  const plots: GuildPlotId[] = site === "linde" ? ["linde-1", "linde-2"] : ["brekka-1"];
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
      <div className={`guild-scene guild-garden-scene garden-${site}`}>
        <PhaserGuild state={state} now={now} site={site} />
        {plots.map((id) => (
          <GuildPlotView key={id} state={state} now={now} id={id} onOpen={onPlot} />
        ))}
        <button
          className="guild-duty-marker"
          data-guild-control="roles"
          aria-label={`${gardenSites[site]}の担当を選ぶ`}
          onClick={onRoles}
        >
          <GuildDutyFace id={state.guild?.roles[site]} />
        </button>
      </div>
    </>
  );
}
