import { Repeat, Clock3 } from "lucide-react";
import { useState } from "react";
import { guildCrops, plotRole, type GuildPlotId } from "@/lib/guild-content";
import { guildStock } from "@/lib/guild-production";
import { timeRemaining, type GuildProps } from "./guild-controls";
import { GuildItemIcon } from "./guild-item-icon";
import { GuildPlotArt, plotGrowth } from "./guild-plot-view";

export function GuildGarden({ id, now, ...props }: GuildProps & { id: GuildPlotId; now: number }) {
  const { state, ready, onAction } = props,
    plot = state.guild?.plots[id];
  const crops = guildCrops.filter((crop) => crop.role === plotRole(id));
  const [selection, setSelection] = useState<string>(crops[0].id);
  const crop =
    guildCrops.find((item) => item.id === (plot?.batch ? plot.crop : selection)) ?? crops[0];
  return (
    <section className="guild-planting">
      <div className="guild-plot-preview">
        <GuildPlotArt crop={plot?.crop} growth={plotGrowth(plot, now)} planted={!!plot?.batch} />
      </div>
      {plot?.batch ? (
        <div className="guild-growing-status">
          <b>
            {crop.name} {Math.floor(plotGrowth(plot, now) * 100)}%
          </b>
          <span>
            {timeRemaining(plot.batch.readyAt, now)} · ×{plot.batch.quantity}
          </span>
        </div>
      ) : (
        <>
          <SeedChoice {...props} id={id} selection={selection} onSelect={setSelection} />
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
      )}
      <ReplantToggle {...props} id={id} />
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
