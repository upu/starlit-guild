import { Plus } from "lucide-react";
import { guildCrops, type GuildPlotId } from "@/lib/guild-content";
import type { GuildPlot } from "@/lib/guild-types";
import type { State } from "@/lib/game";
import { timeRemaining } from "./guild-controls";
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
function Sprig({ crop, growth }: { crop?: string; growth: number }) {
  if (crop === "moss")
    return (
      <g transform={`scale(${String(0.5 + growth * 0.5)})`}>
        <path
          d="M-18 0q-9-10 0-14-2-12 11-10 5-9 14-2 13-4 13 9 11 6 2 16Z"
          fill="#83ba86"
          stroke="#496f54"
          strokeWidth="2"
        />
        <path d="m-12-5 5-6m11 2 5-6" stroke="#b5d2a0" strokeWidth="3" />
      </g>
    );
  return (
    <g transform={`scale(${String(0.4 + growth * 0.6)})`}>
      <path d="M0 0v-29m0 17-13-10M0-18l13-13" stroke="#6a8138" strokeWidth="3" />
      <path
        d="M-1-9Q-26-11-21-29Q-2-28-1-9M1-21Q-2-42 19-43Q27-28 1-21M0-1Q5-21 21-18Q22-1 0-1"
        fill={crop === "carrot" ? "#78a843" : "#7fb368"}
        stroke="#47713a"
        strokeWidth="1.5"
      />
      {growth > 0.65 && crop === "carrot" && (
        <path d="M-7-2Q0-10 7-2L0 12Z" fill="#eeb066" stroke="#a56a38" strokeWidth="1.5" />
      )}
      {growth > 0.7 && crop === "herb" && (
        <path d="M-13-16h6m-3-3v6" stroke="#e4e5bb" strokeWidth="2" />
      )}
    </g>
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
      <ellipse cx="125" cy="122" rx="108" ry="14" fill="#17302544" />
      <path d="m13 26 202-12 20 86-201 22Z" fill="#543f2c" stroke="#ad8754" strokeWidth="9" />
      <path
        d="m30 38 177-12m-170 25 174-12m-170 29 172-16m-170 32 171-17"
        stroke="#68513a"
        strokeWidth="3"
      />
      {planted &&
        [48, 95, 142, 190].flatMap((x, index) =>
          [0, 1].map((row) => (
            <g
              key={`${String(index)}-${String(row)}`}
              transform={`translate(${String(x + row * 5)} ${String(60 + row * 34 - index * 3)})`}
            >
              <Sprig crop={crop} growth={growth} />
            </g>
          )),
        )}
      <path
        d="m13 26 21 96 201-22v14L30 138 8 42Z"
        fill="#9c7145"
        stroke="#654a32"
        strokeWidth="3"
      />
      <path d="m34 122 201-22M18 49l16 73v15" fill="none" stroke="#d0a16c" strokeWidth="3" />
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
