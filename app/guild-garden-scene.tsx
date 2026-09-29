import type { State } from "@/lib/game";
import type { GuildPlotId } from "@/lib/guild-content";
import { GuildResidents } from "./guild-residents";
import { GuildStageFloor } from "./guild-stage-floor";
import { GuildPlotView } from "./guild-plot-view";
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
        <GuildStageFloor garden moss={site === "brekka"} />
        {plots.map((id) => (
          <GuildPlotView key={id} state={state} now={now} id={id} onOpen={onPlot} />
        ))}
        <GuildResidents state={state} site={site} />
      </div>
    </>
  );
}
