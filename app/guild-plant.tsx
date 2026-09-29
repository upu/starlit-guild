import type { GuildPlot } from "@/lib/guild-types";
import { guildCrops } from "@/lib/guild-content";

export function GuildPlant({ plot, index, now }: { plot?: GuildPlot; index: number; now: number }) {
  if (!plot?.batch) return null;
  const growth = Math.min(
    1,
    Math.max(
      0,
      (now - plot.batch.startedAt) / Math.max(1, plot.batch.readyAt - plot.batch.startedAt),
    ),
  );
  const crop = guildCrops.find((item) => item.id === plot.crop);
  return (
    <div
      className={`guild-growing guild-growing-${String(index)}${plot.crop === "moss" ? " is-moss" : ""}`}
      role="img"
      aria-label={`${crop?.name ?? "作物"}：${growth >= 1 ? "収穫待ち" : "生育中"}`}
    >
      {[0, 1, 2].map((plant) => (
        <svg
          key={plant}
          viewBox="0 0 50 70"
          style={{ transform: `scale(${String(0.45 + growth * 0.55)})` }}
          aria-hidden="true"
        >
          {plot.crop === "moss" ? (
            <path
              d="M3 60Q0 48 9 47Q5 35 17 37Q21 27 30 36Q41 32 42 44Q53 47 47 60Z"
              fill="#6da68a"
              stroke="#3c7056"
              strokeWidth="2"
            />
          ) : (
            <g>
              <path d="M25 63V22" stroke="#436a27" strokeWidth="3" />
              <path
                d="M25 43C6 44 3 30 7 20C23 21 26 29 25 43M25 33C24 13 36 9 44 7C49 22 40 32 25 33M25 55C8 58 3 46 2 40C15 34 25 41 25 55M25 49C34 31 43 35 48 39C43 51 34 54 25 49"
                fill={growth > 0.6 ? "#79a43e" : "#abc85a"}
                stroke="#3f642a"
                strokeWidth="1.5"
              />
              {plot.crop === "carrot" && growth > 0.6 && (
                <path d="M19 55Q25 48 31 55L25 69Z" fill="#e8a146" />
              )}
            </g>
          )}
        </svg>
      ))}
      {growth >= 1 && (
        <span className="guild-ripe-glow" aria-hidden="true">
          ✦
        </span>
      )}
    </div>
  );
}
