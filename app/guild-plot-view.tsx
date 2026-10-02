import { guildCropSlots, guildCropWidth } from "@/lib/guild-stage-model";
import { Plus } from "lucide-react";
import { guildCrops, type GuildPlotId } from "@/lib/guild-content";
import type { GuildPlot } from "@/lib/guild-types";
import type { State } from "@/lib/game";
import { timeRemaining } from "./guild-controls";
import { GuildPropImage } from "./guild-prop-image";
export const plotName = (id: GuildPlotId) =>
  id === "brekka-1" ? "苔床" : `プランター ${id.slice(-1)}`;
export function plotGrowth(plot: GuildPlot | undefined, now: number) {
  const batch = plot?.batch;
  return batch
    ? Math.min(
        1,
        Math.max(0, (now - batch.startedAt) / Math.max(1, batch.readyAt - batch.startedAt)),
      )
    : 0;
}
function PlantSprite({
  crop,
  growth,
  x,
  y,
}: {
  crop?: string;
  growth: number;
  x: number;
  y: number;
}) {
  const size = 240 * guildCropWidth(growth);
  return (
    <GuildPropImage
      frame={crop === "carrot" ? 4 : crop === "moss" ? 5 : 3}
      preserveAspectRatio="xMidYMax meet"
      x={x - size / 2}
      y={y - size}
      width={size}
      height={size}
    />
  );
}
export function GuildPlotArt({
  crop,
  growth,
  planted,
}: {
  crop?: string;
  growth: number;
  planted: boolean;
}) {
  return (
    <svg viewBox="0 0 240 140" aria-hidden="true">
      <GuildPropImage frame={2} width="240" height="140" />
      {planted &&
        guildCropSlots.map((slot, n) => (
          <PlantSprite key={n} crop={crop} growth={growth} x={240 * slot.x} y={140 * slot.y} />
        ))}
    </svg>
  );
}
export function GuildPlotView({
  state,
  id,
  now,
  onOpen,
}: {
  state: State;
  id: GuildPlotId;
  now: number;
  onOpen: (id: GuildPlotId) => void;
}) {
  const plot = state.guild?.plots[id],
    growth = plotGrowth(plot, now);
  const crop = guildCrops.find((item) => item.id === plot?.crop);
  return (
    <button
      className={`guild-live-plot plot-${id}`}
      aria-label={plotName(id)}
      data-guild-control={id}
      onClick={() => {
        onOpen(id);
      }}
    >
      <GuildPlotArt crop={plot?.crop} growth={growth} planted={!!plot?.batch} />
      {!plot?.batch && <Plus className="guild-empty-plot" size={25} aria-hidden="true" />}
      {plot?.batch && (
        <span className="guild-plot-meter">
          <span>
            <b>
              {crop?.name} {Math.floor(growth * 100)}%
            </b>
            <small>{timeRemaining(plot.batch.readyAt, now)}</small>
          </span>
          <progress aria-label={`${plotName(id)}の成長`} value={growth} max={1} />
        </span>
      )}
    </button>
  );
}
