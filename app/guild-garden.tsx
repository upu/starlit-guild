import { Repeat, Clock3 } from "lucide-react";
import { guildCrops, openGuildPlots, plotRole, type GuildPlotId } from "@/lib/guild-content";
import { guildStock } from "@/lib/guild-production";
import { GuildRolePicker, type GuildProps } from "./guild-controls";
import { gardenStatus } from "@/lib/guild-ui-status";
import { GuildItemIcon } from "./guild-item-icon";
import { GuildPlotArt, plotGrowth } from "./guild-plot-view";

type GardenProps = GuildProps & {
  id: GuildPlotId;
  now: number;
  onShop: () => void;
  selected?: string;
  onSelect: (id: string) => void;
};
export function GuildGarden({ id, now, onShop, selected, onSelect, ...props }: GardenProps) {
  const { state, ready, onAction } = props,
    plot = state.guild?.plots[id];
  const crops = guildCrops.filter((crop) => crop.role === plotRole(id));
  const selection = selected ?? crops[0].id;
  const crop =
    guildCrops.find((item) => item.id === (plot?.batch ? plot.crop : selection)) ?? crops[0];
  return (
    <section className="guild-planting">
      <div className="guild-plot-preview">
        <GuildPlotArt crop={plot?.crop} growth={plotGrowth(plot, now)} planted={!!plot?.batch} />
      </div>
      <GuildRolePicker {...props} role={plotRole(id)} />
      {plot?.batch ? (
        <div className="guild-growing-status">
          <b>
            {crop.name} {Math.floor(plotGrowth(plot, now) * 100)}%
          </b>
          <span>
            {gardenStatus(state, id, now)} · 収穫 ×{plot.batch.quantity}
          </span>
        </div>
      ) : openGuildPlots.includes(id) ? (
        <>
          <SeedChoice {...props} id={id} selection={selection} onSelect={onSelect} />
          <div className="guild-growing-status">
            <span>
              <Clock3 size={15} />
              基本{crop.minutes}分
            </span>
            <span>種 ×{guildStock(state, crop.seed)}</span>
          </div>
          <button
            className="guild-primary"
            disabled={!ready || guildStock(state, crop.seed) < 1}
            onClick={() => {
              onAction({ type: "guildPlant", id, name: crop.id });
            }}
          >
            植える
          </button>
        </>
      ) : (
        <p className="guild-production-note">このプランターの栽培は終了しました。</p>
      )}
      {openGuildPlots.includes(id) ? (
        <ReplantToggle {...props} id={id} />
      ) : (
        <p className="guild-production-note">以前の栽培分です。今回の収穫で終了します。</p>
      )}
      <p className="guild-production-note">育った作物は担当が自動で収穫し、在庫に入れます。</p>
      <button className="guild-supply-link" onClick={onShop}>
        種を買う
      </button>
    </section>
  );
}

function SeedChoice({
  state,
  ready,
  id,
  selection,
  onSelect,
}: GuildProps & {
  id: GuildPlotId;
  selection: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="guild-seeds" role="group" aria-label={`${id}の作物`}>
      {guildCrops
        .filter((crop) => crop.role === plotRole(id))
        .map((item) => (
          <button
            key={item.id}
            className="guild-item-tile"
            aria-label={item.name}
            aria-pressed={selection === item.id}
            disabled={!ready}
            onClick={() => {
              onSelect(item.id);
            }}
          >
            <GuildItemIcon id={item.seed} />
            <b>{item.name}</b>
            <span className="guild-stock">{guildStock(state, item.seed)}</span>
          </button>
        ))}
    </div>
  );
}

function ReplantToggle({ state, ready, onAction, id }: GuildProps & { id: GuildPlotId }) {
  const plot = state.guild?.plots[id];
  return (
    <button
      className="guild-repeat"
      aria-label="収穫後に同じ作物を植え直す"
      aria-pressed={plot?.replant !== false}
      disabled={!ready}
      onClick={() => {
        onAction({ type: "guildReplant", id, value: plot?.replant === false });
      }}
    >
      <Repeat size={18} />
      <span>植え直し</span>
      <b>{plot?.replant !== false ? "ON" : "OFF"}</b>
    </button>
  );
}
