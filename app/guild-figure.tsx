import { useId } from "react";
import { guildPose } from "./phaser/guild-art";
import type { TravellerId } from "@/lib/road-view";
export function isGuildFigure(id: string): id is TravellerId {
  return ["aria", "leon", "mira", "finn", "lico"].includes(id);
}
/** Reuse the adventure atlas and its crop bounds; keep simulation out of the illustration. */
export function GuildFigure({
  id,
  working = false,
  facing = false,
  walking = false,
  crafting = false,
}: {
  id: TravellerId;
  working?: boolean;
  facing?: boolean;
  walking?: boolean;
  crafting?: boolean;
}) {
  return (
    <span
      className={`guild-figure${working || crafting ? " is-working" : ""}${facing ? " faces-left" : ""}${walking ? " is-walking" : ""}`}
      aria-hidden="true"
      data-hero={id}
    >
      {[0, 1].map((step) => {
        const frame = guildPose(
          id,
          crafting ? "craft" : walking ? "walk" : working ? "tend" : "idle",
          step,
        );
        return <GuildPose key={step} frame={frame} step={step} />;
      })}
    </span>
  );
}

function GuildPose({ frame, step }: { frame: ReturnType<typeof guildPose>; step: number }) {
  const clip = useId();
  const [x, y, width, height] = frame.rect;
  return (
    <svg
      className={`guild-pose guild-pose-${String(step)}`}
      viewBox={frame.rect.join(" ")}
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <clipPath id={clip}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      <image
        href={frame.asset}
        width={frame.width}
        height={frame.height}
        clipPath={`url(#${clip})`}
      />
    </svg>
  );
}
